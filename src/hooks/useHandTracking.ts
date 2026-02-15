import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

interface HandState {
  isGunGesture: boolean;
  crosshairX: number;
  crosshairY: number;
  isBang: boolean;
  isShooting: boolean; // New: indicates shooting animation in progress
  rawX: number;
  rawY: number;
}

// Low-pass filter for smoothing (0.1 = very smooth/slow, 0.9 = responsive/jittery)
// Using 0.3 for hand tracking and 0.15 for return-to-center for optimal 60fps smoothness
const SMOOTHING_FACTOR = 0.3;
const SHOOTING_FREEZE_DURATION = 400; // ms to freeze crosshair during shooting

function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor;
}

export function useHandTracking(videoRef: RefObject<HTMLVideoElement>, isTrackingEnabled: boolean) {
  const [handState, setHandState] = useState<HandState>({
    isGunGesture: false,
    crosshairX: 0.5,
    crosshairY: 0.5,
    isBang: false,
    isShooting: false,
    rawX: 0.5,
    rawY: 0.5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastIndexYRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const bangCooldownRef = useRef<boolean>(false);
  const lastVelocityRef = useRef<number>(0); // Track velocity for acceleration calculation

  // Refs for smoothing to avoid dependency loops in detection loop
  const currentX = useRef(0.5);
  const currentY = useRef(0.5);

  // Frozen position during shooting
  const frozenX = useRef(0.5);
  const frozenY = useRef(0.5);
  const isShootingRef = useRef(false);

  // Steady position tracking - last stable hand position
  const steadyX = useRef(0.5);
  const steadyY = useRef(0.5);
  const lastX = useRef(0.5);
  const lastY = useRef(0.5);

  const isGunGesture = useCallback((landmarks: any[]) => {
    // Landmarks:
    // 0: Wrist
    // 4: Thumb tip
    // 8: Index tip
    // 12: Middle tip
    // 16: Ring tip
    // 20: Pinky tip

    // Calculate distances from wrist to fingertips to determine if curled
    // Simple logic: extended fingers are far from wrist, curled are close

    const wrist = landmarks[0];

    function dist(p1: any, p2: any) {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    const indexDist = dist(wrist, landmarks[8]);
    const middleDist = dist(wrist, landmarks[12]);
    const ringDist = dist(wrist, landmarks[16]);
    const pinkyDist = dist(wrist, landmarks[20]);

    // Index should be extended (significantly further than curled fingers)
    const indexExtended = indexDist > middleDist && indexDist > ringDist && indexDist > pinkyDist;

    // Middle, Ring, Pinky should be curled (closer to wrist than PIP joints optionally, or just relatively close)
    // Checking against their own PIP joints (6, 10, 14, 18) is reduced to simple relative check:
    // For a gun, index is main pointer.

    // Better check: Index tip(8) dist > Index PIP(6) dist (implied by geometry usually)
    // Check if middle(12) is closer to wrist than middle MCP(9) - roughly

    const middleCurled = landmarks[12].y > landmarks[10].y; // coordinate space: y increases downwards? 
    // Actually, simple bounding box, or just checking if index is the most accurate pointer.

    // Let's use the provided logic but relaxed
    // Index finger extended: tip (8) distance from wrist > PIP (6) distance from wrist
    // And generally index is the "highest" point (lowest y) or furthest point.

    // REVISED LOGIC:
    // 1. Index finger is extended.
    // 2. Middle, Ring, Pinky are curled.

    // Helper to check extension based on distance from wrist
    const isExtended = (tipIdx: number, pipIdx: number) => {
      return dist(wrist, landmarks[tipIdx]) > dist(wrist, landmarks[pipIdx]) * 1.2;
    };

    const isCurled = (tipIdx: number, pipIdx: number) => {
      return dist(wrist, landmarks[tipIdx]) < dist(wrist, landmarks[pipIdx]); // tip closer than pip or very close
    };

    // Index must be extended
    const validIndex = isExtended(8, 6);

    // Middle, Ring, Pinky should be curled or at least not fully extended like index
    // We can be lenient: sum of their extensions should be low
    const otherFingersfolded =
      dist(wrist, landmarks[12]) < indexDist * 0.8 &&
      dist(wrist, landmarks[16]) < indexDist * 0.8 &&
      dist(wrist, landmarks[20]) < indexDist * 0.8;

    return validIndex && otherFingersfolded;
  }, []);


  const detectBang = useCallback((landmarks: any[], timestamp: number) => {
    const thumbTipY = landmarks[4].y;
    // Bang is detected by thumb moving UP quickly (flick motion - thumb goes UP not down!)

    const timeDelta = timestamp - lastTimestampRef.current;

    if (timeDelta > 0 && lastTimestampRef.current > 0) {
      // NEGATIVE velocityY = moving UP (y decreases when moving upward in normalized coords)
      const velocityY = (thumbTipY - lastIndexYRef.current) / (timeDelta / 1000);

      // Calculate acceleration for more reliable detection
      const prevVelocity = lastVelocityRef.current || 0;
      const acceleration = (velocityY - prevVelocity) / (timeDelta / 1000);
      lastVelocityRef.current = velocityY;

      // Log thumb movement for debugging (only significant movement)
      if (Math.abs(velocityY) > 0.2) {
        console.log('Thumb velocity:', velocityY.toFixed(2), velocityY < 0 ? '(UP)' : '(DOWN)',
          'Accel:', acceleration.toFixed(2));
      }

      // OPTIMIZED: Detect UPWARD movement (negative velocity)
      // Lowered threshold from -0.6 to -0.4 for easier, more responsive detection
      // Also check for sudden acceleration upward for snap flicks
      const isUpwardFlick = velocityY < -0.4;
      const isSnapFlick = velocityY < -0.25 && acceleration < -5; // Sudden upward acceleration

      if ((isUpwardFlick || isSnapFlick) && !bangCooldownRef.current) {
        bangCooldownRef.current = true;
        // Reduced cooldown from 500ms to 300ms for faster repeated shots
        setTimeout(() => { bangCooldownRef.current = false; }, 300);
        lastIndexYRef.current = thumbTipY;
        lastTimestampRef.current = timestamp;
        console.log('🎯 BANG! Thumb flicked UPWARD, velocity:', velocityY.toFixed(2),
          'accel:', acceleration.toFixed(2));
        return true;
      }
    }

    lastIndexYRef.current = thumbTipY;
    lastTimestampRef.current = timestamp;
    return false;
  }, []);

  // Initialize MediaPipe
  useEffect(() => {
    let cancelled = false;

    // If permission not granted yet, don't start vision
    if (!isTrackingEnabled) return;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;

        // Start camera
        console.log('📷 Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
        });

        console.log('✅ Camera permission granted');

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        setIsLoading(false);
        setPermissionGranted(true);

        // Detection loop
        let lastVideoTime = -1;
        function detect() {
          if (cancelled) return;
          const video = videoRef.current;
          if (!video || video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(detect);
            return;
          }

          const now = performance.now();
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;

            // Safe check for handle
            if (!handLandmarkerRef.current) return;


            const results = handLandmarkerRef.current.detectForVideo(video, now);

            if (results && results.landmarks && results.landmarks.length > 0) {
              const lm = results.landmarks[0];
              const gunDetected = isGunGesture(lm);

              // Only detect bang if gun is detected
              const bang = gunDetected ? detectBang(lm, now) : false;

              // Mirror X for cursor (index finger tip)
              const targetX = 1 - lm[8].x;
              const targetY = lm[8].y;

              // If shooting, freeze at the STEADY position (not current jittery position)
              if (bang && !isShootingRef.current) {
                isShootingRef.current = true;
                // Use steady position for shooting, not current position
                frozenX.current = steadyX.current;
                frozenY.current = steadyY.current;

                console.log('🔒 Crosshair FROZEN at steady position:', {
                  x: steadyX.current.toFixed(3),
                  y: steadyY.current.toFixed(3)
                });

                // Unfreeze after shooting animation
                setTimeout(() => {
                  isShootingRef.current = false;
                  console.log('🔓 Crosshair UNFROZEN, resuming tracking');
                }, SHOOTING_FREEZE_DURATION);
              }

              // Only update position if not currently shooting
              if (!isShootingRef.current) {
                // Smooth coordinates - OPTIMIZED: Increased from 0.3 to 0.5 for faster response
                currentX.current = lerp(currentX.current, targetX, 0.5);
                currentY.current = lerp(currentY.current, targetY, 0.5);

                // Detect if hand is steady (not moving much)
                const deltaX = Math.abs(currentX.current - lastX.current);
                const deltaY = Math.abs(currentY.current - lastY.current);
                const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                // If hand is steady (movement < threshold), update steady position
                if (movement < 0.015) { // Very small movement threshold
                  steadyX.current = currentX.current;
                  steadyY.current = currentY.current;
                }

                lastX.current = currentX.current;
                lastY.current = currentY.current;
              }

              // Use frozen position if shooting, otherwise current position
              const displayX = isShootingRef.current ? frozenX.current : currentX.current;
              const displayY = isShootingRef.current ? frozenY.current : currentY.current;

              setHandState({
                isGunGesture: gunDetected,
                crosshairX: displayX,
                crosshairY: displayY,
                isBang: bang,
                isShooting: isShootingRef.current,
                rawX: targetX,
                rawY: targetY
              });
            } else {
              // Hand lost - smoothly return crosshair to center (only if not shooting)
              if (!isShootingRef.current) {
                currentX.current = lerp(currentX.current, 0.5, 0.15);
                currentY.current = lerp(currentY.current, 0.5, 0.15);
              }

              setHandState(prev => ({
                ...prev,
                isGunGesture: false,
                isBang: false,
                isShooting: isShootingRef.current,
                crosshairX: isShootingRef.current ? frozenX.current : currentX.current,
                crosshairY: isShootingRef.current ? frozenY.current : currentY.current
              }));
            }
          }

          animFrameRef.current = requestAnimationFrame(detect);
        }

        detect();
      } catch (err: any) {
        if (!cancelled) {
          console.error('❌ Camera error:', err);
          // Better error messages for common issues
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera permission denied. Please allow camera access and refresh.");
          } else if (err.name === 'NotFoundError') {
            setError("No camera found. Please connect a camera and refresh.");
          } else {
            setError(err.message || "Failed to initialize hand tracking");
          }
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      handLandmarkerRef.current?.close();
    };
  }, [isTrackingEnabled, isGunGesture, detectBang]);

  return { handState, isLoading, error, permissionGranted };
}
