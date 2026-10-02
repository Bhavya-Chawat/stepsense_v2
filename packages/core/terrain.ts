import type { FsrReading } from '@stepsense/types';

export type TerrainType = 'Flat' | 'Stairs Up' | 'Stairs Down';

export interface TerrainResult {
  terrain: TerrainType;
  confidence: number; // 0-100
  gyroVariance: number;
}

/**
 * Compute gyroscope magnitude variance — a proxy for terrain roughness.
 */
export function computeGyroVariance(readings: FsrReading[]): number {
  const gyroReadings = readings.filter(
    (r) => r.gx !== null && r.gy !== null && r.gz !== null
  );

  if (gyroReadings.length === 0) return 0;

  const magnitudes = gyroReadings.map((r) =>
    Math.sqrt(Math.pow(r.gx!, 2) + Math.pow(r.gy!, 2) + Math.pow(r.gz!, 2))
  );

  const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const variance =
    magnitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / magnitudes.length;

  return Number(variance.toFixed(4));
}

/**
 * Compute average pitch angle from accelerometer data.
 * Positive pitch → incline (going upstairs), Negative pitch → decline (going downstairs).
 * Flat surface → pitch near 0.
 */
function computeAvgPitchAngle(readings: FsrReading[]): number | null {
  const accelReadings = readings.filter(
    (r) => r.ax !== null && r.ay !== null && r.az !== null
  );

  if (accelReadings.length === 0) return null;

  let totalPitch = 0;
  for (const r of accelReadings) {
    // Pitch angle: angle between forward acceleration and gravity
    // Using atan2(ax, az) where ax = forward, az = vertical
    const pitch = Math.atan2(r.ax!, Math.abs(r.az!)) * (180 / Math.PI);
    totalPitch += pitch;
  }

  return totalPitch / accelReadings.length;
}

/**
 * Classify terrain using both gyroscope variance AND accelerometer pitch angle.
 * - Flat: low gyro variance + near-zero pitch
 * - Stairs Up: moderate-high gyro variance + positive pitch angle
 * - Stairs Down: moderate-high gyro variance + negative pitch angle
 *
 * Returns terrain type with confidence percentage.
 */
export function classifyTerrain(
  readings: FsrReading[],
  gyroVarianceThreshold: number = 5.0,
  pitchThresholdDegrees: number = 8.0
): TerrainResult {
  const gyroVariance = computeGyroVariance(readings);
  const pitchAngle = computeAvgPitchAngle(readings);

  // No accelerometer data → fall back to simple gyro-based classification
  if (pitchAngle === null) {
    if (gyroVariance >= gyroVarianceThreshold) {
      return { terrain: 'Stairs Up', confidence: 60, gyroVariance };
    }
    return { terrain: 'Flat', confidence: 85, gyroVariance };
  }

  // Full classification with both sensors
  const isHighVariance = gyroVariance >= gyroVarianceThreshold;
  const absPitch = Math.abs(pitchAngle);

  if (!isHighVariance && absPitch < pitchThresholdDegrees) {
    // Low variance + flat pitch = flat terrain
    const confidence = Math.min(98, 80 + Math.round((1 - absPitch / pitchThresholdDegrees) * 18));
    return { terrain: 'Flat', confidence, gyroVariance };
  }

  if (isHighVariance || absPitch >= pitchThresholdDegrees) {
    const confidence = Math.min(98, 60 + Math.round(Math.min(absPitch / 15, 1) * 35));

    if (pitchAngle > pitchThresholdDegrees) {
      return { terrain: 'Stairs Up', confidence, gyroVariance };
    }
    if (pitchAngle < -pitchThresholdDegrees) {
      return { terrain: 'Stairs Down', confidence, gyroVariance };
    }

    // High variance but ambiguous pitch
    return { terrain: 'Flat', confidence: 65, gyroVariance };
  }

  return { terrain: 'Flat', confidence: 80, gyroVariance };
}

/**
 * @deprecated Use classifyTerrain(readings) instead. Kept for backward compatibility.
 */
export function classifyTerrainLegacy(
  gyroVariance: number,
  threshold: number = 5.0
): 'Uneven' | 'Flat/smooth' {
  return gyroVariance >= threshold ? 'Uneven' : 'Flat/smooth';
}
