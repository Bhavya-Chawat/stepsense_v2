import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import Svg, { Circle } from 'react-native-svg';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  severity?: string;
  suffix?: string;
  dark?: boolean;
}

function getArcColor(score: number, severity?: string, dark = false): string {
  const palette = dark
    ? { good: '#4ABFA0', moderate: '#D4AE5A', critical: '#C96060' }
    : { good: '#3A9E7E', moderate: '#C49A3A', critical: '#B85252' };

  if (severity) {
    const s = severity.toLowerCase();
    if (s.includes('high') || s.includes('severe') || s.includes('critical')) return palette.critical;
    if (s.includes('moderate') || s.includes('medium')) return palette.moderate;
    return palette.good;
  }
  if (score >= 65) return palette.good;
  if (score >= 35) return palette.moderate;
  return palette.critical;
}

export function ScoreGauge({ score, label, size = 64, severity, suffix = '/ 100', dark = false }: ScoreGaugeProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const arcColor = getArcColor(clamped, severity, dark);
  const trackColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={styles.container}>
      <View style={[styles.svgWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <Circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={arcColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.scoreValue, { color: arcColor }]}>{clamped}</Text>
          <Text style={[styles.scoreSuffix, { color: dark ? '#5A6878' : COLORS.ink.secondary }]}>{suffix}</Text>
        </View>
      </View>
      {label ? <Text style={[styles.label, { color: dark ? '#8A96A8' : COLORS.ink.secondary }]}>{label}</Text> : null}
    </View>
  );
}

interface SeverityBadgeProps {
  severity: string;
  label?: string;
  dark?: boolean;
}

export function SeverityBadge({ severity, label, dark = false }: SeverityBadgeProps) {
  const s = severity?.toLowerCase() ?? '';
  let bg: string;
  let color: string;

  if (s.includes('high') || s.includes('severe') || s.includes('critical')) {
    color = dark ? '#C96060' : '#B85252';
    bg    = dark ? '#2A1414' : '#FBEAEA';
  } else if (s.includes('moderate') || s.includes('medium')) {
    color = dark ? '#D4AE5A' : '#C49A3A';
    bg    = dark ? '#2A2010' : '#FBF4E5';
  } else {
    color = dark ? '#4ABFA0' : '#3A9E7E';
    bg    = dark ? '#162820' : '#EBF7F3';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{(label ?? severity).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  svgWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 20,
  },
  scoreSuffix: {
    fontSize: 8,
    fontWeight: '500',
    lineHeight: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
    maxWidth: 80,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export function FatigueGauge({ score, dark = false }: { score: number; dark?: boolean }) {
  const size = 64;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  // Arc circumference for a half-circle
  const circumference = Math.PI * radius;
  
  // Score 0-100 mapped to angle for the needle (0 to 180 degrees)
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;
  
  // Needle position
  // 180 deg (left) to 0 deg (right), but SVG coordinate system means 0 is right, 180 is left.
  // Actually, we can just rotate a line element.
  
  const palette = dark
    ? { good: '#4ABFA0', moderate: '#D4AE5A', critical: '#C96060' }
    : { good: '#3A9E7E', moderate: '#C49A3A', critical: '#B85252' };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size / 2, overflow: 'hidden' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-180deg' }] }}>
          {/* Green Segment (0-33%) */}
          <Circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={palette.good} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.33} ${circumference * 1.67}`}
          />
          {/* Yellow Segment (33-66%) */}
          <Circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={palette.moderate} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.33} ${circumference * 1.67}`}
            strokeDashoffset={-circumference * 0.33}
          />
          {/* Red Segment (66-100%) */}
          <Circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={palette.critical} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.34} ${circumference * 1.66}`}
            strokeDashoffset={-circumference * 0.66}
          />
        </Svg>
        {/* Needle Container - positioned at center-bottom of the half-circle */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: center,
          width: 0,
          height: 0,
          alignItems: 'center',
          justifyContent: 'flex-end',
          transform: [{ rotate: `${angle - 90}deg` }]
        }}>
          {/* Needle Graphic */}
          <View style={{ width: 2, height: radius + 2, backgroundColor: dark ? '#E8EDF2' : '#1C2533', borderRadius: 1, bottom: -2, position: 'absolute' }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dark ? '#E8EDF2' : '#1C2533', bottom: -3, position: 'absolute', left: -3 }} />
        </View>
        <Text style={{ position: 'absolute', bottom: -2, width: '100%', textAlign: 'center', fontSize: 16, fontWeight: '700', color: dark ? '#E8EDF2' : '#1C2533' }}>
          {clamped}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.good }} />
          <Text style={{ fontSize: 8, color: palette.good, fontWeight: '600' }}>Mild</Text>
        </View>
        <Text style={{ fontSize: 8, color: dark ? '#4A5668' : '#8A96A3' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.moderate }} />
          <Text style={{ fontSize: 8, color: palette.moderate, fontWeight: '600' }}>Mod</Text>
        </View>
        <Text style={{ fontSize: 8, color: dark ? '#4A5668' : '#8A96A3' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.critical }} />
          <Text style={{ fontSize: 8, color: palette.critical, fontWeight: '600' }}>Sev</Text>
        </View>
      </View>
    </View>
  );
}
