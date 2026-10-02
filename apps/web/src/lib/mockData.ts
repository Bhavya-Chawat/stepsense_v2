import type { SessionSummary } from '@stepsense/types';

export function getMockSessions(): SessionSummary[] {
  const sessions: SessionSummary[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    sessions.push({
      id: `demo-session-${i}`,
      user_id: 'user_demo',
      created_at: d.toISOString(),
      updated_at: d.toISOString(),
      gait_score: 80 - Math.floor(Math.random() * 20),
      gait_type: 'Normal',
      cadence: 105 + Math.floor(Math.random() * 10),
      stride_length: 0.72 + (Math.random() * 0.05),
      step_time: 0.55 + (Math.random() * 0.05),
      double_support_percent: 12 + Math.floor(Math.random() * 4),
      fatigue_index: 0.15 + (Math.random() * 0.1),
      fatigue_bucket: 'Mild',
      fatigue_score: 85,
      joint_strain_score: 20 + Math.floor(Math.random() * 10),
      joint_strain_severity: 'LOW',
      joint_strain_zone: 'Heel',
      asymmetry_percent: 5 + Math.floor(Math.random() * 5),
      fall_risk_score: 25 + Math.floor(Math.random() * 10),
      fall_detected: false,
      tremor_flag: false,
      vascular_risk_score: 30 + Math.floor(Math.random() * 10),
      ulcer_risk_score: 20 + Math.floor(Math.random() * 10),
      fungal_risk_score: 15 + Math.floor(Math.random() * 10),
      shoe_bite_detected: false,
      terrain_label: 'Flat',
      terrain_confidence: 95,
      ai_report_patient: 'Your gait is looking good. Keep up the consistent pace.',
      ai_report_doctor: 'Patient shows stable gait parameters with normal cadence and stride length. No significant asymmetry or joint strain detected. Recommend continuing current activity level.',
      avg_stride_time: 1.1 + (Math.random() * 0.1),
      joint_strain_percent: 15,
      baseline_avg_fatigue: 0.12,
      baseline_avg_asymmetry: 4
    } as any);
  }

  // Add one critical session at the end
  sessions.push({
    id: `demo-session-critical`,
    user_id: 'user_demo',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    gait_score: 45,
    gait_type: 'Antalgic',
    cadence: 85,
    stride_length: 0.55,
    step_time: 0.75,
    double_support_percent: 22,
    fatigue_index: 0.45,
    fatigue_bucket: 'Severe',
    fatigue_score: 40,
    joint_strain_score: 75,
    joint_strain_severity: 'HIGH',
    joint_strain_zone: 'Right Knee',
    asymmetry_percent: 25,
    fall_risk_score: 65,
    fall_detected: false,
    tremor_flag: true,
    vascular_risk_score: 65,
    ulcer_risk_score: 45,
    fungal_risk_score: 25,
    shoe_bite_detected: true,
    terrain_label: 'Stairs Down',
    terrain_confidence: 85,
    ai_report_patient: 'You seem to be experiencing significant fatigue and irregular steps today. Please rest and consider consulting your doctor.',
    ai_report_doctor: 'URGENT: Patient exhibits severe antalgic gait with high asymmetry (25%) and increased double support time. High joint strain in Right Knee. Fall risk is elevated (65/100). Tremor flag detected. Recommend immediate clinical review and possible intervention.',
    avg_stride_time: 1.45,
    joint_strain_percent: 35,
    baseline_avg_fatigue: 0.12,
    baseline_avg_asymmetry: 4
  } as any);

  return sessions.reverse();
}

export function isDemoModeEnabled(): boolean {
  return localStorage.getItem('demo_mode') === 'true';
}

export function setDemoModeEnabled(enabled: boolean) {
  localStorage.setItem('demo_mode', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('demo_mode_changed'));
}

export function generateMockReading(sessionId: string, footSide: 'left'|'right', timeIndex: number) {
  const cycle = (timeIndex / 10) % (Math.PI * 2); 
  const phaseOffset = footSide === 'left' ? 0 : Math.PI; 
  
  const heelForce = Math.max(0, Math.sin(cycle + phaseOffset)) * 4000;
  const midForce = Math.max(0, Math.sin(cycle + phaseOffset - Math.PI/4)) * 3000;
  const toeForce = Math.max(0, Math.sin(cycle + phaseOffset - Math.PI/2)) * 3500;

  const noise = () => Math.random() * 200;

  return {
    id: `mock-reading-${footSide}-${timeIndex}`,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    foot_side: footSide,
    temperature: 36.5 + (Math.random() * 0.4),
    humidity: 45 + (Math.random() * 5),
    s1_big_toe: Math.min(4095, toeForce + noise()),
    s2_second_toe: Math.min(4095, (toeForce * 0.8) + noise()),
    s3_ball_in: Math.min(4095, (toeForce * 1.2) + noise()),
    s4_ball_out: Math.min(4095, (toeForce * 0.9) + noise()),
    s5_midfoot: Math.min(4095, midForce + noise()),
    s6_heel: Math.min(4095, heelForce + noise()),
  };
}
