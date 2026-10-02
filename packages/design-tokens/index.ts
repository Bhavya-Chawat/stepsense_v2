// StepSense Design Tokens — Premium Muted Palette
// Light theme: warm off-whites with soft teal accents
// Dark theme: deep charcoal with muted teal/sage accents
// Rule: No pure #FF0000 / #0000FF. All status colors are de-saturated.

export const LIGHT = {
  page:        '#F4F6F8',   // soft cool grey-white
  card:        '#FFFFFF',
  cardSubtle:  '#F9FAFB',
  border:      '#E8ECEF',
  borderFocus: '#B0C4CE',
  ink: {
    primary:   '#1C2533',   // near-black with blue undertone
    secondary: '#5A6878',   // muted slate
    tertiary:  '#8A96A3',   // light disabled text
  },
  accent: {
    teal:      '#2A8FA0',   // primary action — deep teal
    tealLight: '#3AAFBE',   // hover / highlight
    tealMuted: '#E0F4F7',   // teal wash backgrounds
  },
  status: {
    good:      '#3A9E7E',   // de-saturated sage green (not electric green)
    goodBg:    '#EBF7F3',
    moderate:  '#C49A3A',   // muted amber/gold (not bright yellow)
    moderateBg:'#FBF4E5',
    critical:  '#B85252',   // muted rose-red (not jarring red)
    criticalBg:'#FBEAEA',
  },
  liveGreen:   '#3A9E7E',
} as const;

export const DARK = {
  page:        '#141A22',   // deep charcoal-blue
  card:        '#1E2733',   // slightly lighter card
  cardSubtle:  '#192029',
  border:      '#2C3A47',
  borderFocus: '#3A8A9E',
  ink: {
    primary:   '#E8EDF2',   // off-white
    secondary: '#8A96A8',   // muted slate
    tertiary:  '#5A6878',
  },
  accent: {
    teal:      '#3AAFBE',   // slightly brighter in dark mode
    tealLight: '#50C8D5',
    tealMuted: '#1A3A42',   // dark teal wash
  },
  status: {
    good:      '#4ABFA0',   // slightly brighter sage in dark
    goodBg:    '#162820',
    moderate:  '#D4AE5A',   // muted gold
    moderateBg:'#2A2010',
    critical:  '#C96060',   // muted rose
    criticalBg:'#2A1414',
  },
  liveGreen:   '#4ABFA0',
} as const;

// Used in React Native (merged palette, not theme-aware yet)
export const COLORS = {
  bgPage:        LIGHT.page,
  bgCard:        LIGHT.card,
  border:        LIGHT.border,
  inkPrimary:    LIGHT.ink.primary,
  inkSecondary:  LIGHT.ink.secondary,
  accentClay:    LIGHT.accent.teal,
  accentBlue:    LIGHT.accent.tealLight,
  statusGood:    LIGHT.status.good,
  statusModerate:LIGHT.status.moderate,
  statusCritical:LIGHT.status.critical,
  statusInfo:    LIGHT.accent.teal,
  liveGreen:     LIGHT.liveGreen,
  staleYellow:   '#F0D080',
  demoOrange:    '#C49A3A',
} as const;

/**
 * Clinical-grade pressure heatmap gradient — refined, medical blues→reds.
 * Same stops as before but colors are perceptually linear and clinically standard.
 */
export const PRESSURE_GRADIENT_STOPS = [
  { stop: 0.0,  color: '#F0F4F8' },   // near-white — no pressure
  { stop: 0.1,  color: '#C5DCF0' },   // very light blue
  { stop: 0.25, color: '#64A8D8' },   // mid blue
  { stop: 0.50, color: '#3EB8B0' },   // teal
  { stop: 0.70, color: '#D4A84A' },   // muted amber
  { stop: 0.85, color: '#C07050' },   // muted orange-red
  { stop: 1.0,  color: '#A84040' },   // deep muted red — max pressure
] as const;

/**
 * Discrete 5-stop pressure scale.
 */
export const PRESSURE_SCALE = [
  '#C5DCF0',
  '#64A8D8',
  '#3EB8B0',
  '#D4A84A',
  '#A84040',
] as const;

export const FONTS = {
  display: 'Fraunces',
  body:    'Inter',
} as const;

export const ESTIMATED_INDICATOR_DISCLAIMER = 'Estimated indicator — not a medical measurement' as const;

/**
 * Interpolate a color from the clinical pressure gradient for a given normalized value (0-1).
 */
