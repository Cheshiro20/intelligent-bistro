import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useStore } from '@/lib/store';
import type { MenuItem } from '@/lib/types';

type Props = {
  item: MenuItem;
  onAdd: () => void;
};

export function MenuItemCard({ item, onAdd }: Props) {
  const cartLine = useStore((s) =>
    s.cart.find((line) => line.itemId === item.id && !line.notes)
  );
  const updateQuantity = useStore((s) => s.updateQuantity);
  const quantity = cartLine?.quantity ?? 0;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAdd();
  };

  const handleDecrement = () => {
    if (!cartLine) return;
    Haptics.selectionAsync().catch(() => {});
    updateQuantity(cartLine.id, cartLine.quantity - 1);
  };

  return (
    <View style={styles.card}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>

          {quantity === 0 ? (
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addBtn,
                { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}>
              <Ionicons name="add" size={20} color={Palette.textInverted} />
            </Pressable>
          ) : (
            <View style={styles.stepper}>
              <Pressable
                onPress={handleDecrement}
                hitSlop={6}
                style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons name="remove" size={16} color={Palette.textInverted} />
              </Pressable>
              <Text style={styles.qty}>{quantity}</Text>
              <Pressable
                onPress={handleAdd}
                hitSlop={6}
                style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons name="add" size={16} color={Palette.textInverted} />
              </Pressable>
            </View>
          )}
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
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    ...Typography.heading,
    color: Palette.text,
    marginBottom: 2,
  },
  description: {
    ...Typography.small,
    color: Palette.textMuted,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...Typography.bodyBold,
    color: Palette.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    height: 36,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    ...Typography.bodyBold,
    color: Palette.textInverted,
    minWidth: 20,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
