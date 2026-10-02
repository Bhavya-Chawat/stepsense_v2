import type { FsrReading } from '@stepsense/types';

// NEEDS REAL VALUE — ask Bhavya
export const HEEL_STRIKE_THRESHOLD = 1000;

// NEEDS REAL VALUE — ask Bhavya
export const TOE_OFF_THRESHOLD = 500;

export interface EventMarker {
  timestamp: string;
  index: number;
}

export interface GaitPhase {
  phase: 'stance' | 'swing';
  startTime: string;
  endTime: string;
}

export type GaitType = 'Normal' | 'Antalgic' | 'Shuffling' | 'Ataxic';

export type GaitPhaseLabel = 'STANCE' | 'SWING' | 'HEEL' | 'TOE';

export function detectHeelStrikes(
  readings: FsrReading[],
  threshold: number = HEEL_STRIKE_THRESHOLD
): EventMarker[] {
  const heelStrikes: EventMarker[] = [];
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1].s6_heel;
    const curr = readings[i].s6_heel;
    if (prev < threshold && curr >= threshold) {
      heelStrikes.push({
        timestamp: readings[i].created_at,
        index: i,
      });
    }
  }
  return heelStrikes;
}

export function detectToeOffs(
  readings: FsrReading[],
  threshold: number = TOE_OFF_THRESHOLD
): EventMarker[] {
  const toeOffs: EventMarker[] = [];
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1].s1_big_toe;
    const curr = readings[i].s1_big_toe;
    const ballIn = readings[i].s3_ball_in;
    
    // Cross-checked against s3_ball_in per PRD
    if (prev >= threshold && curr < threshold && ballIn < threshold) {
      toeOffs.push({
        timestamp: readings[i].created_at,
        index: i,
      });
    }
  }
  return toeOffs;
}

export function computeCadence(
  stepCount: number,
  sessionDurationSeconds: number
): number {
  if (sessionDurationSeconds <= 0) return 0;
  const durationMinutes = sessionDurationSeconds / 60;
  return Number((stepCount / durationMinutes).toFixed(2));
}

export function computeStrideTimes(heelStrikes: EventMarker[]): number[] {
  const strideTimes: number[] = [];
  for (let i = 1; i < heelStrikes.length; i++) {
    const prevTime = new Date(heelStrikes[i - 1].timestamp).getTime();
    const currTime = new Date(heelStrikes[i].timestamp).getTime();
    const strideTimeSeconds = (currTime - prevTime) / 1000;
    strideTimes.push(Number(strideTimeSeconds.toFixed(2)));
  }
  return strideTimes;
}

