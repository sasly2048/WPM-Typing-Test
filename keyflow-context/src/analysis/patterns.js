export function analyzePatterns(sessionData) {
    const insights = [];
    const { speedCurve, timeline } = sessionData;

    if (speedCurve.length > 3) {
        const firstHalf = speedCurve.slice(0, Math.floor(speedCurve.length / 2));
        const secondHalf = speedCurve.slice(Math.floor(speedCurve.length / 2));

        const avgFirst = firstHalf.reduce((acc, val) => acc + val.wpm, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((acc, val) => acc + val.wpm, 0) / secondHalf.length;

        if (avgSecond < avgFirst * 0.8) {
            insights.push({
                type: 'insight',
                message: 'Your speed dropped significantly towards the end. You might be experiencing fatigue or losing concentration.'
            });
        } else if (avgSecond > avgFirst * 1.2) {
            insights.push({
                type: 'positive',
                message: 'Great job accelerating! You gained momentum as you typed.'
            });
        }
    }

    // Fast but inaccurate?
    const { wpm, accuracy } = sessionData;
    if (wpm > 60 && accuracy < 92) {
        insights.push({
            type: 'actionable',
            message: 'You are typing fast, but sacrificing accuracy. Dial back your speed by 10% to hit 95%+ accuracy; your net WPM will increase.'
        });
    }

    return insights;
}
