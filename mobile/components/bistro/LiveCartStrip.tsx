import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { getMenuItem } from '@/lib/menu';
import type { CartItem } from '@/lib/types';

type Props = {
  cart: CartItem[];
};

export function LiveCartStrip({ cart }: Props) {
  if (cart.length === 0) return null;

  const total = cart.reduce((sum, line) => {
    const item = getMenuItem(line.itemId);
    return sum + (item?.price ?? 0) * line.quantity;
  }, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <Ionicons name="bag-handle" size={14} color={Palette.primary} />
        <Text style={styles.summaryText}>
          {itemCount} item{itemCount === 1 ? '' : 's'} · ${total.toFixed(2)}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {cart.map((line) => (
          <Pill key={line.id} line={line} />
        ))}
      </ScrollView>
    </View>
  );
}

function Pill({ line }: { line: CartItem }) {
  const item = getMenuItem(line.itemId);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      tension: 90,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  if (!item) return null;

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          opacity: enter,
          transform: [
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          ],
        },
      ]}>
      <Text style={styles.pillEmoji}>{item.emoji}</Text>
      {line.quantity > 1 ? <Text style={styles.pillQty}>×{line.quantity}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    ...Typography.caption,
    color: Palette.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: Spacing.xs,
  },
  pillEmoji: {
    fontSize: 18,
  },
  pillQty: {
    ...Typography.smallBold,
    color: Palette.text,
  },
});
