import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export const CategoryBar = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id || category.slug}
            style={[
              styles.chip,
              selectedCategory === category.slug && styles.chipActive,
            ]}
            onPress={() => onSelectCategory(category.slug)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === category.slug && styles.chipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.secondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  chipTextActive: {
    color: theme.colors.textLight,
  },
});
