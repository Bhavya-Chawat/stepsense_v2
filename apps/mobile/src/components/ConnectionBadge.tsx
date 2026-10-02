import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getConnectionState, type ConnectionState } from '@stepsense/core';
import { COLORS } from '@stepsense/design-tokens';

interface ConnectionBadgeProps {
  lastRowTimestamp: string | null;
}

export function ConnectionBadge({ lastRowTimestamp }: ConnectionBadgeProps) {
  const [state, setState] = useState<ConnectionState>('DEMO');

  useEffect(() => {
    const updateState = () => {
      setState(getConnectionState(lastRowTimestamp));
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [lastRowTimestamp]);

  const dotColor =
    state === 'LIVE'
      ? COLORS.statusGood
      : state === 'STALE'
      ? COLORS.statusModerate
      : COLORS.inkSecondary;

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.text}>{state}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderColor: '#E8E2D6',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#26241F',
    letterSpacing: 0.5,
  },
});
