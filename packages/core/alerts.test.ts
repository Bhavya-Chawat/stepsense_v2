import { describe, expect, it } from 'vitest';
import { computeAlerts } from './alerts';

describe('Alerts Engine', () => {
  it('returns empty array when all indicators are normal', () => {
    const alerts = computeAlerts({
      fallDetected: false,
      standingDurationSeconds: 600,
      sittingDurationSeconds: 1200,
      fatigueLevel: 'Normal',
      asymmetryPercent: 10,
      fungalRisk: false,
    });

    expect(alerts).toEqual([]);
  });

  it('generates critical fall alert when fall is detected', () => {
    const alerts = computeAlerts({
      fallDetected: true,
      standingDurationSeconds: 0,
      sittingDurationSeconds: 0,
      fatigueLevel: 'Normal',
      asymmetryPercent: 0,
      fungalRisk: false,
    });

    expect(alerts).toEqual([
      { message: 'Fall detected', severity: 'critical' },
    ]);
  });

  it('composes multiple alerts with correct severities', () => {
    const alerts = computeAlerts({
      fallDetected: true,
      standingDurationSeconds: 2000, // > 1800 moderate
      sittingDurationSeconds: 0,
      fatigueLevel: 'Severe', // moderate
      asymmetryPercent: 30, // > 25 moderate
      fungalRisk: true, // low
    });

    expect(alerts).toEqual([
      { message: 'Fall detected', severity: 'critical' },
      { message: 'Prolonged standing', severity: 'moderate' },
      { message: 'High fatigue', severity: 'moderate' },
      { message: 'High asymmetry', severity: 'moderate' },
      { message: 'Fungal/shoe-bite risk', severity: 'low' },
    ]);
  });
});
