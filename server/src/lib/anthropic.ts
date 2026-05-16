import Anthropic from '@anthropic-ai/sdk';
import { MENU, getMenuItem } from '../menu.js';
import type { CartItem, CartUpdate, Suggestion, Category } from '../types.js';

const MODEL = 'claude-sonnet-4-6';

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_item',
    description:
      'Add a menu item to the cart. Use the exact item_id from the menu — never invent IDs. If the user asks for multiple distinct items, call this tool once per item.',
    input_schema: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'The exact item id from the menu.' },
        quantity: { type: 'integer', minimum: 1, description: 'How many to add. Defaults to 1.' },
        notes: {
          type: 'string',
          description: 'Optional customer customization, e.g. "no pickles", "extra spicy".',
        },
      },
      required: ['item_id', 'quantity'],
    },
  },
  {
    name: 'remove_item',
    description: 'Remove a specific cart line entirely. Use the cart_item_id from the current cart.',
    input_schema: {
      type: 'object',
      properties: {
        cart_item_id: { type: 'string', description: 'The id of the cart line to remove.' },
      },
      required: ['cart_item_id'],
    },
  },
  {
    name: 'update_quantity',
    description:
      'Change the quantity of an existing cart line. Setting quantity to 0 will remove the line.',
    input_schema: {
      type: 'object',
      properties: {
        cart_item_id: { type: 'string', description: 'The id of the cart line to update.' },
        quantity: { type: 'integer', minimum: 0, description: 'The new quantity.' },
      },
      required: ['cart_item_id', 'quantity'],
    },
  },
  {
    name: 'clear_cart',
    description: 'Empty the entire cart. Only use when the user clearly asks to start over.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'suggest_pairing',
    description:
      'Suggest ONE complementary item that pairs well with what the user just ordered. Use sparingly — only when it feels genuinely helpful, not pushy. Good moments: user added a main with no side/drink, or user seems unsure. Bad moments: user is clearly done, user already has a balanced order, user is removing things.',
    input_schema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'The exact id of the menu item to suggest. Must NOT be already in cart.',
        },
        reason: {
          type: 'string',
          description:
            'A short, warm reason why this pairs (max 12 words). Example: "Pairs perfectly with the smoky char of the burger."',
        },
      },
      required: ['item_id', 'reason'],
    },
  },
];

export function buildSystemPrompt(cart: CartItem[]): string {
  const menuSummary = MENU.map(
    (item) =>
      `- ${item.id} | ${item.name} | $${item.price.toFixed(2)} | ${item.category} | ${item.description}`
  ).join('\n');

  const cartSummary =
    cart.length === 0
      ? '(empty)'
      : cart
          .map((line) => {
            const item = MENU.find((m) => m.id === line.itemId);
            return `- ${line.id} | ${line.quantity}x ${item?.name ?? line.itemId}${
              line.notes ? ` (${line.notes})` : ''
            }`;
          })
          .join('\n');

  return `You are the AI ordering assistant for "The Intelligent Bistro", a modern casual restaurant.

Your job: interpret the customer's natural-language order, update their cart using the provided tools, AND always respond with a short, warm text reply.

CRITICAL RESPONSE FORMAT — read carefully:
- ALWAYS emit a one-sentence conversational text reply FIRST, BEFORE any tool calls.
- THEN call the tools needed (add_item, remove_item, update_quantity, clear_cart).
- THEN, if applicable, call suggest_pairing as the very LAST tool.
- Example response order: TEXT("Two spicy chickens coming up!") → add_item → add_item → suggest_pairing(truffle-fries, "...").
- Never call a tool without preceding text. The text confirms the change in a friendly tone.

Rules:
- ALWAYS use the exact item_id from the menu. Never invent IDs.
- If something isn't on the menu, say so briefly and suggest 1 close alternative.
- For "large/small" qualifiers, pick the matching size variant.
- For ambiguous requests, pick the obvious match if there's only one candidate; otherwise ask one short clarifying question.
- Default quantity to 1 if unspecified.
- When the user says "remove the burger" or similar, find the matching cart line by name and call remove_item with its cart_item_id.
- Be friendly and concise — like a barista who knows the menu cold. Use the customer's words back at them when natural ("two spicy chickens, one without pickles — coming up!").

Pairing suggestions (do this carefully):
- Whenever you add a main course AND the resulting cart has NEITHER a drink NOR a side, call suggest_pairing once.
- Do NOT pair if the cart already has any drink OR any side. A main + one accompaniment is already a balanced order.
- Do NOT pair if removing items, or if the user says "just" / "only" / "nothing else" / "that's all".
- The suggestion item must NOT already be in the cart and must NOT be one you're adding this turn.
- Do NOT mention the suggestion in your text reply — the UI surfaces it as a visual card. Keep your text reply about the main change.

Example flow for "I'll have a burger":
  TEXT: "One classic burger coming right up!"
  add_item(classic-burger, 1)
  suggest_pairing(truffle-fries, "Hand-cut truffle fries are the perfect side for the burger.")

Counter-example for "burger and a lemonade" — the cart will have a drink, so DO NOT call suggest_pairing.

MENU:
${menuSummary}

CURRENT CART:
${cartSummary}`;
}

