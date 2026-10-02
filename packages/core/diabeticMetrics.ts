import type { FsrReading } from '@stepsense/types';

export function computeDiabeticGaitMetrics(
  readings: FsrReading[],
  durationSeconds: number,
  strideTimes: number[],
  stepCount: number,
  doubleSupportPercent: number | null
) {
  if (readings.length === 0) return {
    gait_speed: null, stance_time: null, swing_time: null, step_length: null,
    gait_variability: null, foot_clearance: null
  };

  // Stance vs Swing time estimation (simplified based on double support)
  const avgStride = strideTimes.length > 0 ? strideTimes.reduce((a, b) => a + b, 0) / strideTimes.length : 1.1;
  const doubleSupport = doubleSupportPercent || 20; // default 20%
  const stance_time = avgStride * (0.5 + (doubleSupport / 200)); 
  const swing_time = avgStride - stance_time;
  
  // Speed and length
  const step_length = 0.7; // default average step length in meters
  const gait_speed = stepCount > 0 && durationSeconds > 0 ? (stepCount * step_length) / durationSeconds : null;
  
  // Variability (standard deviation of stride times)
  let gait_variability = null;
  if (strideTimes.length > 1) {
    const mean = avgStride;
    const variance = strideTimes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (strideTimes.length - 1);
    gait_variability = Math.sqrt(variance);
  }

  // Clearance (estimation from AZ - vertical acceleration peak during swing)
  const foot_clearance = null; // Would require precise integration, returning null for now to indicate conceptual metric

  return {
    gait_speed: gait_speed ? Number(gait_speed.toFixed(2)) : null,
    stance_time: Number(stance_time.toFixed(2)),
    swing_time: Number(swing_time.toFixed(2)),
    step_length,
    gait_variability: gait_variability ? Number(gait_variability.toFixed(3)) : null,
    foot_clearance
  };
}

export function computePlantarMetrics(readings: FsrReading[]) {
  const peak_pressure_zones: Record<string, number> = {
    s1_big_toe: 0, s2_second_toe: 0, s3_ball_in: 0, 
    s4_ball_out: 0, s5_midfoot: 0, s6_heel: 0
  };
  
  const pti_zones: Record<string, number> = {
    s1_big_toe: 0, s2_second_toe: 0, s3_ball_in: 0, 
    s4_ball_out: 0, s5_midfoot: 0, s6_heel: 0
  };

  const time_to_peak_pressure: Record<string, number> = {
    s1_big_toe: 0, s2_second_toe: 0, s3_ball_in: 0, 
    s4_ball_out: 0, s5_midfoot: 0, s6_heel: 0
  };

  if (readings.length === 0) return { peak_pressure_zones, pti_zones, time_to_peak_pressure, cop_progression: null };

  const timeStep = 0.1; // assuming 10Hz sampling (0.1s per reading)

  readings.forEach((r, i) => {
    const time = i * timeStep;
    
    // Peak pressure & Time to Peak
    ['s1_big_toe', 's2_second_toe', 's3_ball_in', 's4_ball_out', 's5_midfoot', 's6_heel'].forEach(zone => {
      const val = (r as any)[zone] as number;
      if (val > peak_pressure_zones[zone]) {
        peak_pressure_zones[zone] = val;
        time_to_peak_pressure[zone] = time;
      }
      // PTI integration (Pressure * Time)
      pti_zones[zone] += (val * timeStep);
    });
  });

  // Center of Pressure (CoP) progression heuristic
  // Heel -> Midfoot -> Forefoot
  let cop_progression = "Normal";
  if (peak_pressure_zones.s6_heel < peak_pressure_zones.s3_ball_in * 0.5) {
    cop_progression = "Forefoot Heavy (Poor heel strike)";
  } else if (peak_pressure_zones.s4_ball_out > peak_pressure_zones.s3_ball_in * 1.5) {
    cop_progression = "Lateral Shift (Supination)";
  } else if (peak_pressure_zones.s3_ball_in > peak_pressure_zones.s4_ball_out * 1.5) {
    cop_progression = "Medial Shift (Pronation)";
  }

  // Format to 2 decimals for PTI
  Object.keys(pti_zones).forEach(k => {
    pti_zones[k] = Number(pti_zones[k].toFixed(2));
    time_to_peak_pressure[k] = Number(time_to_peak_pressure[k].toFixed(2));
  });

  return { peak_pressure_zones, pti_zones, time_to_peak_pressure, cop_progression };
}

export function computeIMUEnvironmentMetrics(readings: FsrReading[]) {
  if (readings.length === 0) return {
    peak_acceleration: null, acceleration_variability: null, peak_angular_velocity: null,
    max_temperature: null, temp_differential_lr: null, high_humidity_time_sec: null
  };

  let maxTempL = -999, maxTempR = -999;
  let maxAcc = 0;
  let maxGyro = 0;
  let highHumidCount = 0;
  
  const accMagnitudes: number[] = [];

  readings.forEach(r => {
    // Environment
    if (r.temperature !== null) {
      if (r.foot_side === 'left' && r.temperature > maxTempL) maxTempL = r.temperature;
      if (r.foot_side === 'right' && r.temperature > maxTempR) maxTempR = r.temperature;
    }
    if (r.humidity !== null && r.humidity > 80) { // arbitrary threshold for "high" humidity
      highHumidCount++;
    }

    // IMU
    if (r.ax !== null && r.ay !== null && r.az !== null) {
      const accMag = Math.sqrt(r.ax*r.ax + r.ay*r.ay + r.az*r.az);
      accMagnitudes.push(accMag);
      if (accMag > maxAcc) maxAcc = accMag;
    }
    
    if (r.gx !== null && r.gy !== null && r.gz !== null) {
      const gyroMag = Math.sqrt(r.gx*r.gx + r.gy*r.gy + r.gz*r.gz);
      if (gyroMag > maxGyro) maxGyro = gyroMag;
    }
  });

  const max_temperature = Math.max(maxTempL, maxTempR) !== -999 ? Math.max(maxTempL, maxTempR) : null;
  const temp_differential_lr = (maxTempL !== -999 && maxTempR !== -999) ? Math.abs(maxTempL - maxTempR) : null;
  const high_humidity_time_sec = highHumidCount * 0.1; // 10Hz assumption

  let acceleration_variability = null;
  if (accMagnitudes.length > 1) {
    const mean = accMagnitudes.reduce((a, b) => a + b, 0) / accMagnitudes.length;
    const variance = accMagnitudes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (accMagnitudes.length - 1);
    acceleration_variability = Math.sqrt(variance);
  }

  return {
    peak_acceleration: maxAcc > 0 ? Number(maxAcc.toFixed(2)) : null,
    acceleration_variability: acceleration_variability ? Number(acceleration_variability.toFixed(2)) : null,
    peak_angular_velocity: maxGyro > 0 ? Number(maxGyro.toFixed(2)) : null,
    max_temperature: max_temperature ? Number(max_temperature.toFixed(1)) : null,
    temp_differential_lr: temp_differential_lr ? Number(temp_differential_lr.toFixed(2)) : null,
    high_humidity_time_sec: Number(high_humidity_time_sec.toFixed(1))
  };
}
