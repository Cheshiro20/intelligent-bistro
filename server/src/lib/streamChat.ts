import Anthropic from '@anthropic-ai/sdk';
import { getMenuItem } from '../menu.js';
import type { CartItem, CartUpdate, Suggestion } from '../types.js';
import {
  TOOLS,
  getAnthropic,
  buildSystemPrompt,
  fallbackPairing,
  toolUseToUpdate,
} from './anthropic.js';

const MODEL = 'claude-sonnet-4-6';

// Visible-streaming UX: the model often produces adjacent tool_use blocks
// in <50ms, so the client sees them land together even though they were
// emitted in order. A small delay between emitted tool events makes the
// "watch the AI think" effect visible. Tune lower for faster perceived
// latency, higher for more dramatic staggering.
const TOOL_EVENT_STAGGER_MS = 300;

export type StreamEvent =
  | { type: 'tool_use'; update: CartUpdate }
  | { type: 'suggestion'; suggestion: Suggestion }
  | { type: 'text_delta'; delta: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export async function* streamChat(
  userMessage: string,
  cart: CartItem[],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): AsyncGenerator<StreamEvent> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = getAnthropic().messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(cart),
      tools: TOOLS,
      messages,
    });

    const cartItemIds = new Set(cart.map((line) => line.itemId));
    const seenSuggestions = new Set<string>();
    const collectedUpdates: CartUpdate[] = [];
    // Buffer tool/suggestion events so we can flush them with staggered delay
    // AFTER fully consuming Anthropic's stream — avoids races between
    // setTimeout pauses inside the for-await and the SDK's iterator state.
    const queuedToolEvents: StreamEvent[] = [];

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        // Text deltas stream through immediately (no stagger).
        yield { type: 'text_delta', delta: event.delta.text };
      } else if (event.type === 'content_block_stop') {
        const message = stream.currentMessage;
        const block = message?.content?.[event.index];
        if (block?.type === 'tool_use') {
          if (block.name === 'suggest_pairing') {
            const input = block.input as Record<string, unknown>;
            const itemId = String(input.item_id);
            const reason = String(input.reason ?? '');
            if (
              getMenuItem(itemId) &&
              !seenSuggestions.has(itemId) &&
              !cartItemIds.has(itemId)
            ) {
              seenSuggestions.add(itemId);
              queuedToolEvents.push({ type: 'suggestion', suggestion: { itemId, reason } });
            }
          } else {
            const update = toolUseToUpdate(block.name, block.input as Record<string, unknown>);
            if (update) {
              collectedUpdates.push(update);
              if (update.type === 'add') cartItemIds.add(update.itemId);
              queuedToolEvents.push({ type: 'tool_use', update });
            }
          }
        }
      }
    }

    // Server-side fallback: if model didn't suggest a pairing, but the cart could benefit, add one.
    const userSaidNoPairing = /\b(just|only|nothing else|that'?s all)\b/i.test(userMessage);
    if (seenSuggestions.size === 0 && !userSaidNoPairing) {
      const fallback = fallbackPairing(cart, collectedUpdates, seenSuggestions);
      if (fallback) queuedToolEvents.push({ type: 'suggestion', suggestion: fallback });
    }

    // Flush buffered tool/suggestion events with stagger between them.
    for (let i = 0; i < queuedToolEvents.length; i++) {
      yield queuedToolEvents[i];
      if (i < queuedToolEvents.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, TOOL_EVENT_STAGGER_MS));
      }
    }

    yield { type: 'done' };
  } catch (err) {
    yield {
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
