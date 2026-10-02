import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { SessionSummary } from '@stepsense/types';
import { Activity, Footprints, Flame } from 'lucide-react-native';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { COLORS } from '../utils/theme';

interface DiabeticMetricsCardProps {
  summary: SessionSummary | null;
}

export function DiabeticMetricsCard({ summary }: DiabeticMetricsCardProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);

  if (!summary) {
    return (
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.emptyText, { color: t.ink.secondary }]}>No diabetic metrics available for this session.</Text>
      </View>
    );
  }

  // Typecasting to access extended properties
  const s = summary as any;

  const ptiZones = s.pti_zones || {};
  const peakZones = s.peak_pressure_zones || {};

  const ptiData = [
    { name: 'S1 (Big Toe)', pti: ptiZones.s1_big_toe || 0, peak: peakZones.s1_big_toe || 0 },
    { name: 'S2 (2nd Toe)', pti: ptiZones.s2_second_toe || 0, peak: peakZones.s2_second_toe || 0 },
    { name: 'S3 (Ball-In)', pti: ptiZones.s3_ball_in || 0, peak: peakZones.s3_ball_in || 0 },
    { name: 'S4 (Ball-Out)', pti: ptiZones.s4_ball_out || 0, peak: peakZones.s4_ball_out || 0 },
    { name: 'S5 (Midfoot)', pti: ptiZones.s5_midfoot || 0, peak: peakZones.s5_midfoot || 0 },
    { name: 'S6 (Heel)', pti: ptiZones.s6_heel || 0, peak: peakZones.s6_heel || 0 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Row */}
      <View style={styles.overviewContainer}>
        <View style={[styles.overviewCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.iconRow}>
            <Footprints size={14} color={t.ink.secondary} />
            <Text style={[styles.overviewLabel, { color: t.ink.secondary }]}>COP PROGRESSION</Text>
          </View>
          <Text style={[styles.overviewValue, { color: t.ink.primary }]}>{s.cop_progression || 'Normal'}</Text>
          <Text style={[styles.overviewSub, { color: t.ink.tertiary }]}>Center of Pressure pattern</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.iconRow}>
            <Activity size={14} color={t.ink.secondary} />
            <Text style={[styles.overviewLabel, { color: t.ink.secondary }]}>GAIT VARIABILITY</Text>
          </View>
          <Text style={[styles.overviewValue, { color: t.ink.primary }]}>{s.gait_variability ? `${s.gait_variability} s` : '-'}</Text>
          <Text style={[styles.overviewSub, { color: t.ink.tertiary }]}>Stride time dev.</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.iconRow}>
            <Flame size={14} color={t.ink.secondary} />
            <Text style={[styles.overviewLabel, { color: t.ink.secondary }]}>MAX ENVIRONMENT</Text>
          </View>
          <Text style={[styles.overviewValue, { color: t.ink.primary }]}>{s.max_temperature ? `${s.max_temperature}°C` : '-'}</Text>
          <Text style={[styles.overviewSub, { color: t.ink.tertiary }]}>High Hum: {s.high_humidity_time_sec ?? '-'}s</Text>
        </View>
      </View>

      {/* PTI Breakdown */}
      <View style={[styles.sectionCard, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.sectionTitle, { color: t.ink.primary }]}>Pressure-Time Integral (PTI)</Text>
        <Text style={[styles.sectionDesc, { color: t.ink.secondary }]}>
          PTI combines the magnitude and duration of pressure applied to the tissue. High PTI values strongly correlate with ulceration risk.
        </Text>
        
        <View style={styles.ptiGrid}>
          {ptiData.map(zone => (
            <View key={zone.name} style={[styles.ptiBox, { backgroundColor: t.page, borderColor: t.border }]}>
              <Text style={[styles.ptiZoneName, { color: t.ink.primary }]}>{zone.name}</Text>
              
              <View style={styles.ptiRow}>
                <Text style={[styles.ptiLabel, { color: t.ink.secondary }]}>PTI</Text>
                <Text style={[styles.ptiValue, { color: t.accent.teal }]}>{zone.pti}</Text>
              </View>
              
              <View style={styles.ptiRow}>
                <Text style={[styles.peakLabel, { color: t.ink.tertiary }]}>Peak</Text>
                <Text style={[styles.peakValue, { color: t.ink.secondary }]}>{zone.peak}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* IMU Detailed */}
      <View style={[styles.sectionCard, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.sectionTitle, { color: t.ink.primary }]}>IMU Kinematics & Stability</Text>
        
        <View style={styles.imuGrid}>
          <View style={styles.imuBox}>
            <Text style={[styles.imuLabel, { color: t.ink.secondary }]}>Peak Accel.</Text>
            <Text style={[styles.imuValue, { color: t.ink.primary }]}>{s.peak_acceleration ?? '-'} g</Text>
          </View>
          <View style={styles.imuBox}>
            <Text style={[styles.imuLabel, { color: t.ink.secondary }]}>Acc. Variability</Text>
            <Text style={[styles.imuValue, { color: t.ink.primary }]}>{s.acceleration_variability ?? '-'}</Text>
          </View>
          <View style={styles.imuBox}>
            <Text style={[styles.imuLabel, { color: t.ink.secondary }]}>Peak Ang. Vel.</Text>
            <Text style={[styles.imuValue, { color: t.ink.primary }]}>{s.peak_angular_velocity ?? '-'} °/s</Text>
          </View>
          <View style={styles.imuBox}>
            <Text style={[styles.imuLabel, { color: t.ink.secondary }]}>Swing/Stance Ratio</Text>
            <Text style={[styles.imuValue, { color: t.ink.primary }]}>
              {s.swing_time && s.stance_time ? (s.swing_time / s.stance_time).toFixed(2) : '-'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.ink.secondary,
    textAlign: 'center',
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
    
    elevation: 2,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.ink.secondary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.ink.primary,
  },
  overviewSub: {
    fontSize: 9,
    color: COLORS.ink.tertiary,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ink.primary,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 11,
    color: COLORS.ink.secondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  ptiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ptiBox: {
    width: '48%',
    backgroundColor: COLORS.page,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
  },
  ptiZoneName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.ink.primary,
    marginBottom: 8,
  },
  ptiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  ptiLabel: {
    fontSize: 11,
    color: COLORS.ink.secondary,
  },
  ptiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent.teal,
  },
  peakLabel: {
    fontSize: 9,
    color: COLORS.ink.tertiary,
  },
  peakValue: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.ink.secondary,
  },
  imuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imuBox: {
    width: '48%',
    marginBottom: 16,
  },
  imuLabel: {
    fontSize: 10,
    color: COLORS.ink.secondary,
    marginBottom: 4,
  },
  imuValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ink.primary,
  },
});
