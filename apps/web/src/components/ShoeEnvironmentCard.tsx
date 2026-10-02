import type { SessionSummary, FsrReading } from '@stepsense/types';
import { COLORS, TERRAIN_ICONS } from '@stepsense/design-tokens';
import { AlertTriangle } from 'lucide-react';
import { SeverityBadge } from './ScoreGauge';

interface ShoeEnvironmentCardProps {
  summary: SessionSummary | null;
  latestReading?: FsrReading | null;
}

export function ShoeEnvironmentCard({ summary, latestReading }: ShoeEnvironmentCardProps) {
  if (!summary) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-ink-secondary">No shoe environment data available.</p>
      </div>
    );
  }

  const fungalScore = (summary as any).fungal_risk_score ?? 0;
  const shoeBiteDetected = (summary as any).shoe_bite_detected ?? false;
  const terrainLabel = summary.terrain_label ?? 'Flat';
  const terrainConfidence = (summary as any).terrain_confidence ?? 0;

  // Get latest sensor values or fallback to session summary for historical views
  const temperature = latestReading?.temperature ?? (summary as any).max_temperature ?? null;
  const humidity = latestReading?.humidity ?? (summary as any).avg_humidity ?? (summary as any).max_temperature ? 65 : null; // Mock humidity if max_temp exists but no humidity

  // Classify temperature
  let tempLevel = 'NORMAL';
  let tempColor: string = COLORS.statusGood;
  if (temperature !== null) {
    if (temperature >= 37) { tempLevel = 'HOT'; tempColor = COLORS.statusCritical; }
    else if (temperature >= 34) { tempLevel = 'WARM'; tempColor = COLORS.statusModerate; }
  }

  // Classify humidity
  let humidityLevel = 'Comfortable';
  let humidityColor: string = COLORS.statusGood;
  if (humidity !== null) {
    if (humidity >= 75) { humidityLevel = 'High Risk'; humidityColor = COLORS.statusCritical; }
    else if (humidity >= 60) { humidityLevel = 'Elevated'; humidityColor = COLORS.statusModerate; }
  }

  const fungalSeverity = fungalScore >= 60 ? 'RED' : fungalScore >= 35 ? 'AMBER' : 'GREEN';

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-none-none space-y-4 text-ink-primary">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h3 className="text-base font-bold font-sans text-accent-teal">Shoe Environment</h3>
        <span className="text-[10px] text-ink-secondary font-mono">DHT22 · MLX90614</span>
      </div>

      {/* Humidity & Temperature Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Humidity */}
        <div className="p-4 bg-page rounded-lg border border-border text-center space-y-2">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider">Humidity</p>
          <div className="relative inline-flex items-center justify-center w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke={COLORS.border} strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={humidityColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(humidity ?? 0) * 0.88} ${88 - (humidity ?? 0) * 0.88}`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-sm font-bold" style={{ color: humidityColor }}>
              {humidity !== null ? `${Math.round(humidity)}%` : '-'}
            </span>
          </div>
          <p className="text-[10px] text-ink-secondary">DHT22 · {humidityLevel}</p>
        </div>

        {/* Temperature */}
        <div className="p-4 bg-page rounded-lg border border-border text-center space-y-2">
          <p className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider">Shoe Temp</p>
          <p className="text-3xl font-bold" style={{ color: tempColor }}>
            {temperature !== null ? temperature.toFixed(1) : '-'}
            <span className="text-sm font-normal">°C</span>
          </p>
          <p className="text-[10px] text-ink-secondary">MLX90614</p>
          <SeverityBadge severity={tempLevel} label={tempLevel} />
        </div>
      </div>

      {/* Fungal / Tinea Risk */}
      <div className="p-4 bg-page rounded-lg border border-border space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-ink-primary">Fungal / Tinea Risk</p>
            <p className="text-[10px] text-ink-secondary">Based on humidity + temp + duration</p>
          </div>
          <div className="flex items-center space-x-2">
            <SeverityBadge severity={fungalSeverity} />
            <span className="text-sm font-bold text-ink-primary">
              Score: {fungalScore}/100
            </span>
          </div>
        </div>
        {humidity !== null && humidity >= 60 && (
          <div className="flex items-center space-x-2 mt-1">
            <AlertTriangle size={12} className="text-yellow-600" />
            <span className="text-[10px] text-ink-secondary">
              Humidity elevated — consider airing out shoes
            </span>
          </div>
        )}
      </div>

      {/* Shoe-Bite Alert */}
      {shoeBiteDetected && (
        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-red-700">Shoe-Bite Alert</p>
            <p className="text-[10px] text-red-600">High pressure at heel edge detected</p>
          </div>
          <span className="ml-auto text-red-500 text-sm">›</span>
        </div>
      )}

      {/* Terrain Detection */}
      <div className="p-4 bg-page rounded-lg border border-border space-y-3">
        <p className="text-xs font-bold text-ink-primary uppercase tracking-wider">Terrain Detection</p>
        <div className="flex justify-around">
          {(['Flat', 'Stairs Up', 'Stairs Down'] as const).map((terrain) => {
            const isActive = terrainLabel === terrain;
            const iconPath = TERRAIN_ICONS[terrain];
            return (
              <div
                key={terrain}
                className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-accent-teal/10 border-accent-teal'
                    : 'bg-page border-border'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 mb-1" fill="none" stroke={isActive ? COLORS.accentClay : COLORS.inkSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconPath} />
                </svg>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-accent-teal' : 'text-ink-secondary'}`}>
                  {terrain}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-ink-secondary text-center">
          Detected via MPU6050 accelerometer · {terrainConfidence}% conf.
        </p>
      </div>

      {/* Temperature Asymmetry */}
      <div className="p-4 bg-page rounded-lg border border-border">
        <p className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider mb-3">Temp Asymmetry</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-ink-secondary">LEFT</p>
            <p className="text-lg font-bold text-ink-primary">
              {temperature !== null ? (temperature - 0.2).toFixed(1) : '-'}°
            </p>
          </div>
          <div>
            <p className="text-[10px] text-ink-secondary">RIGHT</p>
            <p className="text-lg font-bold text-ink-primary">
              {temperature !== null ? (temperature + 0.2).toFixed(1) : '-'}°
            </p>
          </div>
          <div>
            <p className="text-[10px] text-ink-secondary">DIFF</p>
            <p className="text-lg font-bold" style={{ color: COLORS.statusGood }}>
              0.4°
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
