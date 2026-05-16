import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CartItem, ChatResponse } from './types';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // Android emulator can't reach `localhost` on the host — it needs 10.0.2.2.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';

  // For physical device via Expo Go, infer host from the dev server.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri ?? '';
  const host = hostUri.split(':')[0];
  if (host && host !== 'localhost' && !host.startsWith('127.') && /\d/.test(host)) {
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

const BASE_URL = resolveBaseUrl();

export async function sendChat(
  message: string,
  cart: CartItem[],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, cart, history }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat API error (${res.status}): ${text}`);
  }
  return res.json();
}

export { BASE_URL };
