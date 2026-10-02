import { describe, expect, it } from 'vitest';
import { computeAsymmetryPercent, computeJointStrain } from './asymmetry';

describe('Asymmetry and Joint Strain', () => {
  it('computes 0% asymmetry for equal left and right peaks', () => {
    expect(computeAsymmetryPercent(2000, 2000)).toBe(0);
  });

  it('computes exact asymmetry percentage', () => {
    // left=2000, right=1000. diff=1000, avg=1500. 1000/1500 * 100 = 66.67%
    expect(computeAsymmetryPercent(2000, 1000)).toBe(66.67);
  });

  it('computes joint strain calling asymmetry percent internally', () => {
    expect(computeJointStrain(2000, 1000)).toBe(66.67);
  });

  it('handles zero peak pressure safely', () => {
    expect(computeAsymmetryPercent(0, 0)).toBe(0);
  });
});
