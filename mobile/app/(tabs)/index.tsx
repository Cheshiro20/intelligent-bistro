import React, { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuItemCard } from '@/components/bistro/MenuItemCard';
import { Palette, Spacing, Typography } from '@/constants/theme';
import { CATEGORY_LABEL, MENU } from '@/lib/menu';
import { useStore } from '@/lib/store';
import type { Category, MenuItem } from '@/lib/types';

export default function MenuScreen() {
  const addItem = useStore((s) => s.addItem);

  const sections = useMemo(() => {
    const order: Category[] = ['mains', 'sides', 'drinks'];
    return order.map((cat) => ({
      title: CATEGORY_LABEL[cat],
      data: MENU.filter((m) => m.category === cat),
    }));
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <SectionList<MenuItem>
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>THE INTELLIGENT BISTRO</Text>
            <Text style={styles.title}>Good evening 👋</Text>
            <Text style={styles.subtitle}>
              Browse the menu or just tell our assistant what you'd like.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View>
            <MenuItemCard item={item} onAdd={() => addItem(item.id)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
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
    paddingBottom: Spacing.xxxl,
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
  },
  sectionHeader: {
    ...Typography.heading,
    color: Palette.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
