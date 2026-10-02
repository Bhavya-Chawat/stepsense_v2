import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FsrReading } from '@stepsense/types';
import { useTheme, getTheme } from '../utils/ThemeContext';

interface ZonePressuresCardProps {
  reading: FsrReading | null;
}

export function ZonePressuresCard({ reading }: ZonePressuresCardProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);

  if (!reading) return null;

  const maxPressure = 4095;
  const zones = [
    { key: 's1_big_toe',   label: 'Z1 Big Toe',  color: '#E11D48' },
    { key: 's2_second_toe',label: 'Z2 2nd Toe',  color: '#EA580C' },
    { key: 's3_ball_in',   label: 'Z3 Ball-In',  color: '#D97706' },
    { key: 's4_ball_out',  label: 'Z4 Ball-Out', color: '#CA8A04' },
    { key: 's5_midfoot',   label: 'Z5 Arch',     color: '#2BBBD7' },
    { key: 's6_heel',      label: 'Z6 Heel',     color: '#22C55E' },
  ];

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[s.title, { color: t.ink.secondary }]}>ZONE PRESSURES</Text>
      
      {zones.map((zone) => {
        const rawVal = reading[zone.key as keyof FsrReading] as number ?? 0;
        const pct = Math.max(0, Math.min(100, Math.round((rawVal / maxPressure) * 100)));
        // roughly 4095 corresponds to ~400g according to some mockups. Let's map it roughly.
        const grams = Math.round((rawVal / maxPressure) * 400);

        return (
          <View key={zone.key} style={s.zoneRow}>
            <View style={s.labelRow}>
              <Text style={[s.zoneName, { color: t.ink.primary }]}>{zone.label}</Text>
              <Text style={[s.zoneValues, { color: zone.color }]}>
                {pct}% <Text style={[s.gramsText, { color: t.ink.secondary }]}>· {grams}g</Text>
              </Text>
            </View>
            <View style={[s.barBg, { backgroundColor: t.cardSubtle }]}>
              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: zone.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    
    elevation: 3,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  zoneRow: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  zoneName: {
    fontSize: 12,
    fontWeight: '700',
  },
  zoneValues: {
    fontSize: 12,
    fontWeight: '700',
  },
  gramsText: {
    fontSize: 11,
    fontWeight: '500',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
