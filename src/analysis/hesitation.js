export function analyzeHesitation(sessionData) {
    const insights = [];
    const { pauses, timeline } = sessionData;

    if (pauses.length > 5) {
        insights.push({ 
            type: 'warning', 
            message: `You had ${pauses.length} significant pauses. Try reading ahead to maintain a steady rhythm.` 
        });
    }

    // Analyze variance in keystroke timing
    if (timeline.length > 10) {
        let totalTiming = 0;
        let timings = [];
        for (let i = 1; i < timeline.length; i++) {
            const delay = timeline[i].timeSinceLast;
            totalTiming += delay;
            timings.push(delay);
        }
        
        const avgDelay = totalTiming / timings.length;
        const variance = timings.reduce((acc, val) => acc + Math.pow(val - avgDelay, 2), 0) / timings.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev > avgDelay * 0.8) {
            insights.push({
                type: 'actionable',
                message: 'Your typing speed is very bursty. Focus on a smooth, continuous flow rather than rushing and stopping.'
            });
        }
    }

    return insights;
}
