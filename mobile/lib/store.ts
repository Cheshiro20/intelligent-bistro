import { create } from 'zustand';
import EventSource from 'react-native-sse';
import { BASE_URL } from './api';
import { getMenuItem } from './menu';
import type { CartItem, CartUpdate, ChatMessage, Suggestion } from './types';

let idCounter = 0;
function nextId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

type Store = {
  cart: CartItem[];
  messages: ChatMessage[];
  isThinking: boolean;

  addItem: (itemId: string, quantity?: number, notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyServerUpdate: (update: CartUpdate) => void;

  sendMessage: (text: string) => Promise<void>;

  subtotal: () => number;
  itemCount: () => number;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome_msg',
  role: 'assistant',
  content:
    "Welcome to The Intelligent Bistro! Tell me what you'd like — try \"I'll have a spicy chicken sandwich and a lemonade\" or browse the menu and tap to add.",
  timestamp: Date.now(),
};

export const useStore = create<Store>((set, get) => ({
  cart: [],
  messages: [WELCOME_MESSAGE],
  isThinking: false,

  addItem: (itemId, quantity = 1, notes) =>
    set((state) => {
      if (!getMenuItem(itemId)) return state;
      const existing = state.cart.find(
        (line) => line.itemId === itemId && (line.notes ?? '') === (notes ?? '')
      );
      if (existing) {
        return {
          cart: state.cart.map((line) =>
            line.id === existing.id ? { ...line, quantity: line.quantity + quantity } : line
          ),
        };
      }
      return {
        cart: [...state.cart, { id: nextId('cart'), itemId, quantity, notes }],
      };
    }),

  removeItem: (cartItemId) =>
    set((state) => ({ cart: state.cart.filter((line) => line.id !== cartItemId) })),

  updateQuantity: (cartItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((line) => line.id !== cartItemId) };
      }
      return {
        cart: state.cart.map((line) =>
          line.id === cartItemId ? { ...line, quantity } : line
        ),
      };
    }),

  clearCart: () => set({ cart: [] }),

  applyServerUpdate: (update) => {
    switch (update.type) {
      case 'add':
        get().addItem(update.itemId, update.quantity, update.notes);
        break;
      case 'remove':
        get().removeItem(update.cartItemId);
        break;
      case 'update':
        get().updateQuantity(update.cartItemId, update.quantity);
        break;
      case 'clear':
        get().clearCart();
        break;
    }
  },

  sendMessage: async (text) => {
    const userMsg: ChatMessage = {
      id: nextId('msg'),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: nextId('msg'),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      pending: true,
    };

    set((state) => ({
      messages: [...state.messages, userMsg, assistantMsg],
      isThinking: true,
    }));

    const history = get()
      .messages.filter((m) => !m.pending && m.content.length > 0 && m.id !== WELCOME_MESSAGE.id)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    return new Promise<void>((resolve) => {
      let textBuffer = '';
      const suggestions: Suggestion[] = [];

      type Evt = 'tool_use' | 'suggestion' | 'text_delta' | 'done';
      const es = new EventSource<Evt>(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, cart: get().cart, history }),
        pollingInterval: 0,
      });

      const finalize = (errorText?: string) => {
        set((state) => ({
          isThinking: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: errorText
                    ? `⚠️  ${errorText}`
                    : textBuffer.trim() || (suggestions.length > 0 ? '' : 'Done.'),
                  pending: false,
                  timestamp: Date.now(),
                  suggestions,
                }
              : m
          ),
        }));
        es.removeAllEventListeners();
        es.close();
        resolve();
      };

      es.addEventListener('tool_use', (e) => {
        if (e.type !== 'tool_use') return;
        try {
          const payload = JSON.parse(e.data ?? '{}') as { update: CartUpdate };
          if (payload.update) get().applyServerUpdate(payload.update);
        } catch {}
      });

      es.addEventListener('suggestion', (e) => {
        if (e.type !== 'suggestion') return;
        try {
          const payload = JSON.parse(e.data ?? '{}') as { suggestion: Suggestion };
          if (payload.suggestion) suggestions.push(payload.suggestion);
        } catch {}
      });

      es.addEventListener('text_delta', (e) => {
        if (e.type !== 'text_delta') return;
        try {
          const payload = JSON.parse(e.data ?? '{}') as { delta: string };
          textBuffer += payload.delta ?? '';
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: textBuffer } : m
            ),
          }));
        } catch {}
      });

      es.addEventListener('done', () => finalize());
      es.addEventListener('error', (e) => {
        const msg =
          'message' in e && typeof (e as { message?: unknown }).message === 'string'
            ? ((e as { message: string }).message)
            : 'Connection failed. Is the server running?';
        finalize(msg);
      });
    });
  },

  subtotal: () => {
    return get().cart.reduce((sum, line) => {
      const item = getMenuItem(line.itemId);
      return sum + (item?.price ?? 0) * line.quantity;
    }, 0);
  },

  itemCount: () => get().cart.reduce((sum, line) => sum + line.quantity, 0),
}));
