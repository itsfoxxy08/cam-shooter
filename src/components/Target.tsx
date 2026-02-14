import { memo } from "react";

interface TargetProps {
  x: number;
  y: number;
  isHit: boolean;
}

const Target = memo(({ x, y, isHit }: TargetProps) => {
  return (
    <div
      className={`fixed pointer-events-none z-20 ${isHit ? "animate-target-hit" : "animate-target-spawn"}`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer ring */}
      <div className="w-20 h-20 rounded-full border-3 border-destructive flex items-center justify-center"
        style={{ boxShadow: "var(--neon-glow-red)" }}>
        {/* Middle ring */}
        <div className="w-12 h-12 rounded-full border-2 border-destructive flex items-center justify-center opacity-80">
          {/* Center dot */}
          <div className="w-4 h-4 rounded-full bg-destructive animate-pulse-glow" />
        </div>
      </div>
    </div>
  );
});

Target.displayName = "Target";
export default Target;
