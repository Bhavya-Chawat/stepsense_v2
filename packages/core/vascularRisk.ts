import type { FsrReading } from '@stepsense/types';
import { computeAccelMagnitude } from './fallDetection';

export type VascularSeverity = 'LOW' | 'MODERATE' | 'HIGH';

export interface VascularRiskResult {
  score: number; // 0-100
  severity: VascularSeverity;
  standingDurationMinutes: number;
  weightShiftVariance: number;
  inference: string;
}

export function computeStandingDuration(
  readings: FsrReading[],
  accelStillnessThreshold: number = 0.5
): number {
  if (!readings || readings.length === 0) return 0;

  let standingCount = 0;
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];

    const isStepStatic = curr.step_count === prev.step_count;

    if (curr.ax !== null && curr.ay !== null && curr.az !== null) {
      const mag = computeAccelMagnitude(curr.ax, curr.ay, curr.az);
      const isStill = Math.abs(mag - 9.81) < accelStillnessThreshold || mag < accelStillnessThreshold;
      if (isStepStatic && isStill) {
        standingCount++;
      }
    } else if (isStepStatic) {
      standingCount++;
    }
  }

  const startTime = new Date(readings[0].created_at).getTime();
  const endTime = new Date(readings[readings.length - 1].created_at).getTime();
  const durationMinutes = (endTime - startTime) / 60000;

  const standingRatio = readings.length > 1 ? standingCount / (readings.length - 1) : 0;
  return Number((durationMinutes * standingRatio).toFixed(2));
}

export function computeWeightShiftVariance(readings: FsrReading[]): number {
  if (!readings || readings.length === 0) return 0;

  const totalPressures = readings.map(
    (r) => r.s1_big_toe + r.s2_second_toe + r.s3_ball_in + r.s4_ball_out + r.s5_midfoot + r.s6_heel
  );

  const mean = totalPressures.reduce((a, b) => a + b, 0) / totalPressures.length;
  const variance =
    totalPressures.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalPressures.length;

  return Number(variance.toFixed(2));
}

export function detectVascularStrainFlag(
  standingDurationMinutes: number,
  weightShiftVariance: number,
  durationThresholdMinutes: number = 30,
  varianceThreshold: number = 100
): boolean {
  return standingDurationMinutes >= durationThresholdMinutes && weightShiftVariance < varianceThreshold;
}

/**
 * Compute a composite vascular/varicose risk score (0-100).
 *
 * Risk factors:
 * - Prolonged standing (>30min continuous) → venous pooling
 * - Low weight-shift variance → static posture → poor circulation
 * - High temperature → peripheral vasodilation → swelling risk
 */
export function computeVascularRiskScore(
  standingDurationMinutes: number,
  weightShiftVariance: number,
  avgTemperature: number | null = null
): VascularRiskResult {
  // 1. Standing duration component (0-50 points)
  let durationScore = 0;
  if (standingDurationMinutes >= 60) durationScore = 50;
  else if (standingDurationMinutes >= 45) durationScore = 40;
  else if (standingDurationMinutes >= 30) durationScore = 30;
  else if (standingDurationMinutes >= 15) durationScore = 15;

  // 2. Weight shift variance component (0-35 points) — LOWER variance = HIGHER risk
  let shiftScore = 0;
  if (weightShiftVariance < 50) shiftScore = 35;
  else if (weightShiftVariance < 100) shiftScore = 25;
  else if (weightShiftVariance < 200) shiftScore = 15;
  else if (weightShiftVariance < 500) shiftScore = 5;

  // 3. Temperature component (0-15 points)
  let tempScore = 0;
  if (avgTemperature !== null) {
    if (avgTemperature >= 37) tempScore = 15;
    else if (avgTemperature >= 35) tempScore = 10;
    else if (avgTemperature >= 33) tempScore = 5;
  }

  const score = Math.min(100, durationScore + shiftScore + tempScore);

  let severity: VascularSeverity = 'LOW';
  if (score >= 60) severity = 'HIGH';
  else if (score >= 35) severity = 'MODERATE';

  let inference = 'Normal vascular indicators. Weight distribution is dynamic.';
  if (severity === 'HIGH') {
    inference = 'Elevated vascular strain from prolonged static standing with minimal weight shifting. Risk of venous pooling.';
  } else if (severity === 'MODERATE') {
    inference = 'Moderate standing duration detected. Consider periodic movement breaks.';
  }

  return {
    score,
    severity,
    standingDurationMinutes,
    weightShiftVariance,
    inference,
  };
}
