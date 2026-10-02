export const COLORS = {
  // Page backgrounds
  page:        '#F4F6F8',
  card:        '#FFFFFF',
  cardSubtle:  '#F9FAFB',
  border:      '#E8ECEF',

  // Text
  ink: {
    primary:   '#1C2533',
    secondary: '#5A6878',
    tertiary:  '#8A96A3',
  },

  // Accent
  accent: {
    teal:      '#2A8FA0',   // Primary action
    tealLight: '#3AAFBE',   // Hover / highlights
    tealMuted: '#E0F4F7',   // Wash backgrounds
    // Legacy aliases used in components
    clay:      '#2A8FA0',
    blue:      '#3AAFBE',
  },

  // Status (de-saturated, easy on eyes)
  status: {
    good:        '#3A9E7E',  // Sage green
    goodBg:      '#EBF7F3',
    moderate:    '#C49A3A',  // Muted amber
    moderateBg:  '#FBF4E5',
    critical:    '#B85252',  // Muted rose
    criticalBg:  '#FBEAEA',
  },

  // Dark theme palette
  dark: {
    page:        '#141A22',
    card:        '#1E2733',
    cardSubtle:  '#192029',
    border:      '#2C3A47',
    ink: {
      primary:   '#E8EDF2',
      secondary: '#8A96A8',
    },
    accent: {
      teal:      '#3AAFBE',
      tealLight: '#50C8D5',
      tealMuted: '#1A3A42',
    },
    status: {
      good:      '#4ABFA0',
      goodBg:    '#162820',
      moderate:  '#D4AE5A',
      moderateBg:'#2A2010',
      critical:  '#C96060',
      criticalBg:'#2A1414',
    },
  },

  liveGreen:   '#3A9E7E',
};

// Pressure heatmap scale — refined, clinically standard
export const PRESSURE_SCALE = [
  '#C5DCF0', '#64A8D8', '#3EB8B0', '#D4A84A', '#A84040',
] as const;

export const SHADOWS = {
  card: {
    
    elevation:     2,
  },
  cardHover: {
    
    elevation:     5,
  },
};
