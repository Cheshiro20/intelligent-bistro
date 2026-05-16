import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { getMenuItem } from '@/lib/menu';
import type { CartItem } from '@/lib/types';

type Props = {
  line: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export function CartLine({ line, onIncrement, onDecrement, onRemove }: Props) {
  const item = getMenuItem(line.itemId);
  if (!item) return null;

  const tap = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };

  return (
    <View style={styles.card}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Pressable onPress={tap(onRemove)} hitSlop={12}>
            <Ionicons name="close" size={20} color={Palette.textMuted} />
          </Pressable>
        </View>
        {line.notes ? <Text style={styles.notes}>"{line.notes}"</Text> : null}
        <View style={styles.footer}>
          <Text style={styles.price}>${(item.price * line.quantity).toFixed(2)}</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={tap(onDecrement)}
              hitSlop={8}
              style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="remove" size={18} color={Palette.text} />
            </Pressable>
            <Text style={styles.qty}>{line.quantity}</Text>
            <Pressable
              onPress={tap(onIncrement)}
              hitSlop={8}
              style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="add" size={18} color={Palette.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...(Shadow.card as object),
  },
  emojiBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...Typography.bodyBold,
    color: Palette.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  notes: {
    ...Typography.caption,
    color: Palette.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  price: {
    ...Typography.bodyBold,
    color: Palette.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xs,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    ...Typography.bodyBold,
    color: Palette.text,
    minWidth: 24,
    textAlign: 'center',
  },
});
