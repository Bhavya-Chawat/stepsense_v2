import { describe, expect, it } from 'vitest';
import { getConnectionState } from './connectionState';

describe('Connection State Logic', () => {
  const baseNow = new Date('2026-08-26T12:00:10.000Z');

  it('returns DEMO for null timestamp', () => {
    expect(getConnectionState(null, baseNow)).toBe('DEMO');
  });

  it('returns LIVE if timestamp is within 5 seconds', () => {
    const timestamp = '2026-08-26T12:00:07.000Z'; // 3s ago
    expect(getConnectionState(timestamp, baseNow)).toBe('LIVE');
  });

  it('returns STALE if timestamp is between 5s and 8s', () => {
    const timestamp = '2026-08-26T12:00:04.000Z'; // 6s ago
    expect(getConnectionState(timestamp, baseNow)).toBe('STALE');
  });

  it('returns DEMO if timestamp is older than 8s', () => {
    const timestamp = '2026-08-26T12:00:00.000Z'; // 10s ago
    expect(getConnectionState(timestamp, baseNow)).toBe('DEMO');
  });
});
