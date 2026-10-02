import type { FsrReading } from '@stepsense/types';
import { computeDiabeticGaitMetrics, computePlantarMetrics, computeIMUEnvironmentMetrics } from './diabeticMetrics';
import { detectHeelStrikes, detectToeOffs, computeCadence, computeStrideTimes, computeGaitPhases, computeStrideLength, computeStepTime, computeDoubleSupportPercent, classifyGaitType, computeGaitScore } from './gait';
import { computeFatigueIndex, bucketFatigueIndex, computeFatigueScore, type FatigueBucket } from './fatigue';
import { computeAsymmetryPercent } from './asymmetry';
import { computeJointStrainScore, computeJointStrain } from './jointStrain';
import { detectFall, computeFallRiskScore, detectTremorFlag } from './fallDetection';
import { detectFungalRisk, computeFungalRiskScore, detectShoeBite } from './shoeEnvironment';
import { computeAlerts } from './alerts';
import { computeStandingDuration, computeWeightShiftVariance, detectVascularStrainFlag, computeVascularRiskScore } from './vascularRisk';
import { detectUlcerRiskFlags, computeUlcerRiskScore } from './ulcerRisk';
import { classifyTerrain } from './terrain';
import type { AlertItem } from '@stepsense/types';

export interface FinalizedMetrics {
  // New Diabetic Gait & Environment Metrics
  gait_speed: number | null;
  stance_time: number | null;
  swing_time: number | null;
  step_length: number | null;
  gait_variability: number | null;
  foot_clearance: number | null;
  
  peak_pressure_zones: Record<string, number> | null;
  pti_zones: Record<string, number> | null;
  time_to_peak_pressure: Record<string, number> | null;
  cop_progression: string | null;
  
  peak_acceleration: number | null;
  acceleration_variability: number | null;
  peak_angular_velocity: number | null;
  
  max_temperature: number | null;
  temp_differential_lr: number | null;
  high_humidity_time_sec: number | null;

  // Gait metrics
  cadence: number | null;
  avg_stride_time: number | null;
  step_time: number | null;
  stride_length: number | null;
  double_support_percent: number | null;
  gait_score: number | null;
  gait_type: string | null;

  // Fatigue metrics
  fatigue_index: number | null;
  fatigue_bucket: FatigueBucket | null;
  fatigue_score: number | null;

  // Asymmetry & Joint strain
  asymmetry_percent: number | null;
  joint_strain_percent: number | null;
  joint_strain_score: number | null;
  joint_strain_severity: string | null;
  joint_strain_zone: string | null;

  // Fall & safety
  fall_detected: boolean;
  fall_timestamp: string | null;
  fall_risk_score: number | null;
  tremor_flag: boolean;

  // Shoe environment
  fungal_risk: boolean;
  fungal_risk_score: number | null;
  shoe_bite_detected: boolean;

  // Vascular & ulcer
  vascular_strain_flag: boolean;
  vascular_risk_score: number | null;
  ulcer_risk_zones: Record<string, boolean>;
  ulcer_risk_score: number | null;

  // Terrain
  terrain_label: string | null;
  terrain_confidence: number | null;

  // Alerts
  alerts: AlertItem[];

  // Baseline
  baseline_avg_fatigue: number | null;
  baseline_avg_asymmetry: number | null;

  // AI Reports
  ai_report_consumer: string | null;
  ai_report_doctor: string | null;
}

