import { describe, expect, it } from 'vitest';
import { computeBaseline } from './baseline';
import type { SessionSummary } from '@stepsense/types';

function mockSummary(fatigue: number | null, asymmetry: number | null): SessionSummary {
  return {
    id: 'id',
    session_id: 'session',
    cadence: 100,
    avg_stride_time: 1.2,
    fatigue_index: fatigue,
    fatigue_bucket: 'Mild',
    asymmetry_percent: asymmetry,
    joint_strain_percent: asymmetry,
    fall_detected: false,
    fall_timestamp: null,
    fungal_risk: false,
    vascular_strain_flag: false,
    ulcer_risk_zones: {},
    terrain_label: null,
    alerts: [],
    baseline_avg_fatigue: null,
    baseline_avg_asymmetry: null,
    ai_report_consumer: null,
    ai_report_doctor: null,
    created_at: '2026-08-26T12:00:00Z',
  };
}

describe('Baseline Calculation', () => {
  it('returns nulls for empty summary array', () => {
    const result = computeBaseline([]);
    expect(result.baselineAvgFatigue).toBeNull();
    expect(result.baselineAvgAsymmetry).toBeNull();
  });

  it('computes plain averages of past fatigue and asymmetry', () => {
    const past = [
      mockSummary(0.10, 10),
      mockSummary(0.20, 20),
      mockSummary(0.30, 30),
    ];

    const result = computeBaseline(past);
    expect(result.baselineAvgFatigue).toBe(0.20);
    expect(result.baselineAvgAsymmetry).toBe(20);
  });
});
