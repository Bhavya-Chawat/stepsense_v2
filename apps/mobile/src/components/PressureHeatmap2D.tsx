import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { COLORS } from '../utils/theme';
import type { FsrReading } from '@stepsense/types';

interface PressureHeatmap2DProps {
  reading?: FsrReading | null;
  width?: number;
  height?: number;
  footSide?: 'left' | 'right';
  showLabels?: boolean;
  showGradientBar?: boolean;
  refreshRate?: string;
}

// Map 0-4095 to a heat color (Blue -> Teal -> Yellow -> Red)
function getHeatColor(val: number): string {
  if (val <= 0) return 'transparent';
  const pct = val / 4095;
  if (pct < 0.25) return '#2BBBD7'; // Light Teal
  if (pct < 0.5) return '#218DAE'; // Primary Teal
  if (pct < 0.75) return '#FFD758'; // Yellow
  return '#E11D48'; // Red
}

export function PressureHeatmap2D({
  reading,
  width = 140,
  height = 260,
  footSide = 'right',
  refreshRate,
}: PressureHeatmap2DProps) {
  const isLeft = footSide === 'left';
  const maxVal = 4095;

  // Normalized foot path (0 to 1 domain)
  // Approximates the geometry used in the web's Plotly version
  const footOutlinePath = `
    M 0.5 0.95
    C 0.7 0.95 0.75 0.8 0.75 0.6
    C 0.75 0.45 0.85 0.35 0.85 0.2
    C 0.85 0.05 0.65 0 0.5 0
    C 0.35 0 0.15 0.05 0.15 0.2
    C 0.15 0.35 0.25 0.45 0.25 0.6
    C 0.25 0.8 0.3 0.95 0.5 0.95 Z
  `;

  const zones = [
    { key: 's1_big_toe', nx: 0.475, ny: 0.09 },
    { key: 's2_second_toe', nx: 0.575, ny: 0.13 },
    { key: 's3_ball_in', nx: 0.38, ny: 0.28 },
    { key: 's4_ball_out', nx: 0.62, ny: 0.28 },
    { key: 's5_midfoot', nx: 0.50, ny: 0.51 },
    { key: 's6_heel', nx: 0.50, ny: 0.85 },
  ];

  return (
    <View style={styles.container}>
      {refreshRate && (
        <View style={styles.liveIndicatorRow}>
          <View style={styles.liveDot} />
          <Text style={styles.refreshText}>LIVE SENSOR {refreshRate}</Text>
        </View>
      )}

      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {zones.map((z, idx) => (
            <RadialGradient key={`grad-${idx}`} id={`grad-${idx}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={getHeatColor(reading ? (reading[z.key as keyof FsrReading] as number) ?? 0 : 0)} stopOpacity="0.9" />
              <Stop offset="40%" stopColor={getHeatColor(reading ? (reading[z.key as keyof FsrReading] as number) ?? 0 : 0)} stopOpacity="0.5" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>

        <G transform={isLeft ? `scale(-1, 1) translate(${-width}, 0)` : undefined}>
          {/* Base foot outline scaled to actual dimensions */}
          <Path
            d={footOutlinePath}
            transform={`scale(${width}, ${height})`}
            fill="#F8FAFC"
            stroke={COLORS.ink.primary}
            strokeWidth={2 / width} // Counteract scaling
          />

          {/* Glowing zones over the outline */}
          {zones.map((zone, idx) => {
            const rawVal = reading ? (reading[zone.key as keyof FsrReading] as number) ?? 0 : 0;
            if (rawVal <= 0) return null;
            
            const cx = zone.nx * width;
            const cy = zone.ny * height;
            
            // Adjust radius intensity based on pressure
            const radiusX = (width * 0.4) * (0.5 + (rawVal / maxVal) * 0.5);
            const radiusY = (height * 0.25) * (0.5 + (rawVal / maxVal) * 0.5);

            return (
              <Ellipse
                key={zone.key}
                cx={cx}
                cy={cy}
                rx={radiusX}
                ry={radiusY}
                fill={`url(#grad-${idx})`}
              />
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
    fontWeight: '700',
    color: COLORS.ink.secondary,
    letterSpacing: 1,
    marginTop: 8,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.status.good,
    marginRight: 6,
  },
  refreshText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.ink.secondary,
    letterSpacing: 1,
  },
});
