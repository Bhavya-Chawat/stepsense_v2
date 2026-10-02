import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SessionSummary } from '@stepsense/types';
import { ESTIMATED_INDICATOR_DISCLAIMER } from '@stepsense/design-tokens';

interface RiskIndicatorsCardProps {
  summary: SessionSummary | null;
}

export function RiskIndicatorsCard({ summary }: RiskIndicatorsCardProps) {
  const vascularFlag = summary?.vascular_strain_flag ?? false;
  const terrain = summary?.terrain_label ?? 'Flat/smooth';
  const ulcerZones = summary?.ulcer_risk_zones ? Object.keys(summary.ulcer_risk_zones).filter((k) => summary.ulcer_risk_zones[k]) : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Estimated Risk Indicators</Text>
        <Text style={styles.disclaimer}>{ESTIMATED_INDICATOR_DISCLAIMER}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.label}>Vascular Strain</Text>
          <Text style={styles.value}>
            {vascularFlag ? 'Elevated Strain' : 'Normal Variance'}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Ulcer Risk</Text>
          <Text style={styles.value}>
            {ulcerZones.length > 0 ? `Flagged: ${ulcerZones.join(', ')}` : 'None'}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Terrain</Text>
          <Text style={styles.value}>{terrain}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E2D6',
    padding: 14,
    marginBottom: 12,
  },
  header: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D6',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C97361',
  },
  disclaimer: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#6B6558',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    padding: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  label: {
    fontSize: 9,
    color: '#6B6558',
    fontWeight: '600',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#26241F',
    marginTop: 2,
  },
});
