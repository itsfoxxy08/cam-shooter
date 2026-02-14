import { useRef, useState, useEffect } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameHUD from "./GameHUD";
import StartMenu from "./StartMenu";
import PermissionModal from "./PermissionModal";
import Bullet from "./Bullet";

interface TargetState {
  id: number;
  x: number;
  y: number;
  isHit: boolean;
}

interface BulletState {
  id: number;
  x: number;
  y: number;
}

const HIT_RADIUS = 0.08; // % of screen (Increased slightly for easier hits)
const HOVER_RADIUS = 0.08; // Match hit radius - only glow when actually on target

type GameState = 'start' | 'permission' | 'playing';

export default function ShooterGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');

  // Only enable tracking when we are in the permission phase or playing
  const isTrackingEnabled = gameState === 'permission' || gameState === 'playing';

  const { handState, isLoading, error, permissionGranted } = useHandTracking(videoRef, isTrackingEnabled);

  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<TargetState[]>([]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [isHoveringTarget, setIsHoveringTarget] = useState(false);

  const nextTargetIdRef = useRef(0);
  const nextBulletIdRef = useRef(0);

  // Handle Game State Transitions
  useEffect(() => {
    if (gameState === 'permission' && permissionGranted) {
      setGameState('playing');
    }
  }, [gameState, permissionGranted]);

  const handleStartGame = () => {
    setGameState('permission');
  };

  const handleRequestPermission = () => {
    // This is handled by useHandTracking when isTrackingEnabled becomes true
    // But we might need to re-trigger if it failed or permission was denied previously?
    // For now, setting state to permission triggers the hook to try.
  };

  // Spawn targets periodically
  useEffect(() => {
    if (gameState !== 'playing' || isLoading || error) return;

    const interval = setInterval(() => {
      const newTarget: TargetState = {
        id: nextTargetIdRef.current++,
        x: 0.15 + Math.random() * 0.7,
        y: 0.15 + Math.random() * 0.6,
        isHit: false,
      };
      setTargets(prev => {
        // Keep max 4 active targets
        const active = prev.filter(t => !t.isHit);
        if (active.length >= 4) return prev;
        return [...prev.filter(t => !t.isHit), newTarget];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState, isLoading, error]);

  // Detect if crosshair is hovering over a target
  useEffect(() => {
    if (gameState !== 'playing') {
      setIsHoveringTarget(false);
      return;
    }

    const checkHover = () => {
      const isNearTarget = targets.some(target => {
        if (target.isHit) return false;
        const dx = target.x - handState.crosshairX;
        const dy = target.y - handState.crosshairY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < HOVER_RADIUS;
      });
      setIsHoveringTarget(isNearTarget);
    };

    checkHover();
  }, [handState.crosshairX, handState.crosshairY, targets, gameState]);

  // Clean up hit targets after animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTargets(prev => prev.filter(t => !t.isHit));
    }, 400);
    return () => clearTimeout(timeout);
  }, [targets]);

  // Handle bang (Shooting)
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!handState.isBang || !handState.isGunGesture) return;

    // Create a bullet visual
    const newBullet = {
      id: nextBulletIdRef.current++,
      x: handState.crosshairX,
      y: handState.crosshairY
    };
    setBullets(prev => [...prev, newBullet]);

    // Check collisions
    setTargets(prev => {
      let hit = false;
      const updated = prev.map(target => {
        if (target.isHit) return target;
        const dx = target.x - handState.crosshairX;
        const dy = target.y - handState.crosshairY;
        // Aspect ratio correction potentially needed? Assuming 16:9 roughly or relative coords
        // Actually both are 0-1, so plain distance is fine for now
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HIT_RADIUS && !hit) {
          hit = true;
          return { ...target, isHit: true };
        }
        return target;
      });
      if (hit) setScore(s => s + 1);
      return updated;
    });
  }, [handState.isBang, gameState]); // Added gameState dependency

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* UI Overlays */}
      {gameState === 'start' && <StartMenu onStart={handleStartGame} />}
      {gameState === 'permission' && !permissionGranted && !error && (
        <PermissionModal onRequestPermission={handleRequestPermission} />
      )}

      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/50 pointer-events-none" />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)",
        }}
      />

      {/* Crosshair - Always visible */}
      <Crosshair
        x={handState.crosshairX}
        y={handState.crosshairY}
        visible={handState.isGunGesture}
        isHoveringTarget={isHoveringTarget}
      />

      {/* Game Content - Only show when playing */}
      {gameState === 'playing' && (
        <>
          {/* Targets */}
          {targets.map(target => (
            <Target key={target.id} x={target.x} y={target.y} isHit={target.isHit} />
          ))}

          {/* Bullets */}
          {bullets.map(bullet => (
            <Bullet
              key={bullet.id}
              x={bullet.x}
              y={bullet.y}
              onComplete={() => removeBullet(bullet.id)}
            />
          ))}

          {/* HUD */}
          <GameHUD
            score={score}
            isGunDetected={handState.isGunGesture}
            isLoading={isLoading}
            error={error}
          />
        </>
      )}
    </div>
  );
}
