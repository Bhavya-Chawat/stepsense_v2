import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SessionSummary } from '@stepsense/types';
import { COLORS } from '@stepsense/design-tokens';
import { ScoreGauge, SeverityBadge } from './ScoreGauge';

interface GaitAnalysisCardProps {
  summary: SessionSummary | null;
  currentPhase?: string;
  pastSummaries?: SessionSummary[];
}

export function GaitAnalysisCard({ summary, currentPhase, pastSummaries }: GaitAnalysisCardProps) {
  if (!summary) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-ink-secondary">No gait data available.</p>
      </div>
    );
  }

  // Build 7-day trend data from past summaries
  const trendData = (pastSummaries || [])
    .filter((s) => (s as any).gait_score !== null && (s as any).gait_score !== undefined)
    .slice(-7)
    .map((s, i) => ({
      day: new Date(s.created_at).toLocaleDateString('en', { weekday: 'short' }),
      score: (s as any).gait_score ?? 0,
    }));

  const avgScore = trendData.length > 0
    ? Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length)
    : null;

  const gaitScore = (summary as any).gait_score ?? null;
  const gaitType = (summary as any).gait_type ?? 'Normal';
  const stepTime = (summary as any).step_time ?? null;
  const strideLength = (summary as any).stride_length ?? null;
  const doubleSupportPercent = (summary as any).double_support_percent ?? null;

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-none-none space-y-5 text-ink-primary">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h3 className="text-base font-bold font-sans text-accent-teal">Gait Analysis</h3>
      </div>

      {/* Current Phase Indicator */}
      {currentPhase && (
        <div className="bg-page rounded-lg border border-border p-4 text-center">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider mb-2">Current State</p>
          <div className="inline-flex items-center px-6 py-2 rounded-full border-2" style={{
            borderColor: currentPhase === 'SWING' ? COLORS.accentBlue : COLORS.statusGood,
            backgroundColor: currentPhase === 'SWING' ? `${COLORS.accentBlue}15` : `${COLORS.statusGood}15`,
          }}>
            <span className="text-xl font-bold tracking-wide" style={{
              color: currentPhase === 'SWING' ? COLORS.accentBlue : COLORS.statusGood,
            }}>
              {currentPhase}
            </span>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {['STANCE', 'SWING', 'HEEL', 'TOE'].map((phase) => (
              <span
                key={phase}
                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  phase === currentPhase
                    ? 'bg-accent-teal text-white'
                    : 'bg-border/40 text-ink-secondary'
                }`}
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fatigue Gauge + Gait Score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-3 bg-page rounded border border-border">
          <ScoreGauge
            score={gaitScore ?? 0}
            label="Gait Score"
            size={72}
          />
        </div>

        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Cadence</p>
          <p className="text-lg font-bold text-ink-primary">{summary.cadence ?? '-'}<span className="text-xs font-normal text-ink-secondary ml-1">spm</span></p>
          <p className="text-[10px] text-ink-secondary">± Normal range</p>
        </div>

        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Gait Type</p>
          <p className="text-base font-bold" style={{
            color: gaitType === 'Normal' ? COLORS.statusGood : COLORS.statusModerate,
          }}>
            {gaitType}
          </p>
          <p className="text-[10px] text-ink-secondary">
            {gaitType === 'Normal' ? 'Symmetric stride' : 'Irregular pattern'}
          </p>
        </div>

        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Fatigue</p>
          <SeverityBadge severity={summary.fatigue_bucket ?? 'Normal'} />
          <p className="text-[10px] text-ink-secondary mt-1">Index: {summary.fatigue_index ?? 0}</p>
        </div>
      </div>

      {/* 7-Day Gait Score Trend */}
      {trendData.length > 1 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-ink-primary">7-Day Gait Score</p>
            {avgScore !== null && (
              <span className="text-xs font-semibold" style={{ color: COLORS.accentBlue }}>
                Avg {avgScore}
              </span>
            )}
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" stroke={COLORS.inkSecondary} fontSize={10} />
                <YAxis domain={[0, 100]} stroke={COLORS.inkSecondary} fontSize={10} hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: COLORS.bgCard,
                    borderColor: COLORS.border,
                    fontSize: '11px',
                  }}
                />
                {avgScore !== null && (
                  <ReferenceLine y={avgScore} stroke={COLORS.accentBlue} strokeDasharray="4 4" />
                )}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={COLORS.accentBlue}
                  strokeWidth={2}
                  dot={{ fill: COLORS.accentBlue, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-page rounded border border-border text-center">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Stride Length</p>
          <p className="text-base font-bold text-ink-primary">
            {strideLength ?? '-'}<span className="text-[10px] font-normal text-ink-secondary">m</span>
          </p>
        </div>
        <div className="p-3 bg-page rounded border border-border text-center">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Step Time</p>
          <p className="text-base font-bold text-ink-primary">
            {stepTime ?? '-'}<span className="text-[10px] font-normal text-ink-secondary">s</span>
          </p>
        </div>
        <div className="p-3 bg-page rounded border border-border text-center">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase">Double Sup.</p>
          <p className="text-base font-bold text-ink-primary">
            {doubleSupportPercent ?? '-'}<span className="text-[10px] font-normal text-ink-secondary">%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
