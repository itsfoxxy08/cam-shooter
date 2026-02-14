import { useRef, useState, useEffect, useCallback } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameHUD from "./GameHUD";

interface TargetState {
  id: number;
  x: number;
  y: number;
  isHit: boolean;
}

const HIT_RADIUS = 0.06; // % of screen

export default function ShooterGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { handState, isLoading, error } = useHandTracking(videoRef);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<TargetState[]>([]);
  const nextIdRef = useRef(0);

  // Spawn targets periodically
  useEffect(() => {
    if (isLoading || error) return;

    const interval = setInterval(() => {
      const newTarget: TargetState = {
        id: nextIdRef.current++,
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
  }, [isLoading, error]);

  // Clean up hit targets after animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTargets(prev => prev.filter(t => !t.isHit));
    }, 400);
    return () => clearTimeout(timeout);
  }, [targets]);

  // Handle bang
  useEffect(() => {
    if (!handState.isBang || !handState.isGunGesture) return;

    setTargets(prev => {
      let hit = false;
      const updated = prev.map(target => {
        if (target.isHit) return target;
        const dx = target.x - handState.crosshairX;
        const dy = target.y - handState.crosshairY;
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
  }, [handState.isBang]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/50" />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)",
        }}
      />

      {/* Targets */}
      {targets.map(target => (
        <Target key={target.id} x={target.x} y={target.y} isHit={target.isHit} />
      ))}

      {/* Crosshair */}
      <Crosshair
        x={handState.crosshairX}
        y={handState.crosshairY}
        visible={handState.isGunGesture}
      />

      {/* HUD */}
      <GameHUD
        score={score}
        isGunDetected={handState.isGunGesture}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
