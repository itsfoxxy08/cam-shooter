import { useRef, useState, useEffect } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useAudio } from "@/hooks/useAudio";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameHUD from "./GameHUD";
import StartMenu from "./StartMenu";
import PermissionModal from "./PermissionModal";
import Bullet from "./Bullet";
import GameOverModal from "./GameOverModal";

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
const GAME_DURATION = 30; // seconds
const MIN_SHOTS_REQUIRED = 10;

type GameState = 'start' | 'permission' | 'playing' | 'gameOver';

export default function ShooterGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');

  // Only enable tracking when we are in the permission phase or playing
  const isTrackingEnabled = gameState === 'permission' || gameState === 'playing';

  const { handState, isLoading, error, permissionGranted } = useHandTracking(videoRef, isTrackingEnabled);
  const { playShoot, playBackgroundMusic, stopBackgroundMusic, toggleMute, isMuted } = useAudio();

  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<TargetState[]>([]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [isHoveringTarget, setIsHoveringTarget] = useState(false);

  // Timer and shot tracking
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [shotsFired, setShotsFired] = useState(0);

  const nextTargetIdRef = useRef(0);
  const nextBulletIdRef = useRef(0);

  // Handle Game State Transitions
  useEffect(() => {
    if (gameState === 'permission' && permissionGranted) {
      setGameState('playing');
      // Start background music
      playBackgroundMusic();
      // Reset timer and shots
      setTimeRemaining(GAME_DURATION);
      setShotsFired(0);
    }
  }, [gameState, permissionGranted, playBackgroundMusic]);

  const handleStartGame = () => {
    setGameState('permission');
  };

  const handleRequestPermission = () => {
    // This is handled by useHandTracking when isTrackingEnabled becomes true
  };

  const handleRestart = () => {
    setScore(0);
    setTargets([]);
    setBullets([]);
    setTimeRemaining(GAME_DURATION);
    setShotsFired(0);
    setGameState('permission');
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeRemaining <= 0) {
      // Time's up - check if passed
      stopBackgroundMusic();
      setGameState('gameOver');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeRemaining, stopBackgroundMusic]);

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

    // Play shoot sound
    playShoot();

    // Increment shots fired
    setShotsFired(prev => prev + 1);

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
  }, [handState.isBang, gameState, playShoot]);

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  // Spawn targets periodically
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnTarget = () => {
      const newTarget: TargetState = {
        id: nextTargetIdRef.current++,
        x: 0.15 + Math.random() * 0.7,
        y: 0.2 + Math.random() * 0.6,
        isHit: false,
      };
      setTargets(prev => {
        const active = prev.filter(t => !t.isHit);
        if (active.length >= 4) return prev;
        return [...active, newTarget];
      });
    };

    spawnTarget();
    const interval = setInterval(spawnTarget, 2000);
    return () => clearInterval(interval);
  }, [gameState]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* UI Overlays */}
      {gameState === 'start' && <StartMenu onStart={handleStartGame} />}
      {gameState === 'permission' && !permissionGranted && !error && (
        <PermissionModal onRequestPermission={handleRequestPermission} />
      )}
      {gameState === 'gameOver' && (
        <GameOverModal shotsFired={shotsFired} onRestart={handleRestart} />
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

      {/* Timer and Shots Display - Top Center */}
      {gameState === 'playing' && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 bg-black/70 border-2 border-cyan-400 rounded-lg px-8 py-4 backdrop-blur-sm"
          style={{ boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-cyan-400 text-sm font-semibold">TIME</div>
              <div className={`text-4xl font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}
                style={{ textShadow: "0 0 10px currentColor" }}>
                {timeRemaining}s
              </div>
            </div>
            <div className="w-px h-12 bg-cyan-400/30" />
            <div className="text-center">
              <div className="text-cyan-400 text-sm font-semibold">SHOTS</div>
              <div className={`text-4xl font-bold ${shotsFired >= MIN_SHOTS_REQUIRED ? 'text-green-400' : 'text-cyan-400'}`}
                style={{ textShadow: "0 0 10px currentColor" }}>
                {shotsFired}/{MIN_SHOTS_REQUIRED}
              </div>
            </div>
          </div>
        </div>
      )}

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
