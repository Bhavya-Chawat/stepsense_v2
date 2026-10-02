import { FOOT_GEOMETRY, getPressureColor, COLORS } from '@stepsense/design-tokens';
import type { FsrReading } from '@stepsense/types';

interface FootHeatmapProps {
  reading?: FsrReading | null;
  width?: number;
  height?: number;
  footSide?: 'left' | 'right';
}

export function FootHeatmap({
  reading,
  width = 180,
  height = 340,
  footSide = 'right',
}: FootHeatmapProps) {
  const { viewBox, outlinePath, zones } = FOOT_GEOMETRY;
  const isLeft = footSide === 'left';

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className="transition-all duration-300 drop-shadow-none-none"
      >
        <g transform={isLeft ? 'scale(-1, 1) translate(-200, 0)' : undefined}>
          {/* Clean Insole Outline */}
          <path
            d={outlinePath}
            fill="#FFFDF9"
            stroke={COLORS.border}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sensor Zones */}
          {zones.map((zone) => {
            const rawVal = reading ? (reading[zone.key as keyof FsrReading] as number) ?? 0 : 0;
            const fillColor = getPressureColor(rawVal);

            return (
              <g key={zone.key}>
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={fillColor}
                  fillOpacity="0.85"
                  stroke={COLORS.border}
                  strokeWidth="0.75"
                  className="transition-colors duration-200"
                />
                {rawVal > 0 && (
                  <text
                    x={isLeft ? -zone.cx : zone.cx}
                    y={zone.cy + 3}
                    transform={isLeft ? 'scale(-1, 1)' : undefined}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill={COLORS.inkPrimary}
                    className="pointer-events-none"
                  >
                    {rawVal}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <span className="text-[11px] font-semibold text-ink-secondary mt-1 capitalize">
        {footSide} Foot
      </span>
    </div>
  );
}
