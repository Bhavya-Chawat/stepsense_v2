import { COLORS } from '@stepsense/design-tokens';
import { getConnectionState, type ConnectionState } from '@stepsense/core';

interface ConnectionBadgeProps {
  lastRowTimestamp: string | null;
}

const badgeConfig: Record<ConnectionState, { label: string; color: string; bgColor: string; pulse: boolean }> = {
  LIVE: { label: 'LIVE', color: COLORS.liveGreen, bgColor: `${COLORS.liveGreen}20`, pulse: true },
  STALE: { label: 'STALE', color: COLORS.staleYellow, bgColor: `${COLORS.staleYellow}20`, pulse: false },
  DEMO: { label: 'DEMO', color: COLORS.demoOrange, bgColor: `${COLORS.demoOrange}20`, pulse: false },
};

export function ConnectionBadge({ lastRowTimestamp }: ConnectionBadgeProps) {
  const state = getConnectionState(lastRowTimestamp);
  const config = badgeConfig[state];

  return (
    <span
      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: config.bgColor,
        borderColor: `${config.color}40`,
        color: config.color,
      }}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      <span>{config.label}</span>
    </span>
  );
}
