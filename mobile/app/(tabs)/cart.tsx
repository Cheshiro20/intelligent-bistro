import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/bistro/Button';
import { CartLine } from '@/components/bistro/CartLine';
import { EmptyState } from '@/components/bistro/EmptyState';
import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function CartScreen() {
  const cart = useStore((s) => s.cart);
  const subtotal = useStore((s) => s.subtotal());
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeItem = useStore((s) => s.removeItem);
  const clearCart = useStore((s) => s.clearCart);
  const router = useRouter();

  const handleClear = () => {
    Alert.alert('Clear cart?', 'This will remove everything from your order.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          clearCart();
        },
      },
    ]);
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Order placed!', `Thanks — your $${subtotal.toFixed(2)} order is on the way.`, [
      {
        text: 'OK',
        onPress: () => {
          clearCart();
          router.push('/');
        },
      },
    ]);
  };

  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR ORDER</Text>
          <Text style={styles.title}>Cart</Text>
        </View>
        <EmptyState
          emoji="🛍️"
          title="Your cart is empty"
          description="Browse the menu or chat with our assistant to add items."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        data={cart}
        keyExtractor={(line) => line.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>YOUR ORDER</Text>
            <Text style={styles.title}>Cart</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item }) => (
          <CartLine
            line={item}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (8.25%)</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Clear" variant="secondary" onPress={handleClear} style={{ flex: 1 }} />
          <Button
            label={`Checkout · $${total.toFixed(2)}`}
            onPress={handleCheckout}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.caption,
    color: Palette.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.display,
    color: Palette.text,
  },
  summary: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...(Shadow.lifted as object),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.body,
    color: Palette.textMuted,
  },
  summaryValue: {
    ...Typography.body,
    color: Palette.text,
  },
  summaryTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  totalLabel: {
    ...Typography.heading,
    color: Palette.text,
  },
  totalValue: {
    ...Typography.heading,
    color: Palette.text,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
