import type { AlertItem } from '@stepsense/types';
import { COLORS } from '@stepsense/design-tokens';

interface AlertsLogProps {
  alerts: AlertItem[];
}

export function AlertsLog({ alerts }: AlertsLogProps) {
  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-card border border-border text-center">
        <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS.statusGood }} />
        <span className="text-xs text-ink-secondary font-medium">All indicators normal — No active alerts</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold font-sans text-ink-primary mb-3">Active Session Alerts</h3>
      {alerts.map((alert, index) => {
        const badgeColor =
          alert.severity === 'critical'
            ? COLORS.statusCritical
            : alert.severity === 'moderate'
            ? COLORS.statusModerate
            : COLORS.statusGood;

        const bgTint =
          alert.severity === 'critical'
            ? 'rgba(184, 92, 77, 0.08)'
            : alert.severity === 'moderate'
            ? 'rgba(224, 177, 94, 0.08)'
            : 'rgba(143, 168, 120, 0.08)';

        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border text-xs"
            style={{ backgroundColor: bgTint, borderColor: `${badgeColor}40` }}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badgeColor }} />
              <span className="font-medium text-ink-primary">{alert.message}</span>
            </div>
            <span
              className="uppercase text-[10px] font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: badgeColor }}
            >
              {alert.severity}
            </span>
          </div>
        );
      })}
    </div>
  );
}
