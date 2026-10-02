import { describe, expect, it } from 'vitest';
import { finalizeSessionMetrics } from './sessionFinalize';
import type { FsrReading } from '@stepsense/types';

function mockReading(overrides: Partial<FsrReading> = {}): FsrReading {
  return {
    id: 'id',
    created_at: '2026-08-26T12:00:00.000Z',
    session_id: 'session-id',
    s1_big_toe: 100,
    s2_second_toe: 100,
    s3_ball_in: 100,
    s4_ball_out: 100,
    s5_midfoot: 100,
    s6_heel: 500,
    step_count: 50,
    temperature: 25,
    humidity: 50,
    ax: 0,
    ay: 0,
    az: 1,
    gx: 0,
    gy: 0,
    gz: 0,
    ...overrides,
  };
}

describe('Session Finalize Pipeline', () => {
  it('handles empty readings array safely', () => {
    const metrics = finalizeSessionMetrics([]);
    expect(metrics.cadence).toBeNull();
    expect(metrics.fatigue_bucket).toBeNull();
    expect(metrics.fall_detected).toBe(false);
  });

  it('finalizes metrics from a raw reading stream', () => {
    const readings: FsrReading[] = [
      mockReading({ created_at: '2026-08-26T12:00:00Z', s6_heel: 200, step_count: 10 }),
      mockReading({ created_at: '2026-08-26T12:01:00Z', s6_heel: 1200, step_count: 60 }),
    ];

    const metrics = finalizeSessionMetrics(readings);
    expect(metrics.cadence).toBe(60); // 60 steps in 1 min
    expect(metrics.fatigue_bucket).toBeDefined();
    expect(metrics.fall_detected).toBe(false);
  });
});
