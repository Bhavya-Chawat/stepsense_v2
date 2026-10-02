import type { FsrReading } from '@stepsense/types';

/**
 * Joint Strain module — computes per-zone overload scores from FSR pressure data.
 *
 * Clinical basis:
 * - Sustained high pressure in the ball-of-foot zones (Z3, Z4) correlates with
 *   metatarsal joint pain and forefoot overloading.
 * - Sustained high heel pressure (Z6) correlates with plantar fasciitis risk.
 * - The overall joint strain score combines zone-specific overload into a 0-100 metric.
 */

export type JointStrainSeverity = 'LOW' | 'MODERATE' | 'HIGH';

export interface ZoneOverload {
  zone: string;
  label: string;
  peakPressure: number;
  avgPressure: number;
  overloadPercent: number; // % of readings above threshold
}

export interface JointStrainResult {
  score: number; // 0–100 (higher = more strain)
  severity: JointStrainSeverity;
  dominantZone: string;
  dominantZoneLabel: string;
  inference: string;
  zoneOverloads: ZoneOverload[];
}

const ZONE_CONFIG = [
  { key: 's1_big_toe', label: 'Big Toe', overloadThreshold: 2500 },
  { key: 's2_second_toe', label: '2nd Toe', overloadThreshold: 2200 },
  { key: 's3_ball_in', label: 'Ball (Inner)', overloadThreshold: 2800 },
  { key: 's4_ball_out', label: 'Ball (Outer)', overloadThreshold: 2600 },
  { key: 's5_midfoot', label: 'Midfoot', overloadThreshold: 1500 },
  { key: 's6_heel', label: 'Heel', overloadThreshold: 3000 },
] as const;

/**
 * Compute comprehensive joint strain analysis from FSR readings.
 */
export function computeJointStrainScore(readings: FsrReading[]): JointStrainResult {
  if (!readings || readings.length === 0) {
    return {
      score: 0,
      severity: 'LOW',
      dominantZone: 'none',
      dominantZoneLabel: 'None',
      inference: 'Insufficient data for joint strain analysis.',
      zoneOverloads: [],
    };
  }

  const zoneOverloads: ZoneOverload[] = ZONE_CONFIG.map((zone) => {
    const values = readings.map((r) => r[zone.key as keyof FsrReading] as number);
    const peakPressure = Math.max(...values);
    const avgPressure = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(0));
    const overloadCount = values.filter((v) => v >= zone.overloadThreshold).length;
    const overloadPercent = Number(((overloadCount / values.length) * 100).toFixed(1));

    return {
      zone: zone.key,
      label: zone.label,
      peakPressure,
      avgPressure,
      overloadPercent,
    };
  });

  // Score computation: weighted sum of overload percentages
  // Ball zones (s3, s4) get higher clinical weight for metatarsal joint pain
  const weights: Record<string, number> = {
    s1_big_toe: 0.12,
    s2_second_toe: 0.08,
    s3_ball_in: 0.25,
    s4_ball_out: 0.20,
    s5_midfoot: 0.10,
    s6_heel: 0.25,
  };

  let weightedScore = 0;
  for (const zo of zoneOverloads) {
    const w = weights[zo.zone] || 0.1;
    weightedScore += zo.overloadPercent * w;
  }

  // Scale to 0-100
  const score = Number(Math.min(100, Math.max(0, weightedScore)).toFixed(0));

  // Determine severity
  let severity: JointStrainSeverity = 'LOW';
  if (score >= 65) severity = 'HIGH';
  else if (score >= 35) severity = 'MODERATE';

  // Find dominant zone (highest overload)
  const dominant = zoneOverloads.reduce((max, z) => z.overloadPercent > max.overloadPercent ? z : max, zoneOverloads[0]);

  // Generate clinical inference text
  let inference = 'Normal pressure distribution across all zones.';
  if (severity === 'HIGH') {
    inference = `Sustained overloading detected in ${dominant.label} zone (${dominant.overloadPercent}% of readings above threshold). Consider orthotic arch support or gait modification.`;
  } else if (severity === 'MODERATE') {
    inference = `Moderate pressure concentration in ${dominant.label} zone. Monitor for progressive joint discomfort.`;
  }

  return {
    score,
    severity,
    dominantZone: dominant.zone,
    dominantZoneLabel: dominant.label,
    inference,
    zoneOverloads,
  };
}

/**
 * Legacy compatibility wrapper. Returns score as a percentage.
 * @deprecated Use computeJointStrainScore for full analysis.
 */
export function computeJointStrain(leftPeak: number, rightPeak: number): number {
  const avg = (leftPeak + rightPeak) / 2;
  if (avg === 0) return 0;
  const diff = Math.abs(leftPeak - rightPeak);
  return Number(((diff / avg) * 100).toFixed(2));
}
