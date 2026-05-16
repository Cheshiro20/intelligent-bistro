import type { MenuItem } from './types';

export const MENU: MenuItem[] = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    description: 'Angus beef, aged cheddar, caramelized onions, brioche bun.',
    price: 14.5,
    category: 'mains',
    emoji: '🍔',
  },
  {
    id: 'spicy-chicken',
    name: 'Spicy Chicken Sandwich',
    description: 'Buttermilk-brined chicken, Nashville hot sauce, slaw, pickles.',
    price: 13.0,
    category: 'mains',
    emoji: '🌶️',
  },
  {
    id: 'veggie-wrap',
    name: 'Mediterranean Wrap',
    description: 'Hummus, roasted vegetables, feta, baby spinach.',
    price: 11.5,
    category: 'mains',
    emoji: '🥙',
  },
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    description: 'Romaine, parmesan, garlic croutons, anchovy dressing.',
    price: 10.5,
    category: 'mains',
    emoji: '🥗',
  },
  {
    id: 'grilled-salmon',
    name: 'Grilled Salmon Plate',
    description: 'Atlantic salmon, lemon-dill butter, seasonal vegetables.',
    price: 19.0,
    category: 'mains',
    emoji: '🐟',
  },
  {
    id: 'truffle-fries',
    name: 'Truffle Fries',
    description: 'Hand-cut, truffle oil, parmesan, fresh herbs.',
    price: 7.0,
    category: 'sides',
    emoji: '🍟',
  },
  {
    id: 'onion-rings',
    name: 'Crispy Onion Rings',
    description: 'Beer-battered Vidalia onions, chipotle aioli.',
    price: 6.5,
    category: 'sides',
    emoji: '🧅',
  },
  {
    id: 'side-salad',
    name: 'Garden Side Salad',
    description: 'Mixed greens, cherry tomatoes, cucumber, balsamic.',
    price: 5.5,
    category: 'sides',
    emoji: '🥬',
  },
  {
    id: 'iced-tea',
    name: 'House Iced Tea',
    description: 'Unsweetened, brewed in-house with citrus.',
    price: 3.5,
    category: 'drinks',
    emoji: '🧋',
  },
  {
    id: 'lemonade',
    name: 'Fresh Lemonade',
    description: 'House-squeezed lemons, mint, lightly sweet.',
    price: 4.0,
    category: 'drinks',
    emoji: '🍋',
  },
  {
    id: 'sparkling-water-large',
    name: 'Sparkling Water (Large)',
    description: '750ml San Pellegrino.',
    price: 5.0,
    category: 'drinks',
    emoji: '💧',
  },
  {
    id: 'sparkling-water-small',
    name: 'Sparkling Water (Small)',
    description: '330ml San Pellegrino.',
    price: 3.5,
    category: 'drinks',
    emoji: '💧',
  },
];

export const CATEGORY_LABEL: Record<MenuItem['category'], string> = {
  mains: 'Mains',
  sides: 'Sides',
  drinks: 'Drinks',
};

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU.find((item) => item.id === id);
}
