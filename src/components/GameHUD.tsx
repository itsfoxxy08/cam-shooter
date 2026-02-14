import { memo } from "react";

interface GameHUDProps {
  score: number;
  isGunDetected: boolean;
  isLoading: boolean;
  error: string | null;
}

const GameHUD = memo(({ score, isGunDetected, isLoading, error }: GameHUDProps) => {
  return (
    <>
      {/* Score */}
      <div className="fixed top-6 right-8 z-40 text-right">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Score</p>
        <p className="text-5xl font-display font-bold neon-text">{score}</p>
      </div>

      {/* Gun detection status */}
      <div className="fixed top-6 left-8 z-40">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Loading model...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <p className="text-sm neon-text-red uppercase tracking-widest">{error}</p>
          </div>
        ) : isGunDetected ? (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse-glow" />
            <p className="text-sm neon-text-green uppercase tracking-widest font-bold">🔫 Gun Detected</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Show gun gesture...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
          Make a finger gun → Aim at targets → Flick up to shoot
        </p>
      </div>
    </>
  );
});

GameHUD.displayName = "GameHUD";
export default GameHUD;