export function computeGaitPhases(
  heelStrikes: EventMarker[],
  toeOffs: EventMarker[]
): GaitPhase[] {
  const phases: GaitPhase[] = [];
  const allEvents = [
    ...heelStrikes.map((e) => ({ ...e, type: 'heel_strike' as const })),
    ...toeOffs.map((e) => ({ ...e, type: 'toe_off' as const })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (let i = 0; i < allEvents.length - 1; i++) {
    const curr = allEvents[i];
    const next = allEvents[i + 1];
    if (curr.type === 'heel_strike' && next.type === 'toe_off') {
      phases.push({
        phase: 'stance',
        startTime: curr.timestamp,
        endTime: next.timestamp,
      });
    } else if (curr.type === 'toe_off' && next.type === 'heel_strike') {
      phases.push({
        phase: 'swing',
        startTime: curr.timestamp,
        endTime: next.timestamp,
      });
    }
  }

  return phases;
}

/**
 * Estimate stride length from stride time using biomechanical regression.
 * Formula: stride_length ≈ height × 0.415 × (strideTime / referenceStrideTime)
 * Fallback uses a generic height of 1.70m if not provided.
 */
export function computeStrideLength(
  avgStrideTime: number | null,
  heightMeters: number = 1.70
): number | null {
  if (avgStrideTime === null || avgStrideTime <= 0) return null;
  const referenceStrideTime = 1.1; // typical adult stride ~1.1s
  const strideFactor = 0.415;
  const length = heightMeters * strideFactor * (referenceStrideTime / avgStrideTime);
  return Number(Math.min(2.5, Math.max(0.2, length)).toFixed(2));
}

/**
 * Compute average step time (half-stride: time between consecutive heel strikes of same foot).
 */
export function computeStepTime(heelStrikes: EventMarker[]): number | null {
  if (heelStrikes.length < 2) return null;
  const strideTimes = computeStrideTimes(heelStrikes);
  if (strideTimes.length === 0) return null;
  const avgStride = strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length;
  return Number((avgStride / 2).toFixed(2));
}

/**
 * Compute double-support percentage: proportion of the gait cycle where both feet are on the ground.
 * Approximated from stance-to-cycle ratio above 50%.
 */
export function computeDoubleSupportPercent(gaitPhases: GaitPhase[]): number | null {
  if (gaitPhases.length < 2) return null;

  let totalStanceMs = 0;
  let totalSwingMs = 0;

  for (const phase of gaitPhases) {
    const durMs = new Date(phase.endTime).getTime() - new Date(phase.startTime).getTime();
    if (phase.phase === 'stance') {
      totalStanceMs += durMs;
    } else {
      totalSwingMs += durMs;
    }
  }

  const totalCycleMs = totalStanceMs + totalSwingMs;
  if (totalCycleMs <= 0) return null;

  // Double support ≈ stance% - 50%, bounded. Normal adult ~10-12%
  const stancePercent = (totalStanceMs / totalCycleMs) * 100;
  const doubleSupportPercent = Math.max(0, (stancePercent - 50) * 2);
  return Number(Math.min(40, doubleSupportPercent).toFixed(1));
}

/**
 * Classify gait pattern type from biomechanical parameters.
 * - Normal: standard cadence, symmetric, low fatigue
 * - Antalgic: reduced cadence, high asymmetry (pain-avoidance gait)
 * - Shuffling: very low stride time variance, reduced step height (elderly/Parkinson's)
 * - Ataxic: high stride time variance, irregular rhythm
 */
export function classifyGaitType(
  cadence: number,
  avgStrideTime: number | null,
  asymmetryPercent: number,
  strideTimes: number[]
): GaitType {
  // Compute stride time coefficient of variation
  let strideCV = 0;
  if (strideTimes.length >= 3) {
    const mean = strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length;
    if (mean > 0) {
      const variance = strideTimes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / strideTimes.length;
      strideCV = Math.sqrt(variance) / mean;
    }
  }

  // Ataxic: highly irregular stride rhythm
  if (strideCV > 0.25) return 'Ataxic';

  // Antalgic: asymmetric, slow (pain-avoidance pattern)
  if (asymmetryPercent > 20 && cadence < 100) return 'Antalgic';

  // Shuffling: very short strides, low cadence variability
  if (cadence < 80 && avgStrideTime !== null && avgStrideTime < 0.8) return 'Shuffling';

  return 'Normal';
}

/**
 * Compute a composite gait score from 0-100.
 * Weights: cadence normality (30%), stride regularity (25%), symmetry (25%), fatigue impact (20%)
 */
export function computeGaitScore(
  cadence: number,
  avgStrideTime: number | null,
  asymmetryPercent: number,
  fatigueBucket: string | null,
  strideTimes: number[]
): number {
  // 1. Cadence score (ideal range 95-125 spm for adults)
  let cadenceScore = 100;
  if (cadence < 60) cadenceScore = 20;
  else if (cadence < 80) cadenceScore = 50;
  else if (cadence < 95) cadenceScore = 75;
  else if (cadence > 140) cadenceScore = 60;
  else if (cadence > 125) cadenceScore = 80;

  // 2. Stride regularity (low CV = good)
  let regularityScore = 100;
  if (strideTimes.length >= 3) {
    const mean = strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length;
    if (mean > 0) {
      const variance = strideTimes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / strideTimes.length;
      const cv = Math.sqrt(variance) / mean;
      regularityScore = Math.max(0, Math.min(100, 100 - cv * 300));
    }
  }

  // 3. Symmetry score (low asymmetry = good)
  const symmetryScore = Math.max(0, Math.min(100, 100 - asymmetryPercent * 3));

  // 4. Fatigue penalty
  let fatigueScore = 100;
  switch (fatigueBucket) {
    case 'Mild': fatigueScore = 80; break;
    case 'Moderate': fatigueScore = 55; break;
    case 'Severe': fatigueScore = 25; break;
    default: fatigueScore = 100;
  }

  const composite = cadenceScore * 0.30 + regularityScore * 0.25 + symmetryScore * 0.25 + fatigueScore * 0.20;
  return Number(Math.max(0, Math.min(100, composite)).toFixed(0));
}

/**
 * Determine the current gait phase from a single FSR reading for live display.
 */
export function getCurrentGaitPhase(reading: FsrReading | null): GaitPhaseLabel {
  if (!reading) return 'STANCE';

  const heelActive = reading.s6_heel >= HEEL_STRIKE_THRESHOLD * 0.5;
  const toeActive = reading.s1_big_toe >= TOE_OFF_THRESHOLD * 0.8 || reading.s3_ball_in >= TOE_OFF_THRESHOLD * 0.8;
  const midActive = reading.s5_midfoot >= 400;

  if (heelActive && !toeActive) return 'HEEL';
  if (toeActive && !heelActive) return 'TOE';
  if (heelActive || midActive || toeActive) return 'STANCE';
  return 'SWING';
}
