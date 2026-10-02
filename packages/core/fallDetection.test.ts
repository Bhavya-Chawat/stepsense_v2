import { describe, expect, it } from 'vitest';
import { computeAccelMagnitude, detectFall } from './fallDetection';
import type { FsrReading } from '@stepsense/types';

function mockReading(ax: number, ay: number, az: number, timestamp: string): FsrReading {
  return {
    id: 'id',
    created_at: timestamp,
    session_id: 'session',
    s1_big_toe: 0,
    s2_second_toe: 0,
    s3_ball_in: 0,
    s4_ball_out: 0,
    s5_midfoot: 0,
    s6_heel: 0,
    step_count: 0,
    temperature: 25,
    humidity: 50,
    ax,
    ay,
    az,
    gx: 0,
    gy: 0,
    gz: 0,
  };
}

describe('Fall Detection', () => {
  it('computes accelerometer magnitude correctly', () => {
    // sqrt(3^2 + 4^2 + 0^2) = 5
    expect(computeAccelMagnitude(3, 4, 0)).toBe(5);
  });

  it('detects a fall when spike magnitude is followed by stillness', () => {
    const readings: FsrReading[] = [
      mockReading(0, 0, 1, '2026-08-26T12:00:00Z'),
      mockReading(2, 2, 2, '2026-08-26T12:00:01Z'), // mag ~ 3.46 > 2.5 spike
      mockReading(0.1, 0.1, 0.1, '2026-08-26T12:00:02Z'), // mag ~ 0.17 < 0.5
      mockReading(0.1, 0.1, 0.1, '2026-08-26T12:00:03Z'),
      mockReading(0.1, 0.1, 0.1, '2026-08-26T12:00:04Z'), // 3s of stillness
    ];

    const result = detectFall(readings, 2.5, 0.5, 3);
    expect(result.detected).toBe(true);
    expect(result.timestamp).toBe('2026-08-26T12:00:01Z');
  });

  it('returns false if spike is followed by continued motion', () => {
    const readings: FsrReading[] = [
      mockReading(0, 0, 1, '2026-08-26T12:00:00Z'),
      mockReading(2, 2, 2, '2026-08-26T12:00:01Z'), // mag ~ 3.46 > 2.5
      mockReading(1, 1, 1, '2026-08-26T12:00:02Z'), // mag ~ 1.73 > 0.5 (still moving)
      mockReading(1, 1, 1, '2026-08-26T12:00:03Z'),
    ];

    const result = detectFall(readings, 2.5, 0.5, 3);
    expect(result.detected).toBe(false);
  });
});