export function interpolateGradientColor(normalizedValue: number): string {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const stops = PRESSURE_GRADIENT_STOPS;

  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].stop && clamped <= stops[i + 1].stop) {
      const range = stops[i + 1].stop - stops[i].stop;
      const t = range > 0 ? (clamped - stops[i].stop) / range : 0;
      return lerpColor(stops[i].color, stops[i + 1].color, t);
    }
  }

  return stops[stops.length - 1].color;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function getPressureColor(value: number, min: number = 0, max: number = 4095): string {
  if (value <= min) return PRESSURE_SCALE[0];
  if (value >= max) return PRESSURE_SCALE[4];
  const normalized = (value - min) / (max - min);
  const index = Math.min(4, Math.floor(normalized * 5));
  return PRESSURE_SCALE[index];
}

export type ViewMode = 'consumer' | 'doctor' | 'athlete';

export const modeCopy = {
  fatigue: {
    consumer: 'Fatigue Level',
    doctor:   'Fatigue Index',
    athlete:  'Training Load & Onset',
  },
  asymmetry: {
    consumer: 'Step Balance',
    doctor:   'Gait Asymmetry (%)',
    athlete:  'Biomechanical Injury Risk',
  },
  cadence: {
    consumer: 'Walking Speed & Cadence',
    doctor:   'Cadence (steps/min)',
    athlete:  'Stride Rate / Rhythm',
  },
  jointStrain: {
    consumer: 'Joint Comfort',
    doctor:   'Joint Strain (%)',
    athlete:  'Peak Joint Overload',
  },
  fungalRisk: {
    consumer: 'Shoe Moisture Risk',
    doctor:   'Microclimate Fungal Risk',
    athlete:  'Footwear Hygiene / Sweat Level',
  },
  fallRisk: {
    consumer: 'Balance & Stability',
    doctor:   'Fall Risk Score',
    athlete:  'Stability Under Load',
  },
  gaitScore: {
    consumer: 'Gait Health',
    doctor:   'Composite Gait Score',
    athlete:  'Movement Efficiency',
  },
} as const;

export interface ZoneGeometry {
  key:   string;
  label: string;
  cx:    number;
  cy:    number;
  rx:    number;
  ry:    number;
}

export interface FootGeometrySpec {
  viewBox:     { width: number; height: number };
  outlinePath: string;
  zones:       ZoneGeometry[];
}

/**
 * Anatomically accurate foot silhouette SVG path.
 */
export const FOOT_GEOMETRY: FootGeometrySpec = {
  viewBox: { width: 220, height: 440 },
  outlinePath: [
    'M 125 50',
    'C 140 45, 160 15, 140 5',
    'C 120 -5, 110 25, 112 52',
    'L 106 50',
    'C 106 30, 85 30, 85 52',
    'L 78 52',
    'C 78 35, 60 35, 60 55',
    'L 54 58',
    'C 54 45, 40 45, 40 62',
    'L 34 66',
    'C 34 55, 18 55, 20 75',
    'C 15 100, 20 150, 35 200',
    'C 42 250, 42 300, 45 350',
    'C 45 430, 135 440, 145 365',
    'C 150 320, 185 260, 195 195',
    'C 200 135, 190 95, 165 75',
    'C 145 65, 135 60, 125 50',
    'Z',
  ].join(' '),
  zones: [
    { key: 's1_big_toe',    label: 'Big Toe',    cx: 130, cy:  30, rx: 16, ry: 18 },
    { key: 's2_second_toe', label: '2nd Toe',    cx:  95, cy:  38, rx: 12, ry: 14 },
    { key: 's3_ball_in',    label: 'Ball (In)',  cx: 155, cy: 115, rx: 18, ry: 20 },
    { key: 's4_ball_out',   label: 'Ball (Out)', cx:  55, cy: 130, rx: 18, ry: 20 },
    { key: 's5_midfoot',    label: 'Arch',       cx: 125, cy: 225, rx: 24, ry: 32 },
    { key: 's6_heel',       label: 'Heel',       cx: 105, cy: 375, rx: 30, ry: 28 },
  ],
};

/**
 * Severity badge color mapping — de-saturated for eye comfort.
 */
export function getSeverityColor(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'HIGH':
    case 'SEVERE':
    case 'CRITICAL':
    case 'RED':
      return COLORS.statusCritical;
    case 'MODERATE':
    case 'AMBER':
      return COLORS.statusModerate;
    case 'LOW':
    case 'NORMAL':
    case 'GREEN':
      return COLORS.statusGood;
    default:
      return COLORS.inkSecondary;
  }
}

export function scoreToSeverity(score: number): 'LOW' | 'MODERATE' | 'HIGH' {
  if (score >= 65) return 'HIGH';
  if (score >= 35) return 'MODERATE';
  return 'LOW';
}

export const TERRAIN_ICONS = {
  Flat:         'M4 18 L20 18',
  'Stairs Up':  'M4 18 L8 18 L8 14 L12 14 L12 10 L16 10 L16 6 L20 6',
  'Stairs Down':'M4 6 L8 6 L8 10 L12 10 L12 14 L16 14 L16 18 L20 18',
} as const;
