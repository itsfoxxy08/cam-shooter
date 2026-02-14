import { useEffect, useState } from "react";

interface BulletProps {
    x: number;
    y: number;
    onComplete: () => void;
}

export default function Bullet({ x, y, onComplete }: BulletProps) {
    const [scale, setScale] = useState(1);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        // Animate bullet hole/impact
        const startTime = performance.now();
        const duration = 500; // ms

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Fade out and shrink slightly
            setOpacity(1 - progress);
            setScale(1 - progress * 0.5);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };

        requestAnimationFrame(animate);
    }, [onComplete]);

    return (
        <div
            className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-40"
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                opacity,
                transform: `translate(-50%, -50%) scale(${scale})`,
            }}
        />
    );
}
