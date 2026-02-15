import { memo } from "react";

interface ReadyScreenProps {
    onBeginGame: () => void;
}

const ReadyScreen = memo(({ onBeginGame }: ReadyScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="text-center space-y-6 px-8 max-w-md">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-5xl font-bold text-cyan-400">
                        READY
                    </h1>
                    <p className="text-lg text-gray-400">Camera access granted</p>
                </div>

                {/* Challenge info box */}
                <div className="bg-gray-900/80 border border-cyan-400/30 rounded-2xl p-6">
                    <h2 className="text-cyan-400 text-lg font-semibold mb-4 uppercase tracking-wider">Mission Briefing</h2>
                    <div className="space-y-3 text-gray-300">
                        <div className="flex items-center justify-between py-2 border-b border-gray-800">
                            <span className="text-sm">Duration</span>
                            <span className="text-white font-bold">30s</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-800">
                            <span className="text-sm">Target Goal</span>
                            <span className="text-white font-bold">10+ hits</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm">Points</span>
                            <span className="text-green-400 font-bold">+10</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm">Penalty</span>
                            <span className="text-red-400 font-bold">-10</span>
                        </div>
                    </div>
                </div>

                {/* Start button */}
                <button
                    onClick={onBeginGame}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl py-4 px-12 rounded-xl transition-all duration-200"
                >
                    ▶ START MISSION
                </button>

                <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Make finger gun gesture to aim
                </p>
            </div>
        </div>
    );
});

ReadyScreen.displayName = "ReadyScreen";

export default ReadyScreen;
