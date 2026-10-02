import { LIGHT } from '@stepsense/design-tokens';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  severity?: string;
  suffix?: string;
}

function getArcColor(score: number, severity?: string, dark = false): string {
  const palette = dark ? {
    good: '#4ABFA0', moderate: '#D4AE5A', critical: '#C96060',
  } : {
    good: '#3A9E7E', moderate: '#C49A3A', critical: '#B85252',
  };

  if (severity) {
    const s = severity.toLowerCase();
    if (s.includes('high') || s.includes('severe') || s.includes('critical')) return palette.critical;
    if (s.includes('moderate') || s.includes('medium')) return palette.moderate;
    return palette.good;
  }
  if (score >= 65) return palette.good;
  if (score >= 35) return palette.moderate;
  return palette.critical;
}

export function ScoreGauge({
  score,
  label,
  size = 80,
  severity,
  suffix = '/ 100',
}: ScoreGaugeProps) {
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const arcColor = getArcColor(clamped, severity);

  // Subtle track color — matches card background slightly tinted
  const trackColor = 'rgba(0,0,0,0.06)';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" aria-hidden>
          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={trackColor} strokeWidth={strokeWidth}
          />
          {/* Arc */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={arcColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none tabular-nums" style={{ color: arcColor }}>
            {clamped}
          </span>
          <span className="text-[9px] text-ink-secondary font-medium leading-tight mt-0.5">{suffix}</span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider text-center leading-tight max-w-[80px]">
          {label}
        </span>
      )}
    </div>
  );
}

interface SeverityBadgeProps {
  severity: string;
  label?: string;
}

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const s = severity?.toLowerCase() ?? '';
  let colorStyle: React.CSSProperties;

  if (s.includes('high') || s.includes('severe') || s.includes('critical')) {
    colorStyle = { color: '#B85252', backgroundColor: '#FBEAEA' };
  } else if (s.includes('moderate') || s.includes('medium')) {
    colorStyle = { color: '#C49A3A', backgroundColor: '#FBF4E5' };
  } else {
    colorStyle = { color: '#3A9E7E', backgroundColor: '#EBF7F3' };
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={colorStyle}
    >
      {label ?? severity}
    </span>
  );
}
