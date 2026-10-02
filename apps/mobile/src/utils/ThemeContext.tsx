import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  dark: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({ dark: false });
export const useTheme = () => useContext(ThemeContext);

// Resolved palette per theme
export function getTheme(dark: boolean) {
  return {
    page:        dark ? '#141A22' : '#F4F6F8',
    card:        dark ? '#1E2733' : '#FAFAFA',   // Off-white, not pure white
    cardSubtle:  dark ? '#192029' : '#F2F4F7',
    border:      dark ? '#2C3A47' : '#E4E9EE',
    ink: {
      primary:   dark ? '#E8EDF2' : '#1C2533',
      secondary: dark ? '#8A96A8' : '#5A6878',
      tertiary:  dark ? '#4A5668' : '#8A96A3',
    },
    accent: {
      teal:      dark ? '#3AAFBE' : '#2A8FA0',
      tealLight: dark ? '#50C8D5' : '#3AAFBE',
      tealMuted: dark ? '#1A3A42' : '#E0F4F7',
    },
    status: {
      good:        dark ? '#4ABFA0' : '#3A9E7E',
      goodBg:      dark ? '#162820' : '#EBF7F3',
      moderate:    dark ? '#D4AE5A' : '#C49A3A',
      moderateBg:  dark ? '#2A2010' : '#FBF4E5',
      critical:    dark ? '#C96060' : '#B85252',
      criticalBg:  dark ? '#2A1414' : '#FBEAEA',
    },
    liveGreen:   dark ? '#4ABFA0' : '#3A9E7E',
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
