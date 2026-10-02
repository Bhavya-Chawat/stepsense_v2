import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionSummary, FsrReading } from '@stepsense/types';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { SeverityBadge } from './ScoreGauge';
import { TERRAIN_ICONS } from '@stepsense/design-tokens';
import Svg, { Path } from 'react-native-svg';

interface ShoeEnvironmentCardProps {
  summary: SessionSummary | null;
  latestReading?: FsrReading | null;
}

export function ShoeEnvironmentCard({ summary, latestReading }: ShoeEnvironmentCardProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);

  if (!summary) {
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[s.emptyText, { color: t.ink.secondary }]}>No shoe environment data.</Text>
      </View>
    );
  }

  const fungalScore       = (summary as any).fungal_risk_score ?? 0;
  const shoeBiteDetected  = (summary as any).shoe_bite_detected ?? false;
  const terrainLabel      = summary.terrain_label ?? 'Flat';
  const terrainConfidence = (summary as any).terrain_confidence ?? 0;
  const temperature       = latestReading?.temperature ?? null;
  const humidity          = latestReading?.humidity ?? null;

  let tempLevel = 'NORMAL'; let tempColor = t.status.good;
  if (temperature !== null) {
    if (temperature >= 37)      { tempLevel = 'HOT';  tempColor = t.status.critical; }
    else if (temperature >= 34) { tempLevel = 'WARM'; tempColor = t.status.moderate; }
  }

  let humidityLevel = 'Comfortable'; let humidityColor = t.status.good;
  if (humidity !== null) {
    if (humidity >= 75)      { humidityLevel = 'High Risk'; humidityColor = t.status.critical; }
    else if (humidity >= 60) { humidityLevel = 'Elevated';  humidityColor = t.status.moderate; }
  }

  const fungalSev = fungalScore >= 60 ? 'RED' : fungalScore >= 35 ? 'AMBER' : 'GREEN';
  const terrains = ['Flat', 'Stairs Up', 'Stairs Down'] as const;

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <Text style={[s.title, { color: t.ink.primary }]}>Shoe Environment</Text>
        <Text style={[s.source, { color: t.ink.tertiary }]}>DHT22 · MLX90614</Text>
      </View>

      {/* Sensor row */}
      <View style={s.row}>
        <View style={[s.sensorBox, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
          <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>HUMIDITY</Text>
          <Text style={[s.boxValue, { color: humidityColor }]}>
            {humidity !== null ? `${Math.round(humidity)}%` : '—'}
          </Text>
          <Text style={[s.boxSub, { color: t.ink.secondary }]}>{humidityLevel}</Text>
        </View>
        <View style={[s.sensorBox, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
          <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>SHOE TEMP</Text>
          <Text style={[s.boxValue, { color: tempColor }]}>
            {temperature !== null ? `${temperature.toFixed(1)}°C` : '—'}
          </Text>
          <SeverityBadge severity={tempLevel} label={tempLevel} dark={dark} />
        </View>
      </View>

      {/* Fungal risk */}
      <View style={[s.fungalBox, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.boxTitle, { color: t.ink.primary }]}>Fungal / Tinea Risk</Text>
          <Text style={[s.boxSub, { color: t.ink.secondary }]}>Humidity + temp + duration</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <SeverityBadge severity={fungalSev} dark={dark} />
          <Text style={[s.fungalScore, { color: t.ink.primary }]}>Score: {fungalScore}/100</Text>
        </View>
      </View>

      {/* Shoe-bite alert */}
      {shoeBiteDetected && (
        <View style={[s.alertBox, { backgroundColor: t.status.criticalBg, borderColor: t.status.critical + '44' }]}>
          <View style={[s.alertDot, { backgroundColor: t.status.critical }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.alertTitle, { color: t.status.critical }]}>Shoe-Bite Alert</Text>
            <Text style={[s.alertSub, { color: t.ink.secondary }]}>High pressure at heel edge detected</Text>
          </View>
        </View>
      )}

      {/* Terrain */}
      <View style={[s.terrainBox, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
        <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>TERRAIN DETECTION</Text>
        <View style={s.terrainRow}>
          {terrains.map(terrain => {
            const isActive = terrainLabel === terrain;
            const iconPath = (TERRAIN_ICONS as any)[terrain];
            return (
              <View
                key={terrain}
                style={[
                  s.terrainItem,
                  {
                    borderColor: isActive ? t.accent.teal : t.border,
                    backgroundColor: isActive ? t.accent.tealMuted : t.card,
                  },
                ]}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path
                    d={iconPath}
                    stroke={isActive ? t.accent.teal : t.ink.tertiary}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[s.terrainText, { color: isActive ? t.accent.teal : t.ink.secondary }]}>
                  {terrain}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[s.terrainConf, { color: t.ink.tertiary }]}>
          MPU6050 accelerometer · {terrainConfidence}% conf.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    
    elevation: 3,
  },
  emptyText: { fontSize: 13, textAlign: 'center', padding: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    marginBottom: 14,
  },
  title:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  source: { fontSize: 10, fontFamily: 'monospace' },
  row:    { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  sensorBox: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  boxLabel:    { fontSize: 9,  fontWeight: '700', letterSpacing: 0.7, marginBottom: 4 },
  boxValue:    { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  boxSub:      { fontSize: 10 },
  boxTitle:    { fontSize: 13, fontWeight: '600' },
  fungalBox: {
    flexDirection: 'row',
    borderRadius: 11,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  fungalScore: { fontSize: 10, fontWeight: '600' },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 11,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  alertDot:  { width: 9, height: 9, borderRadius: 5 },
  alertTitle:{ fontSize: 12, fontWeight: '700' },
  alertSub:  { fontSize: 10, marginTop: 2 },
  terrainBox: {
    borderRadius: 11,
    borderWidth: 1,
    padding: 12,
  },
  terrainRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  terrainItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 80,
  },
  terrainText: { fontSize: 9, fontWeight: '600', marginTop: 5 },
  terrainConf: { fontSize: 9, textAlign: 'center' },
});
