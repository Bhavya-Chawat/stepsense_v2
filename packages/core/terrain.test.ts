import { describe, expect, it } from 'vitest';
import { classifyTerrain, computeGyroVariance } from './terrain';
import type { FsrReading } from '@stepsense/types';

function mockGyroReading(gx: number, gy: number, gz: number): FsrReading {
  return {
    id: 'id',
    created_at: '2026-08-26T12:00:00Z',
    session_id: 'session',
    s1_big_toe: 0,
    s2_second_toe: 0,
    s3_ball_in: 0,
    s4_ball_out: 0,
    s5_midfoot: 0,
    s6_heel: 0,
    step_count: 0,
    temperature: null,
    humidity: null,
    ax: 0,
    ay: 0,
    az: 1,
    gx,
    gy,
    gz,
  };
}

describe('Terrain Classification Module', () => {
  it('classifies flat/smooth vs uneven terrain based on gyro variance', () => {
    const smoothReadings = [
      mockGyroReading(0.1, 0.1, 0.1),
      mockGyroReading(0.12, 0.11, 0.1),
    ];
    const smoothVariance = computeGyroVariance(smoothReadings);
    expect(classifyTerrain(smoothVariance, 5.0)).toBe('Flat/smooth');

    const unevenReadings = [
      mockGyroReading(0.1, 0.1, 0.1),
      mockGyroReading(10.0, 8.0, 5.0),
    ];
    const unevenVariance = computeGyroVariance(unevenReadings);
    expect(classifyTerrain(unevenVariance, 5.0)).toBe('Uneven');
  });
});
