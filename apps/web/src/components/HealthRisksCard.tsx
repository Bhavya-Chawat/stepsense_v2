import type { SessionSummary } from '@stepsense/types';
import { ScoreGauge, SeverityBadge } from './ScoreGauge';
import { HeartPulse } from 'lucide-react';

interface HealthRisksCardProps {
  summary: SessionSummary | null;
}

function getSev(score: number, lo = 30, hi = 60) {
  if (score >= hi) return 'HIGH';
  if (score >= lo) return 'MODERATE';
  return 'LOW';
}

function scoreColor(score: number, lo = 30, hi = 60): string {
  if (score >= hi) return 'var(--color-status-critical)';
  if (score >= lo) return 'var(--color-status-moderate)';
  return 'var(--color-status-good)';
}

export function HealthRisksCard({ summary }: HealthRisksCardProps) {
  if (!summary) {
    return (
      <div className="card p-6 text-center text-sm text-ink-secondary">
        No health risk data available.
      </div>
    );
  }

  const fallRiskScore    = (summary as any).fall_risk_score ?? 0;
  const tremorFlag       = (summary as any).tremor_flag ?? false;
  const vascularScore    = (summary as any).vascular_risk_score ?? 0;
  const jointStrainScore = (summary as any).joint_strain_score ?? 0;
  const jointStrainSev   = (summary as any).joint_strain_severity ?? 'LOW';
  const jointStrainZone  = (summary as any).joint_strain_zone ?? '-';
  const ulcerScore       = (summary as any).ulcer_risk_score ?? 0;
  const slowCadenceScore = summary.cadence !== null
    ? Math.max(0, Math.min(100, Math.round((1 - Math.min(summary.cadence, 130) / 130) * 100)))
    : 0;

  const rows: Array<{
    title: string; subtitle: string; score: number; sev: string;
    isFlag?: boolean; detected?: boolean;
  }> = [
    { title: 'Fall Risk',           subtitle: 'Inferred from IMU + asymmetry',       score: fallRiskScore,    sev: getSev(fallRiskScore, 30, 60) },
    { title: "Parkinson's Flag",    subtitle: 'Inferred from tremor + cadence',       score: 0,               sev: '',         isFlag: true, detected: tremorFlag },
    { title: 'Vascular / Varicose', subtitle: 'Inferred from temp + pressure zones', score: vascularScore,   sev: getSev(vascularScore, 35, 60) },
    { title: 'Joint Pain Risk',     subtitle: `${jointStrainZone} zone overload`,    score: jointStrainScore, sev: jointStrainSev },
    { title: 'Slow Cadence',        subtitle: 'Inferred from step frequency',         score: slowCadenceScore, sev: getSev(slowCadenceScore, 50, 75) },
    { title: 'Diabetic Ulcer Risk', subtitle: 'Chronic pressure hotspot analysis',   score: ulcerScore,       sev: getSev(ulcerScore, 30, 60) },
  ];

  return (
    <div className="card p-5 space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-center space-x-2.5 pb-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-status-critical-bg)' }}>
          <HeartPulse size={16} style={{ color: 'var(--color-status-critical)' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink-primary">Health Risks</h3>
          <p className="text-[10px] text-ink-tertiary uppercase tracking-widest font-medium">Clinical Risk Indicators</p>
        </div>
      </div>

      {/* Risk Rows */}
      <div className="space-y-2.5">
        {rows.map(row => (
          <div
            key={row.title}
            className="risk-row"
          >
            {/* Left: Gauge + labels */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {!row.isFlag && (
                <div className="shrink-0">
                  <ScoreGauge
                    score={row.score}
                    label=""
                    size={68}
                    severity={row.sev}
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-primary leading-snug">{row.title}</p>
                <p className="text-[11px] text-ink-secondary mt-0.5 leading-tight">{row.subtitle}</p>
              </div>
            </div>

            {/* Right: badge + score */}
            <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
              <SeverityBadge severity={row.isFlag ? (row.detected ? 'MODERATE' : 'LOW') : row.sev} />
              {!row.isFlag && (
                <p className="text-base font-bold tabular-nums leading-none" style={{ color: scoreColor(row.score) }}>
                  {row.score}
                  <span className="text-[10px] font-normal text-ink-tertiary ml-0.5">/100</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