export function finalizeSessionMetrics(
  readings: FsrReading[],
  baseline?: { avgFatigue: number; avgAsymmetry: number },
  pastSessionsPeaksByZone?: Record<string, number[]>,
  cohort: string = 'adult'
): FinalizedMetrics {
  if (!readings || readings.length === 0) {
    return {
      gait_speed: null, stance_time: null, swing_time: null, step_length: null, gait_variability: null, foot_clearance: null,
      peak_pressure_zones: null, pti_zones: null, time_to_peak_pressure: null, cop_progression: null,
      peak_acceleration: null, acceleration_variability: null, peak_angular_velocity: null,
      max_temperature: null, temp_differential_lr: null, high_humidity_time_sec: null,
      cadence: null,
      avg_stride_time: null,
      step_time: null,
      stride_length: null,
      double_support_percent: null,
      gait_score: null,
      gait_type: null,
      fatigue_index: null,
      fatigue_bucket: null,
      fatigue_score: null,
      asymmetry_percent: null,
      joint_strain_percent: null,
      joint_strain_score: null,
      joint_strain_severity: null,
      joint_strain_zone: null,
      fall_detected: false,
      fall_timestamp: null,
      fall_risk_score: null,
      tremor_flag: false,
      fungal_risk: false,
      fungal_risk_score: null,
      shoe_bite_detected: false,
      vascular_strain_flag: false,
      vascular_risk_score: null,
      ulcer_risk_zones: {},
      ulcer_risk_score: null,
      terrain_label: null,
      terrain_confidence: null,
      alerts: [],
      baseline_avg_fatigue: baseline?.avgFatigue ?? null,
      baseline_avg_asymmetry: baseline?.avgAsymmetry ?? null,
      ai_report_consumer: null,
      ai_report_doctor: null,
    };
  }

  const startTime = new Date(readings[0].created_at).getTime();
  const endTime = new Date(readings[readings.length - 1].created_at).getTime();
  const durationSeconds = Math.max(0, (endTime - startTime) / 1000);
  const durationMinutes = durationSeconds / 60;

  const lastReading = readings[readings.length - 1];
  const stepCount = lastReading.step_count || 0;

  // 1. Gait metrics
  const heelStrikes = detectHeelStrikes(readings);
  const toeOffs = detectToeOffs(readings);
  const cadence = computeCadence(stepCount, durationSeconds);
  const strideTimes = computeStrideTimes(heelStrikes);
  const gaitPhases = computeGaitPhases(heelStrikes, toeOffs);
  const avg_stride_time =
    strideTimes.length > 0
      ? Number((strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length).toFixed(2))
      : null;
  const step_time = computeStepTime(heelStrikes);
  const stride_length = computeStrideLength(avg_stride_time);
  const double_support_percent = computeDoubleSupportPercent(gaitPhases);

  // 2. Fatigue metrics
  const fatigue_index = computeFatigueIndex(readings);
  const fatigue_bucket = bucketFatigueIndex(fatigue_index);
  const fatigue_score = computeFatigueScore(fatigue_index);

  // 3. Asymmetry & Joint strain
  const leftReadings = readings.filter(r => r.foot_side === 'left');
  const rightReadings = readings.filter(r => r.foot_side === 'right');

  const getPeak = (arr: FsrReading[]) => {
    if (arr.length === 0) return 0;
    return Math.max(...arr.map(r => 
      r.s1_big_toe + r.s2_second_toe + r.s3_ball_in + r.s4_ball_out + r.s5_midfoot + r.s6_heel
    ));
  };

  const leftPeak = getPeak(leftReadings);
  const rightPeak = getPeak(rightReadings);
  
  // If one foot is missing, asymmetry is 0 (Unilateral session)
  const isUnilateral = leftReadings.length === 0 || rightReadings.length === 0;
  const asymmetry_percent = isUnilateral ? null : computeAsymmetryPercent(leftPeak, rightPeak);
  const joint_strain_percent = computeJointStrain(leftPeak, rightPeak); // legacy compat
  const jointStrainResult = computeJointStrainScore(readings);

  // 4. Gait classification & score
  const gait_type = classifyGaitType(cadence, avg_stride_time, asymmetry_percent ?? 0, strideTimes);
  const gait_score = computeGaitScore(cadence, avg_stride_time, asymmetry_percent ?? 0, fatigue_bucket, strideTimes);

  // 5. Fall & safety
  const fallResult = detectFall(readings);
  const fall_risk_score = computeFallRiskScore(asymmetry_percent ?? 0, cadence, fatigue_index, cohort);
  const tremor_flag = detectTremorFlag(readings, cadence);

  // 6. Shoe environment
  const fungal_risk = detectFungalRisk(readings);
  const avgHumidity = readings.reduce((sum, r) => sum + (r.humidity ?? 0), 0) / readings.length;
  const avgTemp = readings.reduce((sum, r) => sum + (r.temperature ?? 0), 0) / readings.length;
  const fungalRiskResult = computeFungalRiskScore(
    readings[0].humidity !== null ? avgHumidity : null,
    readings[0].temperature !== null ? avgTemp : null,
    durationMinutes
  );
  const shoeBiteResult = detectShoeBite(readings);

  // 7. Vascular, Ulcer, Terrain
  const standingDurationMin = computeStandingDuration(readings);
  const weightShiftVar = computeWeightShiftVariance(readings);
  const vascular_strain_flag = detectVascularStrainFlag(standingDurationMin, weightShiftVar);
  const vascularResult = computeVascularRiskScore(standingDurationMin, weightShiftVar, avgTemp || null);

  const ulcer_risk_zones = detectUlcerRiskFlags(pastSessionsPeaksByZone || {});
  const ulcerResult = computeUlcerRiskScore(pastSessionsPeaksByZone || {});

  const terrainResult = classifyTerrain(readings);

  // 8. Alerts composition
  const alerts = computeAlerts({
    fallDetected: fallResult.detected,
    standingDurationSeconds: Math.round(standingDurationMin * 60),
    sittingDurationSeconds: 0,
    fatigueLevel: fatigue_bucket,
    asymmetryPercent: asymmetry_percent ?? 0,
    fungalRisk: fungal_risk,
    vascularStrainFlag: vascular_strain_flag,
    ulcerFlaggedZones: ulcerResult.flaggedZones,
    shoeBiteDetected: shoeBiteResult.detected,
    tremorFlag: tremor_flag,
    jointStrainSeverity: jointStrainResult.severity,
    sessionTimestamp: readings[0].created_at,
  });

  // 9. Advanced Diabetic Metrics
  const diabeticGait = computeDiabeticGaitMetrics(readings, durationSeconds, strideTimes, stepCount, double_support_percent);
  const plantarMetrics = computePlantarMetrics(readings);
  const imuEnvMetrics = computeIMUEnvironmentMetrics(readings);

  return {
    ...diabeticGait,
    ...plantarMetrics,
    ...imuEnvMetrics,
    cadence,
    avg_stride_time,
    step_time,
    stride_length,
    double_support_percent,
    gait_score: Number(gait_score),
    gait_type,
    fatigue_index,
    fatigue_bucket,
    fatigue_score,
    asymmetry_percent,
    joint_strain_percent,
    joint_strain_score: jointStrainResult.score,
    joint_strain_severity: jointStrainResult.severity,
    joint_strain_zone: jointStrainResult.dominantZoneLabel,
    fall_detected: fallResult.detected,
    fall_timestamp: fallResult.timestamp,
    fall_risk_score,
    tremor_flag,
    fungal_risk,
    fungal_risk_score: fungalRiskResult.score,
    shoe_bite_detected: shoeBiteResult.detected,
    vascular_strain_flag,
    vascular_risk_score: vascularResult.score,
    ulcer_risk_zones,
    ulcer_risk_score: ulcerResult.score,
    terrain_label: terrainResult.terrain,
    terrain_confidence: terrainResult.confidence,
    alerts,
    baseline_avg_fatigue: baseline?.avgFatigue ?? null,
    baseline_avg_asymmetry: baseline?.avgAsymmetry ?? null,
    ai_report_consumer: null,
    ai_report_doctor: null,
  };
}
