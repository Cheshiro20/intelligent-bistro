import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { getMenuItem } from '@/lib/menu';

type Props = {
  itemId: string;
  reason: string;
  onAdd: () => void;
};

export function SuggestionCard({ itemId, reason, onAdd }: Props) {
  const item = getMenuItem(itemId);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      tension: 80,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  if (!item) return null;

  const handleAdd = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onAdd();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={12} color={Palette.primary} />
        <Text style={styles.headerLabel}>SUGGESTED PAIRING</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.reason} numberOfLines={2}>
            {reason}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleAdd}
        style={({ pressed }) => [
          styles.addBtn,
          {
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}>
        <Ionicons name="add" size={18} color={Palette.textInverted} />
        <Text style={styles.addLabel}>Add for ${item.price.toFixed(2)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginLeft: Spacing.lg,
    marginRight: Spacing.xxxl,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.primary + '40',
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    ...Typography.caption,
    color: Palette.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...Typography.bodyBold,
    color: Palette.text,
  },
  reason: {
    ...Typography.caption,
    color: Palette.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
  },
  addLabel: {
    ...Typography.smallBold,
    color: Palette.textInverted,
  },
});
