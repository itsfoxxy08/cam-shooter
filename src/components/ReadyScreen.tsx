import { memo } from "react";

interface ReadyScreenProps {
    onBeginGame: () => void;
}

const ReadyScreen = memo(({ onBeginGame }: ReadyScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center space-y-8 px-8">
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold text-cyan-400 animate-pulse"
                        style={{ textShadow: "0 0 30px rgba(0, 255, 255, 0.8)" }}>
                        READY!
                    </h1>
                    <p className="text-2xl text-cyan-300">
                        Camera access granted
                    </p>
                </div>

                <div className="bg-black/50 border-2 border-cyan-400/50 rounded-lg p-6 max-w-md mx-auto">
                    <h2 className="text-cyan-400 text-xl font-semibold mb-4">CHALLENGE</h2>
                    <div className="space-y-2 text-gray-300">
                        <p>⏱️ <span className="text-white font-bold">30 seconds</span> on the clock</p>
                        <p>🎯 Shoot <span className="text-white font-bold">10 targets</span> minimum</p>
                        <p>💎 <span className="text-white font-bold">10 points</span> per hit</p>
                    </div>
                </div>

                <button
                    onClick={onBeginGame}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-2xl py-4 px-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/50 animate-pulse"
                    style={{ boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)" }}
                >
                    ▶ START GAME
                </button>

                <p className="text-sm text-gray-500">
                    Make a finger gun gesture to aim and shoot
                </p>
            </div>
        </div>
    );
});

ReadyScreen.displayName = "ReadyScreen";

export default ReadyScreen;
