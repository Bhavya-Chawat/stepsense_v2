import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, G, Path, Text as SvgText } from 'react-native-svg';
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
  width = 160,
  height = 300,
  footSide = 'right',
}: FootHeatmapProps) {
  const { viewBox, outlinePath, zones } = FOOT_GEOMETRY;
  const isLeft = footSide === 'left';

  return (
    <View style={styles.container}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      >
        <G transform={isLeft ? 'scale(-1, 1) translate(-200, 0)' : undefined}>
          {/* Foot Silhouette Path */}
          <Path
            d={outlinePath}
            fill="#FFFDF9"
            stroke={COLORS.border}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sensor Zones with Pressure Fills */}
          {zones.map((zone) => {
            const rawVal = reading ? (reading[zone.key as keyof FsrReading] as number) ?? 0 : 0;
            const fillColor = getPressureColor(rawVal);

            return (
              <G key={zone.key}>
                <Ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={fillColor}
                  fillOpacity={0.85}
                  stroke={COLORS.border}
                  strokeWidth={0.75}
                />
                {rawVal > 0 && (
                  <G transform={isLeft ? `scale(-1, 1) translate(${-2 * zone.cx}, 0)` : undefined}>
                    <SvgText
                      x={zone.cx}
                      y={zone.cy + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill={COLORS.inkPrimary}
                    >
                      {rawVal}
                    </SvgText>
                  </G>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
      <Text style={styles.label}>{footSide.toUpperCase()} FOOT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B6558',
    marginTop: 4,
  },
});
