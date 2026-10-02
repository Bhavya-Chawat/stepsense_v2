import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SessionSummary } from '@stepsense/types';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { ScoreGauge, SeverityBadge } from './ScoreGauge';
import { HeartPulse, User } from 'lucide-react-native';

interface HealthRisksCardProps {
  summary: SessionSummary | null;
  cohort?: string;
}

export function HealthRisksCard({ summary, cohort = 'adult' }: HealthRisksCardProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);

  if (!summary) {
    return (
      <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[s.emptyText, { color: t.ink.secondary }]}>No health risk data available.</Text>
      </View>
    );
  }

  const fallRiskScore    = (summary as any).fall_risk_score ?? 0;
  const tremorFlag       = (summary as any).tremor_flag ?? false;
  const vascularScore    = (summary as any).vascular_risk_score ?? 0;
  const jointStrainScore = (summary as any).joint_strain_score ?? 0;
  const jointStrainSev   = (summary as any).joint_strain_severity ?? 'LOW';
  const jointStrainZone  = (summary as any).joint_strain_zone ?? '-';
  const ulcerScore       = (summary as any).ulcer_risk_score ?? 0;
  const cadence          = summary.cadence ?? 100;

  const slowCadenceScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(cadence, 130) / 130) * 100)));

  const cohortColor =
    cohort === 'elderly' ? t.status.moderate :
    cohort === 'athlete' ? t.accent.teal :
    t.status.good;

  function getSeverityStr(score: number, thresholds: [number, number] = [30, 60]): string {
    if (score >= thresholds[1]) return 'HIGH';
    if (score >= thresholds[0]) return 'MODERATE';
    return 'LOW';
  }

  function getScoreColor(score: number): string {
    if (score >= 60) return t.status.critical;
    if (score >= 30) return t.status.moderate;
    return t.status.good;
  }

  const renderRiskRow = (
    title: string,
    subtitle: string,
    score: number,
    severityStr: string,
    isFlag = false,
    isDetected = false,
  ) => (
    <View key={title} style={[s.riskRow, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
      {/* Left: gauge + labels */}
      <View style={s.riskLeft}>
        {!isFlag && (
          <ScoreGauge
            score={score}
            label=""
            size={64}       // Bigger gauges
            severity={severityStr}
            dark={dark}
          />
        )}
        <View style={[s.riskLabels, isFlag && { marginLeft: 0 }]}>
          <Text style={[s.riskTitle, { color: t.ink.primary }]}>{title}</Text>
          <Text style={[s.riskSub, { color: t.ink.secondary }]}>{subtitle}</Text>
        </View>
      </View>

      {/* Right: badge + score */}
      <View style={s.riskRight}>
        <SeverityBadge severity={isFlag ? (isDetected ? 'MODERATE' : 'LOW') : severityStr} dark={dark} />
        {!isFlag && (
          <Text style={[s.riskScoreNum, { color: getScoreColor(score) }]}>
            {score}
            <Text style={[s.riskScoreSuffix, { color: t.ink.tertiary }]}> /100</Text>
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* Card Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[s.iconWrap, { backgroundColor: t.status.criticalBg }]}>
            <HeartPulse color={t.status.critical} size={16} />
          </View>
          <Text style={[s.title, { color: t.ink.primary }]}>Health Risks</Text>
        </View>
        <View style={[s.cohortPill, { backgroundColor: cohortColor + '22', borderColor: cohortColor + '55' }]}>
          <Text style={[s.cohortText, { color: cohortColor }]}>{cohort.toUpperCase()}</Text>
        </View>
      </View>

      {cohort === 'elderly' && (
        <View style={[s.banner, { backgroundColor: t.status.moderateBg, borderColor: t.status.moderate + '44' }]}>
          <View style={[s.bannerIcon, { backgroundColor: t.status.moderate + '33' }]}>
            <User color={t.status.moderate} size={14} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: t.ink.primary }]}>Elderly Profile Active</Text>
            <Text style={[s.bannerSub, { color: t.ink.secondary }]}>Age group-specific risk model</Text>
          </View>
        </View>
      )}

      {renderRiskRow('Fall Risk',            'Inferred from IMU + asymmetry',       fallRiskScore,    getSeverityStr(fallRiskScore, [30, 60]))}
      {renderRiskRow("Parkinson's Flag",     'Inferred from tremor + cadence',      0, '',            true, tremorFlag)}
      {renderRiskRow('Vascular / Varicose',  'Inferred from temp + pressure zones', vascularScore,   getSeverityStr(vascularScore, [35, 60]))}
      {renderRiskRow('Joint Pain Risk',      `${jointStrainZone} zone overload`,    jointStrainScore, jointStrainSev)}
      {renderRiskRow('Slow Cadence',         'Inferred from step frequency',        slowCadenceScore, getSeverityStr(slowCadenceScore, [50, 75]))}
      {renderRiskRow('Diabetic Ulcer Risk',  'Chronic pressure hotspot',            ulcerScore,       getSeverityStr(ulcerScore, [30, 60]))}
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    marginBottom: 14,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cohortPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  cohortText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  bannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 12, fontWeight: '600' },
  bannerSub:   { fontSize: 10, marginTop: 1 },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  riskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  riskLabels: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  riskSub: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  riskRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
  },
  riskScoreNum: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  riskScoreSuffix: {
    fontSize: 10,
    fontWeight: '400',
  },
});
