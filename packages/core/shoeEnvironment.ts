import type { FsrReading } from '@stepsense/types';

export const FUNGAL_HUMIDITY_THRESHOLD_PERCENT = 70;
export const FUNGAL_DURATION_THRESHOLD_SECONDS = 1800; // 30 mins

export type HumidityLevel = 'Comfortable' | 'Elevated' | 'High Risk';
export type TemperatureLevel = 'NORMAL' | 'WARM' | 'HOT';
export type FungalSeverity = 'GREEN' | 'AMBER' | 'RED';

export interface FungalRiskResult {
  score: number; // 0-100
  severity: FungalSeverity;
  isAtRisk: boolean;
  inference: string;
}

export interface ShoeBiteResult {
  detected: boolean;
  zone: string | null;
  inference: string;
}

export function detectFungalRisk(
  readings: FsrReading[],
  humidityThresholdPercent: number = FUNGAL_HUMIDITY_THRESHOLD_PERCENT,
  durationThresholdSeconds: number = FUNGAL_DURATION_THRESHOLD_SECONDS
): boolean {
  let sustainedStart: number | null = null;

  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const time = new Date(r.created_at).getTime();

    if (r.humidity !== null && r.humidity >= humidityThresholdPercent) {
      if (sustainedStart === null) {
        sustainedStart = time;
      } else {
        const duration = (time - sustainedStart) / 1000;
        if (duration >= durationThresholdSeconds) {
          return true;
        }
      }
    } else {
      sustainedStart = null;
    }
  }

  return false;
}

/**
 * Compute a fungal/tinea risk score (0-100) based on humidity, temperature, and duration.
 * Higher humidity + higher temperature + longer duration = higher risk.
 */
export function computeFungalRiskScore(
  avgHumidity: number | null,
  avgTemperature: number | null,
  durationMinutes: number
): FungalRiskResult {
  if (avgHumidity === null) {
    return { score: 0, severity: 'GREEN', isAtRisk: false, inference: 'No humidity data available.' };
  }

  // Humidity component: 0-50 points
  let humidityScore = 0;
  if (avgHumidity >= 85) humidityScore = 50;
  else if (avgHumidity >= 70) humidityScore = 35;
  else if (avgHumidity >= 60) humidityScore = 20;
  else if (avgHumidity >= 50) humidityScore = 10;

  // Temperature component: 0-30 points (warm/moist = fungal growth)
  let tempScore = 0;
  if (avgTemperature !== null) {
    if (avgTemperature >= 37) tempScore = 30;
    else if (avgTemperature >= 34) tempScore = 20;
    else if (avgTemperature >= 30) tempScore = 10;
  }

  // Duration component: 0-20 points (longer exposure = higher risk)
  let durationScore = 0;
  if (durationMinutes >= 120) durationScore = 20;
  else if (durationMinutes >= 60) durationScore = 15;
  else if (durationMinutes >= 30) durationScore = 10;
  else if (durationMinutes >= 15) durationScore = 5;

  const score = Math.min(100, humidityScore + tempScore + durationScore);

  let severity: FungalSeverity = 'GREEN';
  if (score >= 60) severity = 'RED';
  else if (score >= 35) severity = 'AMBER';

  let inference = 'Shoe microclimate within normal parameters.';
  if (severity === 'RED') {
    inference = `Humidity elevated for ${durationMinutes}min+ — high fungal/tinea risk. Consider airing out shoes.`;
  } else if (severity === 'AMBER') {
    inference = `Humidity elevated for ${durationMinutes}min+ — consider airing out shoes.`;
  }

  return { score, severity, isAtRisk: score >= 35, inference };
}

/**
 * Detect shoe-bite: sustained high pressure specifically at heel edge zones.
 * Shoe bite typically manifests as consistent high pressure at heel (s6) or toe (s1)
 * with readings persistently above normal walking thresholds.
 */
export function detectShoeBite(readings: FsrReading[]): ShoeBiteResult {
  if (!readings || readings.length < 10) {
    return { detected: false, zone: null, inference: 'Insufficient data for shoe-bite detection.' };
  }

  const heelThreshold = 2800;
  const toeThreshold = 2500;

  // Check for sustained heel-edge pressure (>70% of readings above threshold)
  const heelHighCount = readings.filter((r) => r.s6_heel >= heelThreshold).length;
  const heelPercent = heelHighCount / readings.length;

  const toeHighCount = readings.filter((r) => r.s1_big_toe >= toeThreshold).length;
  const toePercent = toeHighCount / readings.length;

  if (heelPercent >= 0.70) {
    return {
      detected: true,
      zone: 'Z6 (Heel Edge)',
      inference: `High pressure at heel edge · ${Math.round(heelPercent * 100)}% of readings above threshold`,
    };
  }

  if (toePercent >= 0.70) {
    return {
      detected: true,
      zone: 'Z1 (Big Toe)',
      inference: `High pressure at big toe zone · ${Math.round(toePercent * 100)}% of readings above threshold`,
    };
  }

  return { detected: false, zone: null, inference: 'No shoe-bite pressure patterns detected.' };
}

/**
 * Classify humidity level for display.
 */
export function classifyHumidityLevel(humidity: number | null): HumidityLevel {
  if (humidity === null) return 'Comfortable';
  if (humidity >= 75) return 'High Risk';
  if (humidity >= 60) return 'Elevated';
  return 'Comfortable';
}

/**
 * Classify in-shoe temperature for display (MLX90614-based).
 */
export function classifyTemperature(temperature: number | null): TemperatureLevel {
  if (temperature === null) return 'NORMAL';
  if (temperature >= 37) return 'HOT';
  if (temperature >= 34) return 'WARM';
  return 'NORMAL';
}
