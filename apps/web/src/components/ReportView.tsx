import { useState } from 'react';
import type { SessionSummary } from '@stepsense/types';
import { modeCopy, type ViewMode } from '@stepsense/design-tokens';
import { createSupabaseClient } from '@stepsense/supabase-client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

interface ReportViewProps {
  summary: SessionSummary | null;
  mode?: ViewMode;
  onReportGenerated?: (updatedSummary: SessionSummary) => void;
}

export function ReportView({ summary, mode = 'consumer', onReportGenerated }: ReportViewProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedConsumer, setGeneratedConsumer] = useState<string | null>(null);
  const [generatedDoctor, setGeneratedDoctor] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  if (!summary) {
    return (
      <div className="p-6 rounded-lg bg-card border border-border text-center">
        <p className="text-sm text-ink-secondary">No session summary available.</p>
      </div>
    );
  }

  const consumerText = generatedConsumer || summary.ai_report_consumer;
  const doctorText = generatedDoctor || summary.ai_report_doctor;
  const reportText = mode === 'doctor' ? doctorText : consumerText;

  const handleGenerateReport = async () => {
    if (!summary.session_id || !supabase) return;
    setGenerating(true);
    setGenError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { session_id: summary.session_id },
      });

      if (error) throw error;

      if (data?.ai_report_consumer || data?.ai_report_doctor) {
        setGeneratedConsumer(data.ai_report_consumer);
        setGeneratedDoctor(data.ai_report_doctor);
        if (onReportGenerated) {
          onReportGenerated({
            ...summary,
            ai_report_consumer: data.ai_report_consumer,
            ai_report_doctor: data.ai_report_doctor,
          });
        }
      } else {
        throw new Error('Supabase Edge Function returned empty response');
      }
    } catch (err: any) {
      setGenError(`Edge Function Error: ${err.message || 'Failed to call generate-ai-report'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-none-none space-y-4 text-ink-primary">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h2 className="text-lg font-bold font-sans text-accent-teal">
          {mode === 'doctor'
            ? 'Clinical AI Health Report'
            : mode === 'athlete'
            ? 'Athlete Performance & Fatigue Onset'
            : 'Session Health Summary'}
        </h2>
        <div className="flex items-center space-x-2">
          {mode === 'doctor' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2 py-0.5 text-xs font-semibold border border-border rounded text-ink-secondary hover:bg-border/30"
            >
              Export / Print
            </button>
          )}
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-border/40 text-ink-secondary">
            {mode} mode
          </span>
        </div>
      </div>

      {/* Mode-specific metrics breakdown grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
        <div className="p-3 bg-page rounded border border-border">
          <p className="text-[11px] font-semibold text-ink-secondary">{modeCopy.fatigue[mode]}</p>
          <p className="text-sm font-bold text-ink-primary">
            {mode === 'consumer'
              ? summary.fatigue_bucket ?? 'Normal'
              : mode === 'doctor'
              ? `${summary.fatigue_index ?? 0} (${summary.fatigue_bucket ?? 'Normal'})`
              : `${summary.fatigue_index ?? 0} (Onset: ${summary.created_at ? new Date(summary.created_at).toLocaleTimeString() : 'N/A'})`}
          </p>
        </div>

        <div className="p-3 bg-page rounded border border-border">
          <p className="text-[11px] font-semibold text-ink-secondary">{modeCopy.asymmetry[mode]}</p>
          <p className="text-sm font-bold text-ink-primary">
            {mode === 'consumer'
              ? summary.asymmetry_percent !== null && summary.asymmetry_percent > 15 ? 'Unbalanced' : 'Optimal'
              : `${summary.asymmetry_percent ?? 0}%`}
          </p>
        </div>

        <div className="p-3 bg-page rounded border border-border">
          <p className="text-[11px] font-semibold text-ink-secondary">{modeCopy.cadence[mode]}</p>
          <p className="text-sm font-bold text-ink-primary">{summary.cadence ?? '-'} spm</p>
        </div>

        <div className="p-3 bg-page rounded border border-border">
          <p className="text-[11px] font-semibold text-ink-secondary">{modeCopy.jointStrain[mode]}</p>
          <p className="text-sm font-bold text-ink-primary">
            {mode === 'consumer'
              ? summary.joint_strain_percent !== null && summary.joint_strain_percent > 20 ? 'Elevated' : 'Comfortable'
              : `${summary.joint_strain_percent ?? 0}%`}
          </p>
        </div>
      </div>

      {!reportText ? (
        <div className="py-6 text-center space-y-3 bg-page p-5 rounded border border-border">
          <p className="text-xs text-ink-secondary font-medium">
            Generate AI health report via deployed Supabase Edge Function (<code className="bg-border/30 px-1 py-0.5 rounded">generate-ai-report</code>).
          </p>

          {genError && <p className="text-xs text-status-critical font-semibold">{genError}</p>}

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateReport}
            className="px-5 py-2 bg-accent-teal text-white text-xs font-bold rounded shadow-none hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calling Supabase & Groq AI...</span>
              </span>
            ) : (
              'Generate AI Health Report'
            )}
          </button>
        </div>
      ) : (
        <div className="prose text-xs leading-relaxed whitespace-pre-line text-ink-primary font-sans pt-3 border-t border-border/60">
          {reportText}
        </div>
      )}

      {(summary.baseline_avg_fatigue !== null || summary.baseline_avg_asymmetry !== null) && (
        <div className="pt-3 border-t border-border/60 flex space-x-6 text-xs text-ink-secondary">
          {summary.baseline_avg_fatigue !== null && (
            <div>
              <span className="font-semibold text-ink-primary">Baseline Fatigue:</span> {summary.baseline_avg_fatigue}
            </div>
          )}
          {summary.baseline_avg_asymmetry !== null && (
            <div>
              <span className="font-semibold text-ink-primary">Baseline Asymmetry:</span> {summary.baseline_avg_asymmetry}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
