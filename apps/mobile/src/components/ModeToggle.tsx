import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ViewMode } from '@stepsense/design-tokens';

interface ModeToggleProps {
  mode: ViewMode;
  onChangeMode: (newMode: ViewMode) => void;
}

export function ModeToggle({ mode, onChangeMode }: ModeToggleProps) {
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'consumer', label: 'Consumer' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'athlete', label: 'Athlete' },
  ];

  return (
    <View style={styles.container}>
      {modes.map((m) => {
        const active = mode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.button, active && styles.activeButton]}
            onPress={() => onChangeMode(m.key)}
          >
            <Text style={[styles.text, active && styles.activeText]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E8E2D6',
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#C97361',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B6558',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
