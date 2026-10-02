export interface FsrReading {
  id: string;
  created_at: string;
  session_id: string;
  s1_big_toe: number;
  s2_second_toe: number;
  s3_ball_in: number;
  s4_ball_out: number;
  s5_midfoot: number;
  s6_heel: number;
  step_count: number;
  temperature: number | null;
  humidity: number | null;
  ax: number | null;
  ay: number | null;
  az: number | null;
  gx: number | null;
  gy: number | null;
  gz: number | null;
  foot_side: 'left' | 'right' | null;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  foot_side: 'left' | 'right' | null;
}

export interface AlertItem {
  message: string;
  severity: 'critical' | 'moderate' | 'low';
  category?: string;
  timestamp?: string;
}

export interface SessionSummary {
  id: string;
  session_id: string;

  // Gait metrics
  cadence: number | null;
  step_count: number | null;
  avg_stride_time: number | null;
  step_time: number | null;
  stride_length: number | null;
  double_support_percent: number | null;
  gait_score: number | null;
  gait_type: string | null;

  // Fatigue
  fatigue_index: number | null;
  fatigue_bucket: string | null;
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

  // AI Reports
  ai_report_consumer: string | null;
  ai_report_doctor: string | null;

  created_at: string;
}

export type Cohort = 'child' | 'adult' | 'elderly' | 'athlete';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  age: number | null;
  cohort: Cohort;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
}
