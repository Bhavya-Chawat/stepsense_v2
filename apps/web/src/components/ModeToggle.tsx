import type { ViewMode } from '@stepsense/design-tokens';

interface ModeToggleProps {
  mode: ViewMode;
  onChangeMode: (newMode: ViewMode) => void;
}

export function ModeToggle({ mode, onChangeMode }: ModeToggleProps) {
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'consumer', label: 'Consumer' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'athlete', label: 'Athlete' },
  ];

  return (
    <div className="inline-flex bg-border/30 p-1 rounded-lg border border-border">
      {modes.map((m) => {
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChangeMode(m.key)}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              active
                ? 'bg-accent-teal text-white shadow-none-none'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
