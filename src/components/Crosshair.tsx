import { memo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  visible: boolean;
}

const Crosshair = memo(({ x, y, visible }: CrosshairProps) => {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-30 animate-crosshair"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer ring */}
      <div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary neon-border opacity-80" />
      {/* Inner dot */}
      <div className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ boxShadow: "var(--neon-glow)" }} />
      {/* Cross lines */}
      <div className="absolute w-6 h-0.5 bg-primary -translate-x-[calc(50%+20px)] -translate-y-1/2 opacity-60" />
      <div className="absolute w-6 h-0.5 bg-primary translate-x-[8px] -translate-y-1/2 opacity-60" />
      <div className="absolute h-6 w-0.5 bg-primary -translate-x-1/2 -translate-y-[calc(50%+20px)] opacity-60" />
      <div className="absolute h-6 w-0.5 bg-primary -translate-x-1/2 translate-y-[8px] opacity-60" />
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
