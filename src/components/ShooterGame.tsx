import { useRef, useState, useEffect } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useAudio } from "@/hooks/useAudio";
import { useFullscreen } from "@/hooks/useFullscreen";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameHUD from "./GameHUD";
import StartMenu from "./StartMenu";
import PermissionModal from "./PermissionModal";
import Bullet from "./Bullet";
import GameOverModal from "./GameOverModal";
import ReadyScreen from "./ReadyScreen";

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
const POINTS_PER_HIT = 10; // 10 points per successful hit

type GameState = 'start' | 'permission' | 'ready' | 'playing' | 'gameOver';

export default function ShooterGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');

  // Only enable tracking when we are in the permission phase or later
  const isTrackingEnabled = gameState === 'permission' || gameState === 'ready' || gameState === 'playing';

  const { handState, isLoading, error, permissionGranted } = useHandTracking(videoRef, isTrackingEnabled);
  const { playShoot, playBackgroundMusic, stopBackgroundMusic, toggleMute, isMuted } = useAudio();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<TargetState[]>([]);
  const [bullets, setBullets] = useState<BulletState[]>([]);
  const [isHoveringTarget, setIsHoveringTarget] = useState(false);

  // Timer and hit tracking
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [targetsHit, setTargetsHit] = useState(0); // Changed from shotsFired - only counts successful hits

  const nextTargetIdRef = useRef(0);
  const nextBulletIdRef = useRef(0);
  const lastBangTimestamp = useRef(0); // Track last bang to prevent multiple counts

  // Handle Game State Transitions
  useEffect(() => {
    if (gameState === 'permission' && permissionGranted) {
      // Move to ready state, don't start game yet
      setGameState('ready');
    }
  }, [gameState, permissionGranted]);

  const handleStartGame = () => {
    setGameState('permission');
  };

  const handleRequestPermission = () => {
    // This is handled by useHandTracking when isTrackingEnabled becomes true
  };

  const handleBeginGame = () => {
    // Called when user clicks "Start Game" button in ready state
    console.log('🎮 handleBeginGame called');

    // IMPORTANT: Reset all game state FIRST before transitioning to 'playing'
    // This ensures timer starts with the correct initial time
    console.log('🎮 Resetting game state');
    setTimeRemaining(GAME_DURATION);
    setTargetsHit(0);
    setScore(0);
    setTargets([]);
    setBullets([]);

    // Now transition to playing - this will start the timer
    console.log('🎮 Setting gameState to playing');
    setGameState('playing');

    // Start background music
    playBackgroundMusic();
    console.log('🎮 handleBeginGame complete');
  };

  const handleRestart = () => {
    setScore(0);
    setTargets([]);
    setBullets([]);
    setTimeRemaining(GAME_DURATION);
    setTargetsHit(0);
    setGameState('ready'); // Go back to ready state, not permission
  };

  // Timer using ref to avoid closure issues
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Only start timer when playing
    if (gameState !== 'playing') {
      console.log('⏱️ Not playing, timer not started. Game state:', gameState);
      return;
    }

    console.log('⏱️ ===== TIMER STARTING =====');
    console.log('⏱️ Initial time:', timeRemaining);

    // Start countdown
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        console.log('⏱️ TICK:', prev, '→', newTime);

        if (newTime <= 0) {
          console.log('⏱️ ===== TIME EXPIRED =====');
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setGameState('gameOver');
          return 0;
        }

        return newTime;
      });
    }, 1000);

    console.log('⏱️ Interval created:', timerIntervalRef.current);

    // Cleanup
    return () => {
      console.log('⏱️ Cleanup called');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState]); // ONLY gameState dependency

  // Stop music when game ends
  useEffect(() => {
    if (gameState === 'gameOver') {
      console.log('🎵 Stopping music - game over');
      stopBackgroundMusic();
    }
  }, [gameState, stopBackgroundMusic]);

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

    // Check if this is a new bang event (prevent counting same bang multiple times)
    const currentTime = Date.now();
    if (currentTime - lastBangTimestamp.current < 100) {
      // Same bang event, ignore (within 100ms of last bang)
      return;
    }

    // Update timestamp for this new bang
    lastBangTimestamp.current = currentTime;

    // Play shoot sound
    playShoot();

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
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HIT_RADIUS && !hit) {
          hit = true;
          return { ...target, isHit: true };
        }
        return target;
      });

      if (hit) {
        // Hit a target: +10 points and increment hits counter
        setScore(s => s + POINTS_PER_HIT);
        setTargetsHit(prev => {
          const newCount = prev + 1;

          // Award time bonus at 10 targets
          if (newCount === 10 && !timeBonusGiven) {
            setTimeRemaining(time => time + 15);
            setTimeBonusGiven(true);
            console.log('🎁 TIME BONUS! +15 seconds');
          }

          return newCount;
        });
      } else {
        // Missed shot: -10 points (but don't go below 0)
        setScore(s => Math.max(0, s - 10));
      }

      return updated;
    });
  }, [handState.isBang, gameState, playShoot]);

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  // Spawn targets periodically
  useEffect(() => {
    if (gameState !== 'playing') return;

    const MIN_DISTANCE = 0.2; // Minimum distance between targets (20% of screen)

    const spawnTarget = () => {
      // Try to find a valid position (max 10 attempts)
      for (let attempt = 0; attempt < 10; attempt++) {
        const newTarget: TargetState = {
          id: nextTargetIdRef.current,
          x: 0.15 + Math.random() * 0.7,
          y: 0.2 + Math.random() * 0.6,
          isHit: false,
        };

        // Check distance from all existing targets
        const active = targets.filter(t => !t.isHit);
        const tooClose = active.some(target => {
          const dx = target.x - newTarget.x;
          const dy = target.y - newTarget.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < MIN_DISTANCE;
        });

        // If not too close to any target, spawn it
        if (!tooClose || active.length === 0) {
          nextTargetIdRef.current++;
          setTargets(prev => {
            const currentActive = prev.filter(t => !t.isHit);
            if (currentActive.length >= 4) return prev;
            return [...currentActive, newTarget];
          });
          break;
        }
      }
    };

    spawnTarget();
    const interval = setInterval(spawnTarget, 2000);
    return () => clearInterval(interval);
  }, [gameState, targets]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* UI Overlays */}
      {gameState === 'start' && <StartMenu onStart={handleStartGame} />}
      {gameState === 'permission' && !permissionGranted && !error && (
        <PermissionModal onRequestPermission={handleRequestPermission} />
      )}
      {gameState === 'ready' && (
        <ReadyScreen onBeginGame={handleBeginGame} />
      )}
      {gameState === 'gameOver' && (
        <GameOverModal targetsHit={targetsHit} score={score} onRestart={handleRestart} />
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
              <div className="text-cyan-400 text-sm font-semibold">HITS</div>
              <div className={`text-4xl font-bold ${targetsHit >= MIN_SHOTS_REQUIRED ? 'text-green-400' : 'text-cyan-400'}`}
                style={{ textShadow: "0 0 10px currentColor" }}>
                {targetsHit}/{MIN_SHOTS_REQUIRED}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Button - Bottom Right Corner of Screen */}
      {(gameState === 'playing' || gameState === 'ready') && (
        <button
          onClick={toggleFullscreen}
          className="fixed bottom-6 right-6 z-50 bg-black/80 hover:bg-cyan-500/20 border border-cyan-400/50 rounded-lg p-3 transition-all duration-200"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            // Compress icon (exit fullscreen)
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            // Expand icon (enter fullscreen)
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            </svg>
          )}
        </button>
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
