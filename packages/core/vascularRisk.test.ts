import { describe, expect, it } from 'vitest';
import { computeStandingDuration, computeWeightShiftVariance, detectVascularStrainFlag } from './vascularRisk';
import type { FsrReading } from '@stepsense/types';

function mockReading(step: number, timestamp: string): FsrReading {
  return {
    id: 'id',
    created_at: timestamp,
    session_id: 'session',
    s1_big_toe: 100,
    s2_second_toe: 100,
    s3_ball_in: 100,
    s4_ball_out: 100,
    s5_midfoot: 100,
    s6_heel: 500,
    step_count: step,
    temperature: 25,
    humidity: 50,
    ax: 0,
    ay: 0,
    az: 9.81,
    gx: 0,
    gy: 0,
    gz: 0,
  };
}

describe('Vascular Risk Module', () => {
  it('computes standing duration and weight shift variance', () => {
    const readings: FsrReading[] = [
      mockReading(10, '2026-08-26T12:00:00Z'),
      mockReading(10, '2026-08-26T12:15:00Z'),
      mockReading(10, '2026-08-26T12:30:00Z'),
    ];

    const standingMin = computeStandingDuration(readings);
    const variance = computeWeightShiftVariance(readings);
    expect(standingMin).toBe(30);
    expect(variance).toBe(0);
  });

  it('detects vascular strain flag when prolonged standing with low variance occurs', () => {
    expect(detectVascularStrainFlag(35, 50, 30, 100)).toBe(true);
    expect(detectVascularStrainFlag(15, 50, 30, 100)).toBe(false);
  });
});
