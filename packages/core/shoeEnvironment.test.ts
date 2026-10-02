import { describe, expect, it } from 'vitest';
import { detectFungalRisk } from './shoeEnvironment';
import type { FsrReading } from '@stepsense/types';

function mockReading(humidity: number, timestamp: string): FsrReading {
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
    humidity,
    ax: 0,
    ay: 0,
    az: 1,
    gx: 0,
    gy: 0,
    gz: 0,
  };
}

describe('Shoe Environment & Fungal Risk', () => {
  it('detects fungal risk when humidity stays high for required duration', () => {
    const readings: FsrReading[] = [
      mockReading(75, '2026-08-26T12:00:00Z'),
      mockReading(80, '2026-08-26T12:15:00Z'),
      mockReading(85, '2026-08-26T12:30:00Z'), // 30 minutes sustained >= 70%
    ];

    expect(detectFungalRisk(readings, 70, 1800)).toBe(true);
  });

  it('returns false if humidity drops below threshold during session', () => {
    const readings: FsrReading[] = [
      mockReading(75, '2026-08-26T12:00:00Z'),
      mockReading(65, '2026-08-26T12:15:00Z'), // drops below
      mockReading(85, '2026-08-26T12:30:00Z'),
    ];

    expect(detectFungalRisk(readings, 70, 1800)).toBe(false);
  });
});
