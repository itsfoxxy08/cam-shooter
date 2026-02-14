import { memo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  visible: boolean;
  isHoveringTarget: boolean;
}

const Crosshair = memo(({ x, y, visible, isHoveringTarget }: CrosshairProps) => {
  // Base opacity - slightly lower as requested
  const baseActiveOpacity = visible ? "opacity-70" : "opacity-25";
  const baseDotOpacity = visible ? "opacity-90" : "opacity-35";
  const baseLineOpacity = visible ? "opacity-50" : "opacity-15";

  // Hover state - darker, bigger, NO animations
  const hoverRingClasses = isHoveringTarget
    ? "w-20 h-20 border-4 opacity-100 shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]"
    : `w-16 h-16 border-2 ${baseActiveOpacity}`;

  const hoverDotClasses = isHoveringTarget
    ? "w-3 h-3 opacity-100"
    : `w-2 h-2 ${baseDotOpacity}`;

  const hoverLineClasses = isHoveringTarget
    ? "opacity-100 scale-110"
    : baseLineOpacity;

  const hoverGlow = isHoveringTarget
    ? "drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]"
    : "";

  return (
    <div
      className={`fixed pointer-events-none z-30 transition-all duration-200 ${hoverGlow}`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer ring - Glowing cyan */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-cyan-400 transition-all duration-200 ${hoverRingClasses}`}
        style={{
          boxShadow: visible || isHoveringTarget ? "0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.4)" : "none"
        }}
      />

      {/* Inner dot - Bright cyan */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 transition-all duration-200 ${hoverDotClasses}`}
        style={{
          boxShadow: visible || isHoveringTarget ? "0 0 10px rgba(0, 255, 255, 1), 0 0 20px rgba(0, 255, 255, 0.6)" : "none"
        }}
      />

      {/* Cross lines - Cyan glow */}
      <div
        className={`absolute w-6 h-0.5 bg-cyan-400 -translate-x-[calc(50%+20px)] -translate-y-1/2 transition-all duration-200 ${hoverLineClasses}`}
        style={{ boxShadow: visible ? "0 0 5px rgba(0, 255, 255, 0.6)" : "none" }}
      />
      <div
        className={`absolute w-6 h-0.5 bg-cyan-400 translate-x-[calc(50%-4px)] -translate-y-1/2 transition-all duration-200 ${hoverLineClasses}`}
        style={{ boxShadow: visible ? "0 0 5px rgba(0, 255, 255, 0.6)" : "none" }}
      />
      <div
        className={`absolute h-6 w-0.5 bg-cyan-400 -translate-x-1/2 -translate-y-[calc(50%+20px)] transition-all duration-200 ${hoverLineClasses}`}
        style={{ boxShadow: visible ? "0 0 5px rgba(0, 255, 255, 0.6)" : "none" }}
      />
      <div
        className={`absolute h-6 w-0.5 bg-cyan-400 -translate-x-1/2 translate-y-[calc(50%-4px)] transition-all duration-200 ${hoverLineClasses}`}
        style={{ boxShadow: visible ? "0 0 5px rgba(0, 255, 255, 0.6)" : "none" }}
      />
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
