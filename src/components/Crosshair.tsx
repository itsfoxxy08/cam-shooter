import { memo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  visible: boolean;
}

const Crosshair = memo(({ x, y, visible }: CrosshairProps) => {
  // Always render crosshair, but change appearance based on gun detection
  const activeOpacity = visible ? "opacity-80" : "opacity-30";
  const dotOpacity = visible ? "opacity-100" : "opacity-40";
  const lineOpacity = visible ? "opacity-60" : "opacity-20";

  return (
    <div
      className="fixed pointer-events-none z-30 transition-all duration-100"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer ring */}
      <div className={`absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary neon-border ${activeOpacity}`} />
      {/* Inner dot */}
      <div className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ${dotOpacity}`} style={{ boxShadow: visible ? "var(--neon-glow)" : "none" }} />
      {/* Cross lines */}
      <div className={`absolute w-6 h-0.5 bg-primary -translate-x-[calc(50%+20px)] -translate-y-1/2 ${lineOpacity}`} />
      <div className={`absolute w-6 h-0.5 bg-primary translate-x-[8px] -translate-y-1/2 ${lineOpacity}`} />
      <div className={`absolute h-6 w-0.5 bg-primary -translate-x-1/2 -translate-y-[calc(50%+20px)] ${lineOpacity}`} />
      <div className={`absolute h-6 w-0.5 bg-primary -translate-x-1/2 translate-y-[8px] ${lineOpacity}`} />
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
