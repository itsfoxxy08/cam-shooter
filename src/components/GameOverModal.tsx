import { memo } from "react";

interface GameOverModalProps {
    targetsHit: number;
    onRestart: () => void;
}

const GameOverModal = memo(({ targetsHit, onRestart }: GameOverModalProps) => {
    const minHits = 10;

    // Star rating system
    let stars = 1;
    let rating = "";
    let passed = false;

    if (targetsHit < minHits) {
        stars = 1;
        rating = "Game Over!";
        passed = false;
    } else if (targetsHit < 15) {
        stars = 2;
        rating = "Good!";
        passed = true;
    } else if (targetsHit < 20) {
        stars = 3;
        rating = "Great!";
        passed = true;
    } else if (targetsHit < 25) {
        stars = 4;
        rating = "Excellent!";
        passed = true;
    } else {
        stars = 5;
        rating = "Perfect!";
        passed = true;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 border-2 border-cyan-400 rounded-lg p-8 max-w-md w-full mx-4 shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                <h2 className="text-4xl font-bold text-center mb-2 text-cyan-400"
                    style={{ textShadow: "0 0 20px rgba(0, 255, 255, 0.8)" }}>
                    {passed ? "YOU WON!" : "GAME OVER!"}
                </h2>

                {/* Rating text */}
                <p className={`text-center text-2xl font-bold mb-4 ${passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {rating}
                </p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                        <span
                            key={starNum}
                            className={`text-4xl ${starNum <= stars ? 'text-yellow-400' : 'text-gray-600'}`}
                            style={starNum <= stars ? {
                                textShadow: "0 0 10px rgba(250, 204, 21, 0.8)",
                                filter: "drop-shadow(0 0 5px rgba(250, 204, 21, 0.5))"
                            } : {}}
                        >
                            ★
                        </span>
                    ))}
                </div>

                <div className="space-y-4 mb-8">
                    <div className="bg-black/50 border border-cyan-400/30 rounded p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300">Targets Hit:</span>
                            <span className={`text-2xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                {targetsHit}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Required:</span>
                            <span className="text-xl font-bold text-cyan-400">{minHits}</span>
                        </div>
                    </div>

                    {!passed && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded p-4 text-center">
                            <p className="text-red-300 font-semibold">
                                ⚠️ Failed! You needed {minHits - targetsHit} more hit{minHits - targetsHit !== 1 ? 's' : ''}!
                            </p>
                        </div>
                    )}

                    {passed && (
                        <div className="bg-green-900/30 border border-green-500/50 rounded p-4 text-center">
                            <p className="text-green-300 font-semibold">
                                ✅ Challenge Complete! {targetsHit - minHits} bonus hit{targetsHit - minHits !== 1 ? 's' : ''}!
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onRestart}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/50"
                    style={{ boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}
                >
                    {passed ? "🔄 PLAY AGAIN" : "Try Again"}
                </button>
            </div>
        </div>
    );
});

GameOverModal.displayName = "GameOverModal";

export default GameOverModal;
