import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, MessageCircle, Printer, ArrowLeft } from 'lucide-react';
import { createSupabaseClient, getSessionSummary } from '@stepsense/supabase-client';
import type { SessionSummary } from '@stepsense/types';
import { ESTIMATED_INDICATOR_DISCLAIMER, COLORS } from '@stepsense/design-tokens';
import { decryptData } from '../lib/encryption';
import { isDemoModeEnabled, getMockSessions } from '../lib/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export function DoctorReportPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'doctor';
  const isUser = mode === 'user';
  
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoModeEnabled()) {
      const mock = getMockSessions().find(s => s.id === sessionId);
      if (mock) {
        setSummary(mock);
      }
      setProfile({
        doctor_name: 'Dr. Jane Smith',
        doctor_email: 'jane.smith@clinic.com',
        doctor_whatsapp: '+15550123456',
      });
      setLoading(false);
      return;
    }

    if (!supabase || !sessionId) return;
    Promise.all([
      getSessionSummary(supabase, sessionId),
      supabase.from('user_profiles').select('*').eq('id', 'user_demo').single()
    ]).then(([sum, profRes]) => {
      setSummary(sum);
      if (profRes.data) {
        setProfile({
          doctor_name: decryptData(profRes.data.doctor_name || ''),
          doctor_email: decryptData(profRes.data.doctor_email || ''),
          doctor_whatsapp: decryptData(profRes.data.doctor_whatsapp || ''),
        });
      }
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return <div className="p-8 text-center text-ink-secondary">Loading report for print...</div>;
  }

  const s = summary as any; // Extended fields access

  const ptiZones = s?.pti_zones || {};
  const ptiChartData = [
    { name: 'S1', pti: ptiZones.s1_big_toe || 0 },
    { name: 'S2', pti: ptiZones.s2_second_toe || 0 },
    { name: 'S3', pti: ptiZones.s3_ball_in || 0 },
    { name: 'S4', pti: ptiZones.s4_ball_out || 0 },
    { name: 'S5', pti: ptiZones.s5_midfoot || 0 },
    { name: 'S6', pti: ptiZones.s6_heel || 0 },
  ];

  return (
    <div className="min-h-screen bg-white p-12 text-ink-primary font-sans max-w-4xl mx-auto space-y-6">
      {/* Non-print navigation */}
      <div className="print:hidden flex justify-between items-center mb-6 pb-4 border-b border-border">
        <Link to={`/sessions/${sessionId}`} className="text-xs font-semibold text-accent-blue hover:text-slate-900 flex items-center space-x-1">
          <ArrowLeft size={14} />
          <span>Back to Detail Page</span>
        </Link>
        <div className="flex items-center space-x-3">
          {profile?.doctor_email && (
            <a 
              href={`mailto:${profile.doctor_email}?subject=StepSense%20Clinical%20Report&body=Please%20find%20my%20latest%20StepSense%20report%20attached.`}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded shadow-none-none transition-colors flex items-center space-x-2"
            >
              <Mail size={14} />
              <span>Email Doctor</span>
            </a>
          )}
          {profile?.doctor_whatsapp && (
            <a 
              href={`https://wa.me/${profile.doctor_whatsapp.replace(/\D/g, '')}?text=Hello%20Dr.%20${profile.doctor_name || ''},%20I%20have%20a%20new%20StepSense%20report%20for%20you.`}
              target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-bold rounded shadow-none-none transition-colors flex items-center space-x-2"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-accent-teal text-white text-xs font-bold rounded shadow-none hover:opacity-90 transition-opacity flex items-center space-x-2"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Clinical Report Header */}
      <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-end print:pb-4 print:mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <img src="/logo.png" alt="StepSense Logo" className="w-10 h-10 object-contain rounded bg-white" />
            <h1 className="text-3xl font-bold font-sans text-slate-800 tracking-tight">StepSense {isUser ? 'Health' : 'Medical'}</h1>
          </div>
          <h2 className="text-xl font-bold text-accent-teal">{isUser ? 'Personal Health & Gait Analysis' : 'Clinical Gait & Plantar Load Analysis'}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{isUser ? 'Personal Biomechanical Metrics Report' : 'Full Biomechanical Metrics Report'}</p>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-1">
          <p className="uppercase tracking-wider font-semibold text-slate-700">Patient Session</p>
          <p><code className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">{sessionId}</code></p>
          <p>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Gait & Biomechanical Metrics */}
      <div className="space-y-2">
        <h2 className="text-base font-bold font-sans text-ink-primary">1. Gait & Biomechanical Metrics</h2>
        <table className="w-full text-left text-xs border-collapse border border-border">
          <thead>
            <tr className="bg-page border-b border-border text-ink-secondary">
              <th className="p-2 border-r border-border">Metric</th>
              <th className="p-2 border-r border-border">Value</th>
              <th className="p-2">{isUser ? 'Normal Ranges' : 'Clinical Reference Threshold'}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Cadence</td>
              <td className="p-2 border-r border-border">{summary?.cadence ?? '-'} steps/min</td>
              <td className="p-2 text-ink-secondary">Normal range: 100 – 130 spm</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Avg Stride Time</td>
              <td className="p-2 border-r border-border">{summary?.avg_stride_time ?? '-'} s</td>
              <td className="p-2 text-ink-secondary">Normal range: 1.0 – 1.3 s</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Stride Length</td>
              <td className="p-2 border-r border-border">{s?.stride_length ?? '-'} m</td>
              <td className="p-2 text-ink-secondary">Normal range: 0.65 – 0.85 m</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Step Time</td>
              <td className="p-2 border-r border-border">{s?.step_time ?? '-'} s</td>
              <td className="p-2 text-ink-secondary">Normal range: 0.5 – 0.65 s</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Double Support %</td>
              <td className="p-2 border-r border-border">{s?.double_support_percent ?? '-'}%</td>
              <td className="p-2 text-ink-secondary">Normal range: 8 – 16%</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Gait Score</td>
              <td className="p-2 border-r border-border font-bold" style={{
                color: (s?.gait_score ?? 0) >= 70 ? COLORS.statusGood : (s?.gait_score ?? 0) >= 40 ? COLORS.statusModerate : COLORS.statusCritical,
              }}>{s?.gait_score ?? '-'} / 100</td>
              <td className="p-2 text-ink-secondary">Good: ≥ 70, Fair: 40–70, Poor: &lt; 40</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Gait Type Classification</td>
              <td className="p-2 border-r border-border">{s?.gait_type ?? 'Normal'}</td>
              <td className="p-2 text-ink-secondary">Normal | Antalgic | Shuffling | Ataxic</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Gait Asymmetry</td>
              <td className="p-2 border-r border-border">{summary?.asymmetry_percent ?? 0}%</td>
              <td className="p-2 text-ink-secondary">Asymmetry threshold: &gt; 15%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fatigue & Joint Strain */}
      <div className="space-y-2">
        <h2 className="text-base font-bold font-sans text-ink-primary">2. Fatigue & Joint Strain</h2>
        <table className="w-full text-left text-xs border-collapse border border-border">
          <thead>
            <tr className="bg-page border-b border-border text-ink-secondary">
              <th className="p-2 border-r border-border">Metric</th>
              <th className="p-2 border-r border-border">Value</th>
              <th className="p-2">Clinical Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Fatigue Index</td>
              <td className="p-2 border-r border-border">{summary?.fatigue_index ?? 0} ({summary?.fatigue_bucket ?? 'Normal'})</td>
              <td className="p-2 text-ink-secondary">Mild: ≥ 0.10, Moderate: ≥ 0.25, Severe: ≥ 0.40</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Joint Strain Score</td>
              <td className="p-2 border-r border-border font-bold" style={{
                color: (s?.joint_strain_score ?? 0) >= 65 ? COLORS.statusCritical : (s?.joint_strain_score ?? 0) >= 35 ? COLORS.statusModerate : COLORS.statusGood,
              }}>{s?.joint_strain_score ?? 0} / 100 ({s?.joint_strain_severity ?? 'LOW'})</td>
              <td className="p-2 text-ink-secondary">Dominant zone: {s?.joint_strain_zone ?? '-'}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Joint Strain (Legacy %)</td>
              <td className="p-2 border-r border-border">{summary?.joint_strain_percent ?? 0}%</td>
              <td className="p-2 text-ink-secondary">Elevated strain: &gt; 20%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Clinical Risk Indicators */}
      <div className="space-y-2">
        <h2 className="text-base font-bold font-sans text-ink-primary">3. Clinical Risk Indicators</h2>
        <table className="w-full text-left text-xs border-collapse border border-border">
          <thead>
            <tr className="bg-page border-b border-border text-ink-secondary">
              <th className="p-2 border-r border-border">Indicator</th>
              <th className="p-2 border-r border-border">Score / Status</th>
              <th className="p-2">Clinical Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Fall Risk Score</td>
              <td className="p-2 border-r border-border font-bold" style={{
                color: (s?.fall_risk_score ?? 0) >= 60 ? COLORS.statusCritical : (s?.fall_risk_score ?? 0) >= 30 ? COLORS.statusModerate : COLORS.statusGood,
              }}>{s?.fall_risk_score ?? 0} / 100</td>
              <td className="p-2 text-ink-secondary">Composite of asymmetry, cadence, fatigue, cohort</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Fall Detected</td>
              <td className="p-2 border-r border-border">{summary?.fall_detected ? '⚠️ YES' : 'No'}</td>
              <td className="p-2 text-ink-secondary">{summary?.fall_timestamp ? `At: ${new Date(summary.fall_timestamp).toLocaleTimeString()}` : 'No fall event recorded'}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Tremor / Parkinson's Flag</td>
              <td className="p-2 border-r border-border">{s?.tremor_flag ? '⚠️ FLAGGED' : 'Not Detected'}</td>
              <td className="p-2 text-ink-secondary">Gyroscope oscillation pattern + low cadence analysis</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Vascular Strain Risk</td>
              <td className="p-2 border-r border-border font-bold" style={{
                color: (s?.vascular_risk_score ?? 0) >= 60 ? COLORS.statusCritical : (s?.vascular_risk_score ?? 0) >= 35 ? COLORS.statusModerate : COLORS.statusGood,
              }}>{s?.vascular_risk_score ?? 0} / 100</td>
              <td className="p-2 text-ink-secondary">Standing duration + weight shift variance</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Diabetic Ulcer Risk</td>
              <td className="p-2 border-r border-border font-bold" style={{
                color: (s?.ulcer_risk_score ?? 0) >= 60 ? COLORS.statusCritical : (s?.ulcer_risk_score ?? 0) >= 30 ? COLORS.statusModerate : COLORS.statusGood,
              }}>{s?.ulcer_risk_score ?? 0} / 100</td>
              <td className="p-2 text-ink-secondary">Chronic pressure hotspot analysis across sessions</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Fungal Risk</td>
              <td className="p-2 border-r border-border">{s?.fungal_risk_score ?? 0} / 100</td>
              <td className="p-2 text-ink-secondary">Humidity + temperature + duration analysis</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Shoe-Bite</td>
              <td className="p-2 border-r border-border">{s?.shoe_bite_detected ? '⚠️ DETECTED' : 'Not Detected'}</td>
              <td className="p-2 text-ink-secondary">Sustained edge pressure at heel/toe zones</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-2 border-r border-border font-semibold">Terrain</td>
              <td className="p-2 border-r border-border">{summary?.terrain_label ?? 'Flat'} ({s?.terrain_confidence ?? 0}% confidence)</td>
              <td className="p-2 text-ink-secondary">MPU6050 accelerometer + gyroscope classification</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Diabetic & Plantar Loading Analysis */}
      <div className="space-y-2 pt-4">
        <h2 className="text-base font-bold font-sans text-ink-primary">4. Diabetic & Plantar Loading Analysis</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <table className="w-full text-left text-xs border-collapse border border-border">
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2 border-r border-border font-semibold bg-page">Gait Speed</td>
                <td className="p-2">{s?.gait_speed ?? '-'} m/s</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 border-r border-border font-semibold bg-page">Swing / Stance Ratio</td>
                <td className="p-2">{s?.swing_time && s?.stance_time ? (s.swing_time / s.stance_time).toFixed(2) : '-'}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 border-r border-border font-semibold bg-page">CoP Progression</td>
                <td className="p-2">{s?.cop_progression ?? '-'}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 border-r border-border font-semibold bg-page">IMU Peak Acc.</td>
                <td className="p-2">{s?.peak_acceleration ?? '-'} g</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 border-r border-border font-semibold bg-page">Max Env. Temp</td>
                <td className="p-2">{s?.max_temperature ?? '-'}°C</td>
              </tr>
            </tbody>
          </table>

          <div className="border border-border p-2">
            <h3 className="text-xs font-bold text-center mb-2">Pressure-Time Integral (PTI)</h3>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ptiChartData}>
                  <XAxis dataKey="name" fontSize={8} interval={0} />
                  <YAxis fontSize={8} />
                  <Tooltip />
                  <Bar dataKey="pti" fill={COLORS.accentTeal} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* AI Clinical Narrative Report */}
      <div className="space-y-2 pt-4">
        <h2 className="text-base font-bold font-sans text-ink-primary">5. {isUser ? 'Health Narrative & Insights' : 'Clinical Narrative & Biomechanical Assessment'}</h2>
        <div className="p-4 bg-page rounded border border-border text-xs leading-relaxed whitespace-pre-line text-ink-primary font-sans">
          {isUser ? summary?.ai_report_consumer || 'No personal health insights generated.' : summary?.ai_report_doctor || 'No clinical report generated for this session.'}
        </div>
      </div>

      {/* Baseline Comparison */}
      {(summary?.baseline_avg_fatigue !== null || summary?.baseline_avg_asymmetry !== null) && (
        <div className="space-y-2 pt-4">
          <h2 className="text-base font-bold font-sans text-ink-primary">6. Baseline Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            {summary?.baseline_avg_fatigue !== null && (
              <div className="p-3 bg-page rounded border border-border">
                <span className="text-xs font-semibold">Baseline Avg Fatigue:</span>
                <span className="text-xs ml-2">{summary?.baseline_avg_fatigue}</span>
              </div>
            )}
            {summary?.baseline_avg_asymmetry !== null && (
              <div className="p-3 bg-page rounded border border-border">
                <span className="text-xs font-semibold">Baseline Avg Asymmetry:</span>
                <span className="text-xs ml-2">{summary?.baseline_avg_asymmetry}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="pt-6 border-t border-border text-[10px] text-ink-secondary text-center space-y-1">
        <p className="font-semibold">{ESTIMATED_INDICATOR_DISCLAIMER}</p>
        <p>This report is generated automatically by StepSense platform algorithm models for clinical decision support.</p>
        <p>StepSense © {new Date().getFullYear()} — Samsung Solve for Tomorrow</p>
      </div>
    </div>
  );
}
