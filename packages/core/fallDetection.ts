import type { FsrReading } from '@stepsense/types';

// UNCALIBRATED — do not ship without real values
export const FALL_SPIKE_THRESHOLD = 2.5;

// UNCALIBRATED — do not ship without real values
export const FALL_STILLNESS_THRESHOLD = 0.5;

export const FALL_STILLNESS_DURATION_SECONDS = 3;

export interface FallDetectionResult {
  detected: boolean;
  timestamp: string | null;
}

export function computeAccelMagnitude(ax: number | null, ay: number | null, az: number | null): number {
  if (ax === null || ay === null || az === null) return 0;
  return Math.sqrt(ax * ax + ay * ay + az * az);
}

export function detectFall(
  readings: FsrReading[],
  spikeThreshold: number = FALL_SPIKE_THRESHOLD,
  stillnessThreshold: number = FALL_STILLNESS_THRESHOLD,
  stillnessDurationSeconds: number = FALL_STILLNESS_DURATION_SECONDS
): FallDetectionResult {
  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const mag = computeAccelMagnitude(r.ax, r.ay, r.az);

    if (mag > spikeThreshold) {
      const spikeTime = new Date(r.created_at).getTime();
      let isStill = true;
      let durationCovered = 0;

      for (let j = i + 1; j < readings.length; j++) {
        const nextTime = new Date(readings[j].created_at).getTime();
        const elapsed = (nextTime - spikeTime) / 1000;

        const nextMag = computeAccelMagnitude(readings[j].ax, readings[j].ay, readings[j].az);
        if (nextMag >= stillnessThreshold) {
          isStill = false;
          break;
        }

        durationCovered = elapsed;
        if (durationCovered >= stillnessDurationSeconds) {
          break;
        }
      }

      if (isStill && durationCovered >= stillnessDurationSeconds) {
        return {
          detected: true,
          timestamp: r.created_at,
        };
      }
    }
  }

  return {
    detected: false,
    timestamp: null,
  };
}

/**
 * Compute a composite Fall Risk Score from 0-100 based on multiple risk factors.
 * Higher score = higher risk of falling.
 *
 * Risk factors:
 * - High gait asymmetry → balance problems → fall risk
 * - Low cadence → mobility impairment → fall risk
 * - High fatigue → muscular weakness → fall risk
 * - Elderly cohort → inherently higher fall risk
 */
export function computeFallRiskScore(
  asymmetryPercent: number,
  cadence: number,
  fatigueIndex: number,
  cohort: string = 'adult'
): number {
  // 1. Asymmetry contribution (0-30 points)
  // >25% asymmetry = max risk, <5% = minimal
  const asymmetryScore = Math.min(30, Math.max(0, (asymmetryPercent / 25) * 30));

  // 2. Cadence contribution (0-25 points)
  // Very low cadence (<70 spm) indicates mobility impairment
  let cadenceRisk = 0;
  if (cadence > 0 && cadence < 70) cadenceRisk = 25;
  else if (cadence < 85) cadenceRisk = 15;
  else if (cadence < 95) cadenceRisk = 8;

  // 3. Fatigue contribution (0-25 points)
  const fatigueRisk = Math.min(25, Math.abs(fatigueIndex) * 60);

  // 4. Cohort/age bonus (0-20 points)
  let cohortRisk = 0;
  if (cohort === 'elderly') cohortRisk = 20;
  else if (cohort === 'child') cohortRisk = 10;

  const totalScore = Math.min(100, Math.max(0, Math.round(
    asymmetryScore + cadenceRisk + fatigueRisk + cohortRisk
  )));

  return totalScore;
}

/**
 * Detect tremor flag from gyroscope data — potential Parkinson's indicator.
 * Parkinson's tremor: 4-6 Hz oscillation in gyro data combined with abnormally low cadence.
 *
 * Returns true if high-frequency gyro activity is detected with low cadence.
 */
export function detectTremorFlag(
  readings: FsrReading[],
  cadence: number
): boolean {
  if (!readings || readings.length < 20) return false;
  if (cadence > 90) return false; // Normal cadence makes tremor unlikely

  // Check for high-frequency gyro oscillations
  const gyroMags: number[] = [];
  for (const r of readings) {
    if (r.gx !== null && r.gy !== null && r.gz !== null) {
      gyroMags.push(Math.sqrt(r.gx * r.gx + r.gy * r.gy + r.gz * r.gz));
    }
  }

  if (gyroMags.length < 10) return false;

  // Count sign changes in the derivative (zero crossings ≈ oscillation frequency proxy)
  let zeroCrossings = 0;
  for (let i = 2; i < gyroMags.length; i++) {
    const d1 = gyroMags[i - 1] - gyroMags[i - 2];
    const d2 = gyroMags[i] - gyroMags[i - 1];
    if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
      zeroCrossings++;
    }
  }

  // High oscillation rate (many zero crossings per reading) + low cadence → tremor flag
  const oscillationRate = zeroCrossings / gyroMags.length;
  return oscillationRate > 0.4 && cadence < 80;
}
