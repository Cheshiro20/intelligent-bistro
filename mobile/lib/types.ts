export type Category = 'mains' | 'sides' | 'drinks';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  emoji: string;
  tags?: string[];
};

export type CartItem = {
  id: string;
  itemId: string;
  quantity: number;
  notes?: string;
};

export type Suggestion = {
  itemId: string;
  reason: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pending?: boolean;
  suggestions?: Suggestion[];
};

export type CartUpdate =
  | { type: 'add'; itemId: string; quantity: number; notes?: string }
  | { type: 'remove'; cartItemId: string }
  | { type: 'update'; cartItemId: string; quantity: number }
  | { type: 'clear' };

export type ChatResponse = {
  reply: string;
  cartUpdates: CartUpdate[];
  updatedCart: CartItem[];
  suggestions: Suggestion[];
};
