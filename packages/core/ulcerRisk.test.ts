import { describe, expect, it } from 'vitest';
import { detectUlcerRiskFlags } from './ulcerRisk';

describe('Ulcer Risk Module', () => {
  it('detects per-zone ulcer risk when peak pressure exceeds threshold >= 3 times', () => {
    const history = {
      s1_big_toe: [3200, 3100, 3400, 2000], // 3 times >= 3000 -> true
      s6_heel: [1500, 2800, 3100],          // 1 time >= 3000 -> false
    };

    const flags = detectUlcerRiskFlags(history, 3000, 3);
    expect(flags.s1_big_toe).toBe(true);
    expect(flags.s6_heel).toBe(false);
  });
});
