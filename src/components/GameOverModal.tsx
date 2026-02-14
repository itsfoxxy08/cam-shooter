import { memo } from "react";

interface GameOverModalProps {
    shotsFired: number;
    onRestart: () => void;
}

const GameOverModal = memo(({ shotsFired, onRestart }: GameOverModalProps) => {
    const minShots = 10;
    const failedChallenge = shotsFired < minShots;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 border-2 border-cyan-400 rounded-lg p-8 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                <h2 className="text-4xl font-bold text-center mb-6 text-cyan-400"
                    style={{ textShadow: "0 0 20px rgba(0, 255, 255, 0.8)" }}>
                    {failedChallenge ? "GAME OVER!" : "TIME'S UP!"}
                </h2>

                <div className="space-y-4 mb-8">
                    <div className="bg-black/50 border border-cyan-400/30 rounded p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300">Shots Fired:</span>
                            <span className={`text-2xl font-bold ${failedChallenge ? 'text-red-400' : 'text-cyan-400'}`}>
                                {shotsFired}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Required:</span>
                            <span className="text-xl font-bold text-cyan-400">{minShots}</span>
                        </div>
                    </div>

                    {failedChallenge && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded p-4 text-center">
                            <p className="text-red-300 font-semibold">
                                ⚠️ Failed! You needed {minShots - shotsFired} more shot{minShots - shotsFired !== 1 ? 's' : ''}!
                            </p>
                        </div>
                    )}

                    {!failedChallenge && (
                        <div className="bg-green-900/30 border border-green-500/50 rounded p-4 text-center">
                            <p className="text-green-300 font-semibold">
                                ✅ Challenge Complete!
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onRestart}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/50"
                    style={{ boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}
                >
                    🔄 RESTART GAME
                </button>
            </div>
        </div>
    );
});

GameOverModal.displayName = "GameOverModal";

export default GameOverModal;
