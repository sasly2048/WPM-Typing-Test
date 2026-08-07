import { calculateWPM, calculateRawWPM, calculateAccuracy } from '../services/stats-engine.js';

export class StatsEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.timeline = []; // { timestamp, char, expected, correct, timeSinceLast }
    this.pauses = [];
    this.startTime = null;
    this.endTime = null;
    this.totalStrokes = 0;
    this.correctStrokes = 0;
    this.lastKeystrokeTime = null;
    // Additional telemetry
    this.backspaceCount = 0;
    this.correctedChars = 0; // Number of characters corrected after mistake
    this.reactionTimes = [];
    this.currentStreak = 0;
    this.longestStreak = 0;
    // Speed curve for WPM over time
    this.speedCurve = [];
    this.speedInterval = 1000;
    this.lastIntervalTime = null;
    this.strokesInInterval = 0;
    this.correctStrokesInInterval = 0;
  }

  start() {
    this.startTime = performance.now();
    this.lastKeystrokeTime = this.startTime;
    this.lastIntervalTime = this.startTime;
  }

  recordKeystroke(char, expected, correct) {
    if (!this.startTime) this.start();
    
    const now = performance.now();
    const timeSinceLast = now - this.lastKeystrokeTime;
    
    // Record Pause (if > 500ms)
    if (timeSinceLast > 500) {
      this.pauses.push({ start: this.lastKeystrokeTime, end: now, duration: timeSinceLast });
    }

    this.totalStrokes++;
    if (correct) {
      this.correctStrokes++;
      this.correctStrokesInInterval++;
      this.currentStreak++;
      if (this.currentStreak > this.longestStreak) this.longestStreak = this.currentStreak;
    } else {
      this.currentStreak = 0;
    }
    this.strokesInInterval++;

    // Rolling net WPM for the speed curve (errors excluded, matching the final
    // score). Routed through calculateWPM so the near-zero-denominator floor
    // and the plausibility ceiling apply here too — the consistency score is
    // derived from this curve, so an unclamped spike would corrupt it.
    if (now - this.lastIntervalTime >= this.speedInterval) {
      const wpm = calculateWPM(this.correctStrokesInInterval, (now - this.lastIntervalTime) / 1000);
      this.speedCurve.push({ time: now - this.startTime, wpm });
      this.lastIntervalTime = now;
      this.strokesInInterval = 0;
      this.correctStrokesInInterval = 0;
    }

    this.timeline.push({
      timestamp: now - this.startTime,
      char,
      expected,
      correct,
      timeSinceLast
    });

    this.lastKeystrokeTime = now;
  }

  finish() {
    this.endTime = performance.now();
    // Record remaining strokes in the last partial interval
    if (this.strokesInInterval > 0 && this.lastIntervalTime) {
       const now = performance.now();
       const wpm = calculateWPM(this.correctStrokesInInterval, (now - this.lastIntervalTime) / 1000);
       this.speedCurve.push({ time: now - this.startTime, wpm });
    }
  }

  getDetailedStats() {
    const totalTimeMs = (this.endTime || performance.now()) - this.startTime;
    const totalTimeSec = totalTimeMs / 1000;
    // Net WPM: only correctly-typed characters count, matching MonkeyType/TypeRacer convention.
    const wpm = calculateWPM(this.correctStrokes, totalTimeSec);
    // Raw WPM: every keystroke counts, correct or not — shows true unfiltered speed.
    const rawWpm = calculateRawWPM(this.totalStrokes, totalTimeSec);
    const accuracy = calculateAccuracy(this.correctStrokes, this.totalStrokes);
    const errors = this.totalStrokes - this.correctStrokes;

    return {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 100) / 100,
      errors,
      longestStreak: this.longestStreak,
      totalTimeMs,
      timeline: this.timeline,
      pauses: this.pauses,
      speedCurve: this.speedCurve,
      totalStrokes: this.totalStrokes
    };
  }
}
