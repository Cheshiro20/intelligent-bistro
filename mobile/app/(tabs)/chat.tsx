import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '@/components/bistro/ChatBubble';
import { LiveCartStrip } from '@/components/bistro/LiveCartStrip';
import { SuggestionCard } from '@/components/bistro/SuggestionCard';
import { VoiceButton } from '@/components/bistro/VoiceButton';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { fetchCapabilities } from '@/lib/recording';
import { useStore } from '@/lib/store';
import type { Suggestion } from '@/lib/types';

const SUGGESTIONS = [
  "I'll have a spicy chicken sandwich and a lemonade",
  'Add two truffle fries',
  "What's vegetarian?",
  'Clear my order',
];

export default function ChatScreen() {
  const messages = useStore((s) => s.messages);
  const cart = useStore((s) => s.cart);
  const isThinking = useStore((s) => s.isThinking);
  const sendMessage = useStore((s) => s.sendMessage);
  const addItem = useStore((s) => s.addItem);
  const [text, setText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchCapabilities().then((c) => setVoiceEnabled(c.voice));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length]);

  const submit = (value?: string) => {
    const payload = (value ?? text).trim();
    if (!payload || isThinking) return;
    setText('');
    sendMessage(payload);
  };

  const showSuggestions = messages.length <= 1 && !isThinking;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>AI ASSISTANT</Text>
        <Text style={styles.title}>How can I help?</Text>
      </View>

      <LiveCartStrip cart={cart} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View>
              <ChatBubble message={item} />
              {item.suggestions?.map((s: Suggestion) => (
                <SuggestionCard
                  key={`${item.id}_${s.itemId}`}
                  itemId={s.itemId}
                  reason={s.reason}
                  onAdd={() => addItem(s.itemId)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {showSuggestions ? (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => submit(s)}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {voiceError ? (
          <View style={styles.errorBar}>
            <Ionicons name="alert-circle" size={14} color={Palette.error} />
            <Text style={styles.errorText}>{voiceError}</Text>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          {voiceEnabled ? (
            <VoiceButton
              disabled={isThinking}
              onTranscript={(t) => {
                setVoiceError(null);
                submit(t);
              }}
              onError={(e) => setVoiceError(e.message)}
            />
          ) : null}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={voiceEnabled ? 'Type or tap the mic…' : 'Order anything…'}
            placeholderTextColor={Palette.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => submit()}
            editable={!isThinking}
          />
          <Pressable
            onPress={() => submit()}
            disabled={!text.trim() || isThinking}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: text.trim() && !isThinking ? Palette.primary : Palette.surfaceMuted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons
              name="arrow-up"
              size={20}
              color={text.trim() && !isThinking ? Palette.textInverted : Palette.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    ...Typography.caption,
    color: Palette.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.title,
    color: Palette.text,
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  suggestion: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  suggestionText: {
    ...Typography.small,
    color: Palette.text,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.bg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    ...Typography.body,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadow.card as object),
  },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.error + '14',
  },
  errorText: {
    ...Typography.caption,
    color: Palette.error,
    flex: 1,
  },
});
