import type { SessionSummary } from '@stepsense/types';

export interface BaselineResult {
  baselineAvgFatigue: number | null;
  baselineAvgAsymmetry: number | null;
  baselineAvgCadence: number | null;
  baselineAvgGaitScore: number | null;
  baselineAvgJointStrain: number | null;
}

export interface BaselineDelta {
  fatigueDelta: number | null; // positive = worse, negative = improved
  asymmetryDelta: number | null;
  cadenceDelta: number | null;
  gaitScoreDelta: number | null;
  jointStrainDelta: number | null;
}

/**
 * Compute baseline averages from past session summaries.
 */
export function computeBaseline(pastSummaries: SessionSummary[]): BaselineResult {
  if (!pastSummaries || pastSummaries.length === 0) {
    return {
      baselineAvgFatigue: null,
      baselineAvgAsymmetry: null,
      baselineAvgCadence: null,
      baselineAvgGaitScore: null,
      baselineAvgJointStrain: null,
    };
  }

  const avg = (values: number[]) =>
    values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;

  const fatigueValues = pastSummaries
    .map((s) => s.fatigue_index)
    .filter((v): v is number => v !== null && !isNaN(v));

  const asymmetryValues = pastSummaries
    .map((s) => s.asymmetry_percent)
    .filter((v): v is number => v !== null && !isNaN(v));

  const cadenceValues = pastSummaries
    .map((s) => s.cadence)
    .filter((v): v is number => v !== null && !isNaN(v));

  const gaitScoreValues = pastSummaries
    .map((s) => (s as any).gait_score)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  const jointStrainValues = pastSummaries
    .map((s) => (s as any).joint_strain_score)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  return {
    baselineAvgFatigue: avg(fatigueValues),
    baselineAvgAsymmetry: avg(asymmetryValues),
    baselineAvgCadence: avg(cadenceValues),
    baselineAvgGaitScore: avg(gaitScoreValues),
    baselineAvgJointStrain: avg(jointStrainValues),
  };
}

/**
 * Compute deltas between current session and baseline.
 * Positive delta = current value is higher than baseline.
 */
export function computeBaselineDelta(
  currentCadence: number | null,
  currentFatigue: number | null,
  currentAsymmetry: number | null,
  currentGaitScore: number | null,
  currentJointStrain: number | null,
  baseline: BaselineResult
): BaselineDelta {
  const delta = (current: number | null, base: number | null): number | null => {
    if (current === null || base === null) return null;
    return Number((current - base).toFixed(2));
  };

  return {
    fatigueDelta: delta(currentFatigue, baseline.baselineAvgFatigue),
    asymmetryDelta: delta(currentAsymmetry, baseline.baselineAvgAsymmetry),
    cadenceDelta: delta(currentCadence, baseline.baselineAvgCadence),
    gaitScoreDelta: delta(currentGaitScore, baseline.baselineAvgGaitScore),
    jointStrainDelta: delta(currentJointStrain, baseline.baselineAvgJointStrain),
  };
}

/**
 * Format a delta value as a human-readable string with direction arrow.
 * Positive delta → "↑ +5.2" (increase)
 * Negative delta → "↓ -3.1" (decrease)
 * Zero/null → "— baseline"
 */
export function formatDelta(delta: number | null, higherIsBetter: boolean = false): string {
  if (delta === null) return '— baseline';
  if (Math.abs(delta) < 0.01) return '→ no change';

  const direction = delta > 0 ? '↑' : '↓';
  const sign = delta > 0 ? '+' : '';
  const isGood = higherIsBetter ? delta > 0 : delta < 0;
  return `${direction} ${sign}${delta}${isGood ? ' improved' : ''}`;
}
