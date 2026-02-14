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
      {/* Outer ring - Neon red for dark theme */}
      <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center"
        style={{ boxShadow: "0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)" }}>
        {/* Middle ring */}
        <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center opacity-80">
          {/* Center dot */}
          <div className="w-4 h-4 rounded-full bg-red-500"
            style={{ boxShadow: "0 0 10px rgba(239, 68, 68, 1)" }} />
        </div>
      </div>
    </div>
  );
});

Target.displayName = "Target";
export default Target;
