import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionSummary } from '@stepsense/types';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { ScoreGauge, SeverityBadge, FatigueGauge } from './ScoreGauge';
import { Activity } from 'lucide-react-native';

interface GaitAnalysisCardProps {
  summary: SessionSummary | null;
  currentPhase?: string;
}

export function GaitAnalysisCard({ summary, currentPhase }: GaitAnalysisCardProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);

  if (!summary) {
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[s.emptyText, { color: t.ink.secondary }]}>No gait data available.</Text>
      </View>
    );
  }

  const gaitScore          = (summary as any).gait_score ?? 0;
  const gaitType           = (summary as any).gait_type ?? 'Normal';
  const stepTime           = (summary as any).step_time ?? null;
  const strideLength       = (summary as any).stride_length ?? null;
  const doubleSupportPct   = (summary as any).double_support_percent ?? null;
  const isNormal           = gaitType === 'Normal';

  const phases = ['STANCE', 'SWING', 'HEEL', 'TOE'];

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <View style={[s.iconWrap, { backgroundColor: t.accent.tealMuted }]}>
          <Activity color={t.accent.teal} size={16} />
        </View>
        <Text style={[s.title, { color: t.ink.primary }]}>Biomechanical Metrics</Text>
      </View>

      {/* Phase indicator */}
      {currentPhase && (
        <View style={[s.phaseContainer, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
          <Text style={[s.phaseLabel, { color: t.ink.tertiary }]}>CURRENT STATE</Text>
          <View style={[
            s.phaseBubble,
            { borderColor: currentPhase === 'SWING' ? t.accent.teal : t.status.good,
              backgroundColor: (currentPhase === 'SWING' ? t.accent.teal : t.status.good) + '18' }
          ]}>
            <Text style={[s.phaseText, { color: currentPhase === 'SWING' ? t.accent.teal : t.status.good }]}>
              {currentPhase}
            </Text>
          </View>
          <View style={s.phaseTags}>
            {phases.map(ph => (
              <View key={ph} style={[
                s.phaseTag,
                ph === currentPhase
                  ? { backgroundColor: t.accent.teal }
                  : { backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }
              ]}>
                <Text style={[s.phaseTagText, { color: ph === currentPhase ? '#FFF' : t.ink.secondary }]}>{ph}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 2×2 grid */}
      <View style={s.grid}>
        <GridBox t={t}>
          <ScoreGauge score={gaitScore} label="Gait Score" size={64} dark={dark} />
        </GridBox>
        <GridBox t={t}>
          <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>CADENCE</Text>
          <Text style={[s.boxValue, { color: t.ink.primary }]}>{summary.cadence ?? '—'}<Text style={[s.boxUnit, { color: t.ink.secondary }]}>spm</Text></Text>
          <Text style={[s.boxSub, { color: t.ink.secondary }]}>± Normal range</Text>
        </GridBox>
        <GridBox t={t}>
          <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>GAIT TYPE</Text>
          <Text style={[s.boxValue, { color: isNormal ? t.status.good : t.status.moderate, fontSize: 16 }]}>{gaitType}</Text>
          <Text style={[s.boxSub, { color: t.ink.secondary }]}>{isNormal ? 'Symmetric stride' : 'Irregular pattern'}</Text>
        </GridBox>
        <GridBox t={t}>
          <Text style={[s.boxLabel, { color: t.ink.tertiary }]}>FATIGUE</Text>
          <View style={{ marginVertical: 8 }}>
            <FatigueGauge score={summary.fatigue_index ?? 0} dark={dark} />
          </View>
        </GridBox>
      </View>

      {/* Bottom metrics row */}
      <View style={s.metricsRow}>
        <MiniBox label="STRIDE LENGTH" value={strideLength ?? '—'} unit="m" t={t} />
        <MiniBox label="STEP TIME"     value={stepTime     ?? '—'} unit="s" t={t} />
        <MiniBox label="DOUBLE SUP."   value={doubleSupportPct ?? '—'} unit="%" t={t} />
      </View>
    </View>
  );
}

function GridBox({ children, t }: { children: React.ReactNode; t: ReturnType<typeof getTheme> }) {
  return (
    <View style={[gb.box, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
      {children}
    </View>
  );
}

function MiniBox({ label, value, unit, t }: {
  label: string; value: string | number; unit: string; t: ReturnType<typeof getTheme>;
}) {
  return (
    <View style={[mb.box, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
      <Text style={[mb.label, { color: t.ink.tertiary }]}>{label}</Text>
      <Text style={[mb.value, { color: t.ink.primary }]}>
        {value}<Text style={[mb.unit, { color: t.ink.secondary }]}>{unit}</Text>
      </Text>
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
  emptyText: { fontSize: 14, textAlign: 'center', padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    marginBottom: 14,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  phaseContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  phaseLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  phaseBubble: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  phaseText: { fontSize: 17, fontWeight: '700', letterSpacing: 1 },
  phaseTags: { flexDirection: 'row', gap: 6 },
  phaseTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  phaseTagText: { fontSize: 9, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  boxLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7, marginBottom: 5 },
  boxValue: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  boxUnit: { fontSize: 10, fontWeight: '400' },
  boxSub: { fontSize: 9, marginTop: 3 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
});

const gb = StyleSheet.create({
  box: {
    width: '48%',
    borderRadius: 11,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
});

const mb = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  label: { fontSize: 8, fontWeight: '700', letterSpacing: 0.6, marginBottom: 5 },
  value: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  unit: { fontSize: 9, fontWeight: '400' },
});
