import type { FsrReading } from '@stepsense/types';

// Named constants for cutoffs per PRD requirements (need tuning later against real data)
export const FATIGUE_NORMAL_THRESHOLD = 0.10;
export const FATIGUE_MILD_THRESHOLD = 0.25;
export const FATIGUE_MODERATE_THRESHOLD = 0.40;

export type FatigueBucket = 'Normal' | 'Mild' | 'Moderate' | 'Severe';

export function computeFatigueIndex(readings: FsrReading[]): number {
  if (readings.length === 0) return 0;
  if (readings.length === 1) return 0;

  const startTime = new Date(readings[0].created_at).getTime();
  const endTime = new Date(readings[readings.length - 1].created_at).getTime();
  const totalDuration = endTime - startTime;

  if (totalDuration <= 0) {
    // Fallback to array slice split if timestamps are identical
    const earlyCount = Math.max(1, Math.floor(readings.length * 0.2));
    const lateCount = Math.max(1, Math.floor(readings.length * 0.2));
    const earlyReadings = readings.slice(0, earlyCount);
    const lateReadings = readings.slice(readings.length - lateCount);

    const s6_early = earlyReadings.reduce((sum, r) => sum + r.s6_heel, 0) / earlyReadings.length;
    const s6_late = lateReadings.reduce((sum, r) => sum + r.s6_heel, 0) / lateReadings.length;

    if (s6_late + s6_early === 0) return 0;
    return Number(((s6_late - s6_early) / (s6_late + s6_early)).toFixed(4));
  }

  // Filter by time window (first 20% vs last 20%)
  const earlyCutoff = startTime + totalDuration * 0.2;
  const lateCutoff = endTime - totalDuration * 0.2;

  const earlyReadings = readings.filter((r) => new Date(r.created_at).getTime() <= earlyCutoff);
  const lateReadings = readings.filter((r) => new Date(r.created_at).getTime() >= lateCutoff);

  const effectiveEarly = earlyReadings.length > 0 ? earlyReadings : [readings[0]];
  const effectiveLate = lateReadings.length > 0 ? lateReadings : [readings[readings.length - 1]];

  const s6_early = effectiveEarly.reduce((sum, r) => sum + r.s6_heel, 0) / effectiveEarly.length;
  const s6_late = effectiveLate.reduce((sum, r) => sum + r.s6_heel, 0) / effectiveLate.length;

  if (s6_late + s6_early === 0) return 0;
  return Number(((s6_late - s6_early) / (s6_late + s6_early)).toFixed(4));
}

export function bucketFatigueIndex(fatigueIndex: number): FatigueBucket {
  const absVal = Math.abs(fatigueIndex);
  if (absVal < FATIGUE_NORMAL_THRESHOLD) return 'Normal';
  if (absVal < FATIGUE_MILD_THRESHOLD) return 'Mild';
  if (absVal < FATIGUE_MODERATE_THRESHOLD) return 'Moderate';
  return 'Severe';
}

export function getFatigueOnsetPoint(
  readings: FsrReading[],
  windowSizeSeconds: number = 30,
  stepSeconds: number = 5
): string | null {
  if (!readings || readings.length === 0) return null;

  const firstTime = new Date(readings[0].created_at).getTime();
  const lastTime = new Date(readings[readings.length - 1].created_at).getTime();
  const totalSec = (lastTime - firstTime) / 1000;

  if (totalSec < windowSizeSeconds) return null;

  for (let startSec = 0; startSec <= totalSec - windowSizeSeconds; startSec += stepSeconds) {
    const windowStart = firstTime + startSec * 1000;
    const windowEnd = windowStart + windowSizeSeconds * 1000;

    const windowReadings = readings.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= windowStart && t <= windowEnd;
    });

    if (windowReadings.length >= 2) {
      const idx = computeFatigueIndex(windowReadings);
      if (Math.abs(idx) >= FATIGUE_MILD_THRESHOLD) {
        return windowReadings[0].created_at;
      }
    }
  }

  return null;
}

/**
 * Convert fatigue index into a 0-100 score where higher = less fatigue (better).
 * Used for display gauges and composite metrics.
 */
export function computeFatigueScore(fatigueIndex: number): number {
  const absVal = Math.abs(fatigueIndex);
  // Map: 0 → 100, 0.5+ → 0
  const score = Math.max(0, Math.min(100, Math.round(100 - absVal * 200)));
  return score;
}

/**
 * Count the number of recent days where fatigue was Moderate or Severe.
 * Used for the "Fatigue Days" badge in the AI Report card.
 */
export function computeFatigueDays(
  pastSummaries: { fatigue_bucket: string | null; created_at: string }[],
  lookbackDays: number = 7
): number {
  if (!pastSummaries || pastSummaries.length === 0) return 0;

  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const fatigueSet = new Set<string>();

  for (const s of pastSummaries) {
    if (!s.created_at) continue;
    const sessionTime = new Date(s.created_at).getTime();
    if (sessionTime < cutoff) continue;

    if (s.fatigue_bucket === 'Moderate' || s.fatigue_bucket === 'Severe') {
      const dayKey = new Date(s.created_at).toISOString().slice(0, 10);
      fatigueSet.add(dayKey);
    }
  }

  return fatigueSet.size;
}