type ToolInput = Record<string, unknown>;

const DEFAULT_PAIRING_REASONS: Record<string, string> = {
  'truffle-fries': 'Hand-cut truffle fries — the classic side that earns its keep.',
  'onion-rings': 'Crispy onion rings round out a savory order beautifully.',
  'side-salad': 'A fresh side salad balances the plate.',
  lemonade: 'House-squeezed lemonade keeps things bright.',
  'iced-tea': 'House iced tea is the easy pairing.',
  'sparkling-water-large': 'Sparkling water cleans the palate between bites.',
  'sparkling-water-small': 'A small sparkling water if you want something light.',
};

export function fallbackPairing(
  cart: CartItem[],
  updates: CartUpdate[],
  alreadySuggested: Set<string>
): Suggestion | null {
  const addedMain = updates.find(
    (u) => u.type === 'add' && getMenuItem(u.itemId)?.category === 'mains'
  );
  if (!addedMain) return null;

  const inCart = new Set<string>([
    ...cart.map((l) => l.itemId),
    ...updates.filter((u): u is Extract<CartUpdate, { type: 'add' }> => u.type === 'add').map((u) => u.itemId),
  ]);

  const categoryPresent = (cat: Category) =>
    Array.from(inCart).some((id) => getMenuItem(id)?.category === cat);

  // Rule: only suggest when the cart has a main but NEITHER a drink NOR a side.
  // Once the user has any accompaniment, we stay out of the way.
  if (categoryPresent('drinks') || categoryPresent('sides')) return null;

  // Default to suggesting a side — universally pairs with all mains in our menu.
  const candidate = MENU.find(
    (m) => m.category === 'sides' && !inCart.has(m.id) && !alreadySuggested.has(m.id)
  );
  if (!candidate) return null;

  return {
    itemId: candidate.id,
    reason: DEFAULT_PAIRING_REASONS[candidate.id] ?? 'Pairs well with your order.',
  };
}

export function toolUseToUpdate(name: string, input: ToolInput): CartUpdate | null {
  switch (name) {
    case 'add_item':
      return {
        type: 'add',
        itemId: String(input.item_id),
        quantity: Number(input.quantity ?? 1),
        notes: input.notes ? String(input.notes) : undefined,
      };
    case 'remove_item':
      return { type: 'remove', cartItemId: String(input.cart_item_id) };
    case 'update_quantity':
      return {
        type: 'update',
        cartItemId: String(input.cart_item_id),
        quantity: Number(input.quantity),
      };
    case 'clear_cart':
      return { type: 'clear' };
    default:
      return null;
  }
}

export async function runChat(
  userMessage: string,
  cart: CartItem[],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ reply: string; updates: CartUpdate[]; suggestions: Suggestion[] }> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(cart),
    tools: TOOLS,
    messages,
  });

  const updates: CartUpdate[] = [];
  const suggestions: Suggestion[] = [];
  const textParts: string[] = [];
  const seenSuggestions = new Set<string>();
  const cartItemIds = new Set(cart.map((line) => line.itemId));

  for (const block of response.content) {
    if (block.type === 'tool_use') {
      if (block.name === 'suggest_pairing') {
        const input = block.input as ToolInput;
        const itemId = String(input.item_id);
        const reason = String(input.reason ?? '');
        if (
          getMenuItem(itemId) &&
          !seenSuggestions.has(itemId) &&
          !cartItemIds.has(itemId)
        ) {
          suggestions.push({ itemId, reason });
          seenSuggestions.add(itemId);
        }
      } else {
        const update = toolUseToUpdate(block.name, block.input as ToolInput);
        if (update) updates.push(update);
      }
    } else if (block.type === 'text') {
      textParts.push(block.text);
    }
  }

  // If model didn't call suggest_pairing but the cart could benefit, add one.
  const userSaidNoPairing = /\b(just|only|nothing else|that'?s all)\b/i.test(userMessage);
  if (suggestions.length === 0 && !userSaidNoPairing) {
    const fallback = fallbackPairing(cart, updates, new Set());
    if (fallback) suggestions.push(fallback);
  }

  const reply = textParts.join('\n').trim() || 'Done.';
  return { reply, updates, suggestions };
}
