export function analyzeAccuracy(sessionData) {
    const insights = [];
    const { accuracy, timeline } = sessionData;

    if (accuracy === 100) {
        insights.push({ type: 'positive', message: 'Perfect accuracy! Outstanding focus.' });
    } else if (accuracy < 90) {
        insights.push({ type: 'warning', message: 'Your accuracy dipped below 90%. Try slowing down slightly to build muscle memory.' });
    }

    // Find most common mistakes
    const mistakes = timeline.filter(t => !t.correct && t.expected);
    if (mistakes.length > 0) {
        const mistakeCounts = {};
        mistakes.forEach(m => {
            const key = m.expected;
            mistakeCounts[key] = (mistakeCounts[key] || 0) + 1;
        });

        // Sort by frequency
        const sortedMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);
        const mostCommon = sortedMistakes[0];

        if (mostCommon[1] >= 3) {
            insights.push({ 
                type: 'actionable', 
                message: `You frequently mistyped the letter '${mostCommon[0]}' (${mostCommon[1]} times). Practice words containing this letter.` 
            });
        }
    }

    return insights;
}
