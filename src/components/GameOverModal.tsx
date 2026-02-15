import { memo } from "react";

interface GameOverModalProps {
    targetsHit: number;
    score: number;
    onRestart: () => void;
}

const GameOverModal = memo(({ targetsHit, score, onRestart }: GameOverModalProps) => {
    const minHits = 10;

    // Star rating system
    let stars = 1;
    let rating = "";
    let passed = false;

    if (targetsHit < minHits) {
        stars = 1;
        rating = "Mission Failed";
        passed = false;
    } else if (targetsHit < 15) {
        stars = 2;
        rating = "Adequate";
        passed = true;
    } else if (targetsHit < 20) {
        stars = 3;
        rating = "Proficient";
        passed = true;
    } else if (targetsHit < 25) {
        stars = 4;
        rating = "Expert";
        passed = true;
    } else {
        stars = 5;
        rating = "Elite Marksman";
        passed = true;
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            {/* Main stats container */}
            <div className="bg-gray-900/95 border border-cyan-400/30 rounded-2xl p-6 max-w-sm w-full shadow-lg">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold mb-1 text-cyan-400">
                        {passed ? "MISSION COMPLETE" : "MISSION FAILED"}
                    </h2>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">{rating}</p>
                </div>

                {/* Star Rating - minimal */}
                <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                        <span
                            key={starNum}
                            className={`text-2xl ${starNum <= stars ? 'text-cyan-400' : 'text-gray-700'}`}
                        >
                            ●
                        </span>
                    ))}
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400 text-sm uppercase tracking-wide">Targets</span>
                        <span className={`text-xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                            {targetsHit}/{minHits}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400 text-sm uppercase tracking-wide">Score</span>
                        <span className="text-xl font-bold text-cyan-400">{score}</span>
                    </div>
                </div>

                {/* Status message */}
                {!passed && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                        <p className="text-red-400 text-sm">
                            Need {minHits - targetsHit} more target{minHits - targetsHit !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {passed && targetsHit > minHits && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                        <p className="text-cyan-400 text-sm">
                            +{targetsHit - minHits} bonus hit{targetsHit - minHits !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>

            {/* Try Again button - outside the box */}
            <button
                onClick={onRestart}
                className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-xl transition-all duration-200 max-w-sm w-full"
            >
                {passed ? "▶ PLAY AGAIN" : "↻ TRY AGAIN"}
            </button>
        </div>
    );
});

GameOverModal.displayName = "GameOverModal";

export default GameOverModal;

