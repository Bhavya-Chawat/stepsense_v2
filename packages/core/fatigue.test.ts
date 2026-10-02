import { describe, expect, it } from 'vitest';
import { bucketFatigueIndex, computeFatigueIndex, getFatigueOnsetPoint } from './fatigue';
import type { FsrReading } from '@stepsense/types';

function mockReading(s6: number, timestamp: string): FsrReading {
  return {
    id: 'id',
    created_at: timestamp,
    session_id: 'session',
    s1_big_toe: 0,
    s2_second_toe: 0,
    s3_ball_in: 0,
    s4_ball_out: 0,
    s5_midfoot: 0,
    s6_heel: s6,
    step_count: 0,
    temperature: 25,
    humidity: 50,
    ax: 0,
    ay: 0,
    az: 1,
    gx: 0,
    gy: 0,
    gz: 0,
  };
}

describe('Fatigue Index & Bucketing', () => {
  it('computes fatigue index (late - early) / (late + early)', () => {
    const readings: FsrReading[] = [
      mockReading(1000, '2026-08-26T12:00:00Z'),
      mockReading(1000, '2026-08-26T12:01:00Z'),
      mockReading(1500, '2026-08-26T12:05:00Z'),
      mockReading(2000, '2026-08-26T12:09:00Z'),
      mockReading(2000, '2026-08-26T12:10:00Z'),
    ];

    const fatigueIndex = computeFatigueIndex(readings);
    expect(fatigueIndex).toBe(0.3333);
  });

  it('buckets fatigue index accurately', () => {
    expect(bucketFatigueIndex(0.05)).toBe('Normal');
    expect(bucketFatigueIndex(0.15)).toBe('Mild');
    expect(bucketFatigueIndex(0.30)).toBe('Moderate');
    expect(bucketFatigueIndex(0.50)).toBe('Severe');
    expect(bucketFatigueIndex(-0.45)).toBe('Severe');
  });

  it('detects fatigue onset timestamp when sliding window crosses cutoff', () => {
    const readings: FsrReading[] = [
      mockReading(1000, '2026-08-26T12:00:00Z'),
      mockReading(1000, '2026-08-26T12:00:15Z'),
      mockReading(1000, '2026-08-26T12:00:30Z'),
      mockReading(2500, '2026-08-26T12:00:45Z'),
      mockReading(3000, '2026-08-26T12:01:00Z'),
    ];

    const onset = getFatigueOnsetPoint(readings, 30, 5);
    expect(onset).toBeDefined();
  });
});
