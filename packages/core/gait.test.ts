import { describe, expect, it } from 'vitest';
import {
  computeCadence,
  computeGaitPhases,
  computeStrideTimes,
  detectHeelStrikes,
  detectToeOffs,
} from './gait';
import type { FsrReading } from '@stepsense/types';

function mockReading(overrides: Partial<FsrReading> = {}): FsrReading {
  return {
    id: 'test-id',
    created_at: '2026-08-26T12:00:00.000Z',
    session_id: 'session-id',
    s1_big_toe: 0,
    s2_second_toe: 0,
    s3_ball_in: 0,
    s4_ball_out: 0,
    s5_midfoot: 0,
    s6_heel: 0,
    step_count: 0,
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

describe('Gait Analysis', () => {
  it('detects heel strikes when s6_heel crosses threshold upwards', () => {
    const readings: FsrReading[] = [
      mockReading({ s6_heel: 200, created_at: '2026-08-26T12:00:00Z' }),
      mockReading({ s6_heel: 1200, created_at: '2026-08-26T12:00:01Z' }),
      mockReading({ s6_heel: 1500, created_at: '2026-08-26T12:00:02Z' }),
      mockReading({ s6_heel: 800, created_at: '2026-08-26T12:00:03Z' }),
      mockReading({ s6_heel: 1100, created_at: '2026-08-26T12:00:04Z' }),
    ];

    const strikes = detectHeelStrikes(readings, 1000);
    expect(strikes.length).toBe(2);
    expect(strikes[0].index).toBe(1);
    expect(strikes[1].index).toBe(4);
  });

  it('detects toe offs when s1_big_toe drops below threshold', () => {
    const readings: FsrReading[] = [
      mockReading({ s1_big_toe: 800, s3_ball_in: 200, created_at: '2026-08-26T12:00:00Z' }),
      mockReading({ s1_big_toe: 300, s3_ball_in: 200, created_at: '2026-08-26T12:00:01Z' }),
    ];

    const toeOffs = detectToeOffs(readings, 500);
    expect(toeOffs.length).toBe(1);
    expect(toeOffs[0].index).toBe(1);
  });

  it('computes cadence correctly', () => {
    // 120 steps in 60 seconds = 120 spm
    expect(computeCadence(120, 60)).toBe(120);
    // 100 steps in 120 seconds = 50 spm
    expect(computeCadence(100, 120)).toBe(50);
  });

  it('computes stride times correctly', () => {
    const heelStrikes = [
      { timestamp: '2026-08-26T12:00:00.000Z', index: 0 },
      { timestamp: '2026-08-26T12:00:01.200Z', index: 5 },
      { timestamp: '2026-08-26T12:00:02.500Z', index: 10 },
    ];

    const strideTimes = computeStrideTimes(heelStrikes);
    expect(strideTimes).toEqual([1.2, 1.3]);
  });

  it('computes stance and swing gait phases', () => {
    const heelStrikes = [
      { timestamp: '2026-08-26T12:00:00.000Z', index: 0 },
    ];
    const toeOffs = [
      { timestamp: '2026-08-26T12:00:00.600Z', index: 3 },
    ];

    const phases = computeGaitPhases(heelStrikes, toeOffs);
    expect(phases).toEqual([
      { phase: 'stance', startTime: '2026-08-26T12:00:00.000Z', endTime: '2026-08-26T12:00:00.600Z' },
    ]);
  });
});
