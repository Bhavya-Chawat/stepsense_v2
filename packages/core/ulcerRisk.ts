export type UlcerSeverity = 'LOW' | 'MODERATE' | 'HIGH';

export interface UlcerRiskResult {
  score: number; // 0-100
  severity: UlcerSeverity;
  flaggedZones: string[];
  zoneDetails: Record<string, { flagged: boolean; occurrences: number; totalSessions: number }>;
  inference: string;
}

/**
 * Detect which zones have chronic high-pressure hotspots across multiple sessions.
 * Original function preserved for backward compatibility.
 */
export function detectUlcerRiskFlags(
  pastSessionsPeaksByZone: Record<string, number[]>,
  threshold: number = 3000,
  minOccurrences: number = 3
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const zoneKey of Object.keys(pastSessionsPeaksByZone)) {
    const peaks = pastSessionsPeaksByZone[zoneKey] || [];
    const occurrences = peaks.filter((p) => p >= threshold).length;
    result[zoneKey] = occurrences >= minOccurrences;
  }

  return result;
}

/**
 * Compute a composite diabetic ulcer risk score (0-100) with per-zone detail.
 *
 * Ulcer risk factors:
 * - Repeated high peak pressures at the same zone across multiple sessions
 * - Higher risk at forefoot zones (ball-in, ball-out, big toe) per clinical literature
 * - Temperature contribution if available (elevated temp = inflammation)
 */
export function computeUlcerRiskScore(
  pastSessionsPeaksByZone: Record<string, number[]>,
  threshold: number = 3000,
  minOccurrences: number = 3
): UlcerRiskResult {
  const zoneLabels: Record<string, string> = {
    s1_big_toe: 'Big Toe',
    s2_second_toe: '2nd Toe',
    s3_ball_in: 'Ball (Inner)',
    s4_ball_out: 'Ball (Outer)',
    s5_midfoot: 'Midfoot',
    s6_heel: 'Heel',
  };

  // Clinical weighting: forefoot zones more prone to diabetic ulcers
  const zoneWeights: Record<string, number> = {
    s1_big_toe: 0.20,
    s2_second_toe: 0.10,
    s3_ball_in: 0.25,
    s4_ball_out: 0.20,
    s5_midfoot: 0.05,
    s6_heel: 0.20,
  };

  const flaggedZones: string[] = [];
  const zoneDetails: Record<string, { flagged: boolean; occurrences: number; totalSessions: number }> = {};
  let weightedScore = 0;

  for (const zoneKey of Object.keys(pastSessionsPeaksByZone)) {
    const peaks = pastSessionsPeaksByZone[zoneKey] || [];
    const occurrences = peaks.filter((p) => p >= threshold).length;
    const totalSessions = peaks.length;
    const flagged = occurrences >= minOccurrences;

    zoneDetails[zoneKey] = { flagged, occurrences, totalSessions };

    if (flagged) {
      flaggedZones.push(zoneLabels[zoneKey] || zoneKey);
    }

    // Score contribution: (occurrence ratio) × zone weight × 100
    const occurrenceRatio = totalSessions > 0 ? occurrences / totalSessions : 0;
    const weight = zoneWeights[zoneKey] || 0.1;
    weightedScore += occurrenceRatio * weight * 100;
  }

  const score = Math.min(100, Math.max(0, Math.round(weightedScore)));

  let severity: UlcerSeverity = 'LOW';
  if (score >= 60) severity = 'HIGH';
  else if (score >= 30) severity = 'MODERATE';

  let inference = 'No chronic pressure hotspots detected. Ulcer risk is low.';
  if (flaggedZones.length > 0) {
    inference = `Chronic high-pressure detected at: ${flaggedZones.join(', ')}. ${
      severity === 'HIGH'
        ? 'Recommend clinical foot exam and pressure-redistributing orthotics.'
        : 'Monitor for skin changes and consider pressure offloading.'
    }`;
  }

  return {
    score,
    severity,
    flaggedZones,
    zoneDetails,
    inference,
  };
}
