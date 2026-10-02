import type { AlertItem } from '@stepsense/types';
import type { FatigueBucket } from './fatigue';

export const PROLONGED_STANDING_THRESHOLD_SECONDS = 1800; // 30 mins
export const PROLONGED_SITTING_THRESHOLD_SECONDS = 3600; // 60 mins
export const ASYMMETRY_ALERT_THRESHOLD = 25; // 25%

export interface ComputeAlertsInput {
  fallDetected: boolean;
  standingDurationSeconds: number;
  sittingDurationSeconds: number;
  fatigueLevel: FatigueBucket;
  asymmetryPercent: number;
  fungalRisk: boolean;
  vascularStrainFlag: boolean;
  ulcerFlaggedZones: string[];
  shoeBiteDetected: boolean;
  tremorFlag: boolean;
  jointStrainSeverity: string;
  sessionTimestamp?: string;
  standingThresholdSeconds?: number;
  sittingThresholdSeconds?: number;
  asymmetryThresholdPercent?: number;
}

export function computeAlerts(input: ComputeAlertsInput): AlertItem[] {
  const alerts: AlertItem[] = [];
  const ts = input.sessionTimestamp || new Date().toISOString();

  const standingThreshold = input.standingThresholdSeconds ?? PROLONGED_STANDING_THRESHOLD_SECONDS;
  const sittingThreshold = input.sittingThresholdSeconds ?? PROLONGED_SITTING_THRESHOLD_SECONDS;
  const asymmetryThreshold = input.asymmetryThresholdPercent ?? ASYMMETRY_ALERT_THRESHOLD;

  if (input.fallDetected) {
    alerts.push({ message: 'Fall detected — immediate attention required', severity: 'critical', category: 'safety', timestamp: ts });
  }

  if (input.tremorFlag) {
    alerts.push({ message: 'Tremor pattern detected — possible Parkinson\'s indicator', severity: 'critical', category: 'health', timestamp: ts });
  }

  if (input.standingDurationSeconds > standingThreshold) {
    alerts.push({ message: 'Prolonged standing — risk of vascular strain', severity: 'moderate', category: 'posture', timestamp: ts });
  }

  if (input.sittingDurationSeconds > sittingThreshold) {
    alerts.push({ message: 'Prolonged sitting — recommend movement break', severity: 'low', category: 'posture', timestamp: ts });
  }

  if (input.fatigueLevel === 'Severe') {
    alerts.push({ message: 'Severe fatigue detected — consider rest', severity: 'critical', category: 'fatigue', timestamp: ts });
  } else if (input.fatigueLevel === 'Moderate') {
    alerts.push({ message: 'Moderate fatigue — monitor for progression', severity: 'moderate', category: 'fatigue', timestamp: ts });
  }

  if (input.asymmetryPercent > asymmetryThreshold) {
    alerts.push({ message: `High gait asymmetry (${input.asymmetryPercent}%) — fall risk elevated`, severity: 'moderate', category: 'gait', timestamp: ts });
  }

  if (input.jointStrainSeverity === 'HIGH') {
    alerts.push({ message: 'High joint strain — sustained zone overloading detected', severity: 'moderate', category: 'joints', timestamp: ts });
  }

  if (input.vascularStrainFlag) {
    alerts.push({ message: 'Vascular strain flag — prolonged static standing with low weight shifting', severity: 'moderate', category: 'vascular', timestamp: ts });
  }

  if (input.ulcerFlaggedZones.length > 0) {
    alerts.push({ message: `Diabetic ulcer risk — chronic hotspots: ${input.ulcerFlaggedZones.join(', ')}`, severity: 'moderate', category: 'ulcer', timestamp: ts });
  }

  if (input.shoeBiteDetected) {
    alerts.push({ message: 'Shoe-bite alert — sustained edge pressure detected', severity: 'low', category: 'footwear', timestamp: ts });
  }

  if (input.fungalRisk) {
    alerts.push({ message: 'Fungal/tinea risk — elevated humidity in shoe environment', severity: 'low', category: 'environment', timestamp: ts });
  }

  return alerts;
}
