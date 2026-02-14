import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

interface HandState {
  isGunGesture: boolean;
  crosshairX: number;
  crosshairY: number;
  isBang: boolean;
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement>) {
  const [handState, setHandState] = useState<HandState>({
    isGunGesture: false,
    crosshairX: 0.5,
    crosshairY: 0.5,
    isBang: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastIndexYRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const bangCooldownRef = useRef<boolean>(false);

  const isGunGesture = useCallback((landmarks: any[]) => {
    // Index finger extended: tip (8) higher than PIP (6)
    const indexExtended = landmarks[8].y < landmarks[6].y;
    // Thumb extended: tip (4) away from palm
    const thumbExtended = Math.abs(landmarks[4].x - landmarks[3].x) > 0.04 || landmarks[4].y < landmarks[3].y;
    // Middle finger curled: tip (12) below PIP (10)
    const middleCurled = landmarks[12].y > landmarks[10].y;
    // Ring finger curled
    const ringCurled = landmarks[16].y > landmarks[14].y;
    // Pinky curled
    const pinkyCurled = landmarks[20].y > landmarks[18].y;

    return indexExtended && thumbExtended && middleCurled && ringCurled && pinkyCurled;
  }, []);

  const detectBang = useCallback((landmarks: any[], timestamp: number) => {
    const indexTipY = landmarks[8].y;
    const timeDelta = timestamp - lastTimestampRef.current;

    if (timeDelta > 0 && lastTimestampRef.current > 0) {
      const velocityY = (lastIndexYRef.current - indexTipY) / (timeDelta / 1000);
      // Upward flick: sudden upward movement
      if (velocityY > 2.5 && !bangCooldownRef.current) {
        bangCooldownRef.current = true;
        setTimeout(() => { bangCooldownRef.current = false; }, 500);
        lastIndexYRef.current = indexTipY;
        lastTimestampRef.current = timestamp;
        return true;
      }
    }

    lastIndexYRef.current = indexTipY;
    lastTimestampRef.current = timestamp;
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setIsLoading(false);

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
            const results = handLandmarkerRef.current?.detectForVideo(video, now);

            if (results && results.landmarks && results.landmarks.length > 0) {
              const lm = results.landmarks[0];
              const gunDetected = isGunGesture(lm);
              const bang = gunDetected ? detectBang(lm, now) : false;

              // Mirror the x coordinate since camera is mirrored
              setHandState({
                isGunGesture: gunDetected,
                crosshairX: 1 - lm[8].x,
                crosshairY: lm[8].y,
                isBang: bang,
              });
            } else {
              setHandState(prev => ({ ...prev, isGunGesture: false, isBang: false }));
            }
          }

          animFrameRef.current = requestAnimationFrame(detect);
        }

        detect();
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to initialize hand tracking");
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
  }, []);

  return { handState, isLoading, error };
}
