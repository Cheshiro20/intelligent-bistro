import { randomUUID } from 'node:crypto';
import { getMenuItem } from '../menu.js';
import type { CartItem, CartUpdate } from '../types.js';

export function applyUpdate(cart: CartItem[], update: CartUpdate): CartItem[] {
  switch (update.type) {
    case 'add': {
      if (!getMenuItem(update.itemId)) {
        throw new Error(`Unknown menu item: ${update.itemId}`);
      }
      const existing = cart.find(
        (line) => line.itemId === update.itemId && (line.notes ?? '') === (update.notes ?? '')
      );
      if (existing) {
        return cart.map((line) =>
          line.id === existing.id ? { ...line, quantity: line.quantity + update.quantity } : line
        );
      }
      return [
        ...cart,
        {
          id: randomUUID(),
          itemId: update.itemId,
          quantity: update.quantity,
          notes: update.notes,
        },
      ];
    }
    case 'remove':
      return cart.filter((line) => line.id !== update.cartItemId);
    case 'update': {
      if (update.quantity <= 0) {
        return cart.filter((line) => line.id !== update.cartItemId);
      }
      return cart.map((line) =>
        line.id === update.cartItemId ? { ...line, quantity: update.quantity } : line
      );
    }
    case 'clear':
      return [];
  }
}

export function applyUpdates(cart: CartItem[], updates: CartUpdate[]): CartItem[] {
  return updates.reduce((acc, update) => applyUpdate(acc, update), cart);
}
