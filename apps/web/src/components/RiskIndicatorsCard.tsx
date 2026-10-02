import type { SessionSummary } from '@stepsense/types';
import { ESTIMATED_INDICATOR_DISCLAIMER } from '@stepsense/design-tokens';

interface RiskIndicatorsCardProps {
  summary: SessionSummary | null;
}

export function RiskIndicatorsCard({ summary }: RiskIndicatorsCardProps) {
  const vascularFlag = summary?.vascular_strain_flag ?? false;
  const terrain = summary?.terrain_label ?? 'Flat/smooth';
  const ulcerZones = summary?.ulcer_risk_zones ? Object.keys(summary.ulcer_risk_zones).filter((k) => summary.ulcer_risk_zones[k]) : [];

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-none-none space-y-4 text-ink-primary">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h3 className="text-sm font-bold font-sans text-accent-teal">Estimated Risk Indicators</h3>
        <span className="text-[10px] italic text-ink-secondary bg-border/30 px-2 py-0.5 rounded">
          {ESTIMATED_INDICATOR_DISCLAIMER}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vascular Strain */}
        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[11px] font-semibold text-ink-secondary">Vascular Strain Flag</p>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                vascularFlag ? 'bg-status-critical' : 'bg-status-good'
              }`}
            />
            <span className="text-xs font-bold">
              {vascularFlag ? 'Elevated Strain (Prolonged Standing)' : 'Normal Shift Variance'}
            </span>
          </div>
        </div>

        {/* Ulcer Risk Zones */}
        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[11px] font-semibold text-ink-secondary">Ulcer Risk Zones</p>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                ulcerZones.length > 0 ? 'bg-status-moderate' : 'bg-status-good'
              }`}
            />
            <span className="text-xs font-bold">
              {ulcerZones.length > 0 ? `Flagged: ${ulcerZones.join(', ')}` : 'No Hotspots Detected'}
            </span>
          </div>
        </div>

        {/* Terrain Classification */}
        <div className="p-3 bg-page rounded border border-border space-y-1">
          <p className="text-[11px] font-semibold text-ink-secondary">Terrain Classification</p>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-status-good" />
            <span className="text-xs font-bold">{terrain}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
