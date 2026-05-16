import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import {
  ensureMicPermission,
  startRecording as startRec,
  stopAndTranscribe,
} from '@/lib/recording';

type State = 'idle' | 'recording' | 'transcribing';

type Props = {
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onError?: (err: Error) => void;
};

export function VoiceButton({ disabled, onTranscript, onError }: Props) {
  const [state, setState] = useState<State>('idle');
  const [elapsed, setElapsed] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startedAtRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [state, pulse]);

  const start = async () => {
    if (disabled || state !== 'idle') return;
    try {
      const granted = await ensureMicPermission();
      if (!granted) {
        onError?.(new Error('Microphone permission denied.'));
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const rec = await startRec();
      recordingRef.current = rec;
      startedAtRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      setState('recording');
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  };

  const stop = async () => {
    if (state !== 'recording' || !recordingRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setState('transcribing');
    try {
      const text = await stopAndTranscribe(recordingRef.current);
      recordingRef.current = null;
      setState('idle');
      if (text.trim()) onTranscript(text.trim());
    } catch (e) {
      setState('idle');
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  };

  if (state === 'recording') {
    return (
      <View style={styles.recordingWrap}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
              ],
            },
          ]}
        />
        <Pressable onPress={stop} style={styles.stopBtn} hitSlop={8}>
          <View style={styles.stopSquare} />
        </Pressable>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>
    );
  }

  if (state === 'transcribing') {
    return (
      <View style={styles.btn}>
        <View style={styles.transcribingDot} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={start}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: Palette.surface,
          borderColor: Palette.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
      hitSlop={8}>
      <Ionicons name="mic" size={20} color={Palette.text} />
    </Pressable>
  );
}

function formatTime(s: number): string {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...(Shadow.card as object),
  },
  recordingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Palette.error + '14',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    left: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.error,
  },
  stopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.error,
  },
  stopSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: Palette.textInverted,
  },
  timer: {
    ...Typography.smallBold,
    color: Palette.error,
    fontVariant: ['tabular-nums'],
  },
  transcribingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.primary,
  },
});
