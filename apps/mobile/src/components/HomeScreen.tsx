import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SHADOWS } from '../utils/theme';
import { useTheme, getTheme } from '../utils/ThemeContext';
import type { SessionSummary } from '@stepsense/types';
import { Activity, Footprints, Thermometer, Droplets, Zap } from 'lucide-react-native';

interface HomeScreenProps {
  summary: SessionSummary | null;
  isWalkActive: boolean;
  onStartWalk: () => void;
  onEndWalk: () => void;
  status: string;
}

export function HomeScreen({ summary, isWalkActive, onStartWalk, onEndWalk, status }: HomeScreenProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);
  const steps = (summary as any)?.step_count ?? '-';
  const gaitScore = summary?.gait_score ?? 0;
  const cadence = summary?.cadence ?? 0;
  const dominantZone = summary?.joint_strain_zone ?? 'N/A';
  const asymmetry = summary ? Math.abs((summary.step_time || 0) - (summary.stride_length || 0) * 0.1).toFixed(1) + '%' : '-';
  
  return (
    <View style={[styles.container, { backgroundColor: t.page }]}>
      <View style={styles.header}>
        <View style={styles.liveIndicatorRow}>
          <View style={[styles.liveDot, { backgroundColor: isWalkActive ? t.liveGreen : t.ink.tertiary }]} />
          <Text style={[styles.liveText, { color: isWalkActive ? t.liveGreen : t.ink.tertiary }]}>
            {isWalkActive ? 'LIVE SESSION' : 'OFFLINE'}
          </Text>
        </View>
        <Text style={[styles.sessionText, { color: t.ink.secondary }]}>
          Session {summary?.session_id?.substring(0,6) || '#0000'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <MetricCard label="STEPS TODAY"     t={t}><Text style={[styles.value, { color: t.ink.primary }]}>{steps}</Text></MetricCard>
          <MetricCard label="GAIT SCORE"      t={t}>
            <Text style={[styles.value, { color: t.status.good }]}>{gaitScore}<Text style={[styles.valueSub, { color: t.ink.secondary }]}>/100</Text></Text>
            <Dot color={t.status.good} label="Good" t={t} />
          </MetricCard>
          <MetricCard label="CADENCE"         t={t}>
            <Text style={[styles.value, { color: t.ink.primary }]}>{cadence}<Text style={[styles.valueSub, { color: t.ink.secondary }]}>spm</Text></Text>
            <Text style={[styles.subtext, { color: t.ink.secondary }]}>Normal range</Text>
          </MetricCard>
          <MetricCard label="COHORT"          t={t}>
            <Text style={[styles.value, { color: t.accent.tealLight }]}>Adult</Text>
            <Dot color={t.ink.tertiary} label="Normal gait" t={t} />
          </MetricCard>
          <MetricCard label="DOMINANT ZONE"   t={t}>
            <Text style={[styles.valueText, { color: t.ink.primary }]}>{dominantZone}</Text>
            <Text style={[styles.subtext, { color: t.ink.secondary }]}>Left foot · Z3</Text>
          </MetricCard>
          <MetricCard label="L/R ASYMMETRY"   t={t}>
            <Text style={[styles.value, { color: t.status.moderate }]}>{asymmetry}</Text>
            <Dot color={t.status.moderate} label="Mid" t={t} />
          </MetricCard>
        </View>
        <Text style={[styles.statusConsole, { color: t.ink.tertiary }]}>{status}</Text>
      </ScrollView>

      <View style={[styles.actionContainer, { backgroundColor: t.page }]}>
        {isWalkActive ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: t.status.critical }]} onPress={onEndWalk}>
            <Text style={styles.btnText}>STOP SESSION</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, { backgroundColor: t.accent.teal }]} onPress={onStartWalk}>
            <Text style={styles.btnText}>START SESSION</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MetricCard({ label, children, t }: { label: string; children: React.ReactNode; t: any }) {
  return (
    <View style={[s2.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[s2.label, { color: t.ink.tertiary }]}>{label}</Text>
      {children}
    </View>
  );
}

function Dot({ color, label, t }: { color: string; label: string; t: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 10, color: t.ink.secondary, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  liveText:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  sessionText:  { fontSize: 11, fontFamily: 'monospace' },
  scrollContent:{ paddingBottom: 110 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  value:        { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  valueText:    { fontSize: 18, fontWeight: '700' },
  valueSub:     { fontSize: 13, fontWeight: '400' },
  subtext:      { fontSize: 10, marginTop: 4 },
  statusConsole:{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginTop: 16, paddingHorizontal: 20, opacity: 0.7 },
  actionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 12 },
  btn:    { paddingVertical: 17, borderRadius: 14, alignItems: 'center',  elevation: 5 },
  btnText:{ color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.8 },
  liveDot:      { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot:    { width: 5, height: 5, borderRadius: 3 },
  statusGood:   { fontSize: 10, fontWeight: '600' },
  statusModerate:{ fontSize: 10, fontWeight: '600' },
});

const s2 = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    
    elevation: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
