export function computeAsymmetryPercent(leftPeak: number, rightPeak: number): number {
  const avg = (leftPeak + rightPeak) / 2;
  if (avg === 0) return 0;
  const diff = Math.abs(leftPeak - rightPeak);
  return Number(((diff / avg) * 100).toFixed(2));
}

export interface TemperatureAsymmetryResult {
  left: number;
  right: number;
  diff: number;
  severity: 'Normal' | 'Mild' | 'Significant';
}

/**
 * Compute temperature asymmetry between left and right foot.
 * A difference > 2°C is considered clinically significant (potential inflammation or vascular issue).
 * A difference > 1°C is mild asymmetry.
 */
export function computeTemperatureAsymmetry(
  leftTemp: number | null,
  rightTemp: number | null
): TemperatureAsymmetryResult | null {
  if (leftTemp === null || rightTemp === null) return null;

  const diff = Number(Math.abs(leftTemp - rightTemp).toFixed(1));
  let severity: 'Normal' | 'Mild' | 'Significant' = 'Normal';
  if (diff >= 2.0) severity = 'Significant';
  else if (diff >= 1.0) severity = 'Mild';

  return {
    left: Number(leftTemp.toFixed(1)),
    right: Number(rightTemp.toFixed(1)),
    diff,
    severity,
  };
}
