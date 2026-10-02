import type { SessionSummary } from '@stepsense/types';
import { Activity, Footprints, Flame } from 'lucide-react';
import { COLORS } from '@stepsense/design-tokens';

interface DiabeticMetricsCardProps {
  summary: SessionSummary | null;
}

export function DiabeticMetricsCard({ summary }: DiabeticMetricsCardProps) {
  if (!summary) return null;

  // Typecasting to access the new properties until type is fully inferred in this context
  const s = summary as any;

  const ptiZones = s.pti_zones || {};
  const peakZones = s.peak_pressure_zones || {};

  const ptiData = [
    { name: 'S1 (Big Toe)', pti: ptiZones.s1_big_toe || 0, peak: peakZones.s1_big_toe || 0 },
    { name: 'S2 (2nd Toe)', pti: ptiZones.s2_second_toe || 0, peak: peakZones.s2_second_toe || 0 },
    { name: 'S3 (Ball-In)', pti: ptiZones.s3_ball_in || 0, peak: peakZones.s3_ball_in || 0 },
    { name: 'S4 (Ball-Out)', pti: ptiZones.s4_ball_out || 0, peak: peakZones.s4_ball_out || 0 },
    { name: 'S5 (Midfoot)', pti: ptiZones.s5_midfoot || 0, peak: peakZones.s5_midfoot || 0 },
    { name: 'S6 (Heel)', pti: ptiZones.s6_heel || 0, peak: peakZones.s6_heel || 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Footprints size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">CoP Progression</span>
          </div>
          <div className="text-lg font-bold text-slate-800">{s.cop_progression || 'Normal'}</div>
          <div className="text-xs text-slate-500 mt-1">Center of Pressure transfer pattern</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Gait Variability</span>
          </div>
          <div className="text-lg font-bold text-slate-800">{s.gait_variability ?? '-'} s</div>
          <div className="text-xs text-slate-500 mt-1">Stride time standard deviation</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Flame size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Max Environment</span>
          </div>
          <div className="text-lg font-bold text-slate-800">{s.max_temperature ?? '-'}°C</div>
          <div className="text-xs text-slate-500 mt-1">High Humidity Time: {s.high_humidity_time_sec ?? '-'}s</div>
        </div>
      </div>

      {/* PTI Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Pressure-Time Integral (PTI) per Zone</h3>
        <p className="text-xs text-slate-500 mb-6">PTI combines the magnitude and duration of pressure applied to the tissue. High PTI values strongly correlate with ulceration risk in diabetic neuropathy.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ptiData.map(zone => (
            <div key={zone.name} className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-600 mb-2">{zone.name}</span>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm text-slate-500">PTI</span>
                <span className="text-lg font-bold text-accent-teal">{zone.pti}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-400">Peak Load</span>
                <span className="text-xs font-medium text-slate-500">{zone.peak}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* IMU Detailed */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">IMU Kinematics & Stability</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-xs text-slate-500">Peak Acceleration</span>
            <span className="font-bold text-slate-800">{s.peak_acceleration ?? '-'} g</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Acc. Variability</span>
            <span className="font-bold text-slate-800">{s.acceleration_variability ?? '-'}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Peak Ang. Velocity</span>
            <span className="font-bold text-slate-800">{s.peak_angular_velocity ?? '-'} °/s</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Swing / Stance Ratio</span>
            <span className="font-bold text-slate-800">
              {s.swing_time && s.stance_time ? (s.swing_time / s.stance_time).toFixed(2) : '-'}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
