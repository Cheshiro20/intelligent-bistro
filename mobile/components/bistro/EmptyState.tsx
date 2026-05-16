import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette, Spacing, Typography } from '@/constants/theme';

type Props = {
  emoji: string;
  title: string;
  description?: string;
};

export function EmptyState({ emoji, title, description }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Palette.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
