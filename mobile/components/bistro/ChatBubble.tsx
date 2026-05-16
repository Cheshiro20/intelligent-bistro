import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import type { ChatMessage } from '@/lib/types';

type Props = {
  message: ChatMessage;
};

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (message.pending) {
    return (
      <View style={[styles.row, styles.assistantRow]}>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <TypingDots />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  userBubble: {
    backgroundColor: Palette.primary,
    borderBottomRightRadius: Spacing.xs,
  },
  assistantBubble: {
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  text: {
    ...Typography.body,
  },
  userText: {
    color: Palette.textInverted,
  },
  assistantText: {
    color: Palette.text,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.textMuted,
  },
});
