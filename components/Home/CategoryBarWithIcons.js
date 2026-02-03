import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Category data with icons and sub-collections for sliders
export const CATEGORIES_DATA = [
  { 
    id: 'trending', 
    name: 'Trending', 
    slug: 'trending', 
    icon: 'flame',
    iconType: 'ionicons',
    color: '#FF6B35',
  },
  { 
    id: 'all-products', 
    name: 'All', 
    slug: 'all-products', 
    icon: 'grid',
    iconType: 'ionicons',
    color: '#6366F1',
  },
  { 
    id: 'beers', 
    name: 'Beers', 
    slug: 'beers', 
    icon: 'beer',
    iconType: 'material',
    color: '#F4A460',
    // Collections to display as sliders (no popup)
    displayCollections: [
      { name: 'Single Cans', slug: 'beer-single-can', icon: 'beer-outline', iconType: 'material', color: '#F4A460' },
      { name: '6 Packs', slug: 'beers-6-pack', icon: 'package-variant', iconType: 'material', color: '#DAA520' },
      { name: 'Full Packs', slug: 'beers', icon: 'beer', iconType: 'material', color: '#F4A460' },
    ]
  },
  { 
    id: 'rtd', 
    name: 'RTD', 
    slug: 'rtd-pre-mixed', 
    icon: 'cup',
    iconType: 'material',
    color: '#FF69B4',
  },
  { 
    id: 'whiskey', 
    name: 'Whiskey', 
    slug: 'whiskey', 
    icon: 'liquor',
    iconType: 'material',
    color: '#D2691E',
    displayCollections: [
      { name: 'All Whiskey', slug: 'whiskey', icon: 'liquor', iconType: 'material', color: '#D2691E' },
      { name: 'Bourbon', slug: 'bourbon', icon: 'barrel', iconType: 'material', color: '#8B4513' },
      { name: 'Single Malt', slug: 'single-malt', icon: 'glass-stange', iconType: 'material', color: '#CD853F' },
    ]
  },
  { 
    id: 'gin', 
    name: 'Gin', 
    slug: 'gin', 
    icon: 'glass-tulip',
    iconType: 'material',
    color: '#87CEEB',
  },
  { 
    id: 'tequila', 
    name: 'Tequila', 
    slug: 'tequila', 
    icon: 'shaker',
    iconType: 'material',
    color: '#32CD32',
  },
  { 
    id: 'rum', 
    name: 'Rum', 
    slug: 'rum', 
    icon: 'bottle-wine',
    iconType: 'material',
    color: '#8B0000',
  },
  { 
    id: 'brandy', 
    name: 'Brandy', 
    slug: 'brandy', 
    icon: 'glass-tulip',
    iconType: 'material',
    color: '#B8860B',
  },
  { 
    id: 'liqueur', 
    name: 'Liqueur', 
    slug: 'liqueur', 
    icon: 'bottle-tonic',
    iconType: 'material',
    color: '#9370DB',
  },
  { 
    id: 'vodka', 
    name: 'Vodka', 
    slug: 'vodka', 
    icon: 'glass-cocktail',
    iconType: 'material',
    color: '#00CED1',
  },
  { 
    id: 'white-wines', 
    name: 'White Wines', 
    slug: 'white-wines', 
    icon: 'glass-wine',
    iconType: 'material',
    color: '#F5DEB3',
    displayCollections: [
      { name: 'Champagne', slug: 'champagne', icon: 'glass-flute', iconType: 'material', color: '#FFD700' },
      { name: 'Sparkling Wine', slug: 'sparkling-wine', icon: 'bottle-wine', iconType: 'material', color: '#C5B358' },
      { name: 'Chardonnay', slug: 'chard', icon: 'glass-wine', iconType: 'material', color: '#F5DEB3' },
      { name: 'Sauvignon Blanc', slug: 'sav', icon: 'glass-wine', iconType: 'material', color: '#E8E4C9' },
      { name: 'Pinot Gris', slug: 'pinot-gris', icon: 'glass-wine', iconType: 'material', color: '#D4CFC2' },
      { name: 'Rosé Wine', slug: 'rose', icon: 'glass-wine', iconType: 'material', color: '#FFB6C1' },
    ]
  },
  { 
    id: 'red-wines', 
    name: 'Red Wines', 
    slug: 'red-wines', 
    icon: 'glass-wine',
    iconType: 'material',
    color: '#722F37',
    displayCollections: [
      { name: 'Merlot', slug: 'merlot', icon: 'glass-wine', iconType: 'material', color: '#722F37' },
      { name: 'Cabernet Blends', slug: 'cab', icon: 'glass-wine', iconType: 'material', color: '#800020' },
      { name: 'Pinot Noir', slug: 'pinot-noir', icon: 'glass-wine', iconType: 'material', color: '#722F37' },
      { name: 'Shiraz', slug: 'shiraz', icon: 'glass-wine', iconType: 'material', color: '#5C1A1B' },
      { name: 'Red Blend', slug: 'red-blend-1', icon: 'glass-wine', iconType: 'material', color: '#8B0000' },
      { name: 'Tempranillo', slug: 'temarnillo-1', icon: 'glass-wine', iconType: 'material', color: '#6B1515' },
      { name: 'Port Wine', slug: 'port', icon: 'glass-tulip', iconType: 'material', color: '#7B3F00' },
    ]
  },
  { 
    id: 'smokes', 
    name: 'Smokes', 
    slug: 'smokes-1', 
    icon: 'smoking',
    iconType: 'material',
    color: '#708090',
  },
  { 
    id: 'snacks', 
    name: 'Snacks', 
    slug: 'snacks-soft-drinks', 
    icon: 'food',
    iconType: 'material',
    color: '#FF8C00',
  },
  { 
    id: 'accessories', 
    name: 'Accessories', 
    slug: 'other', 
    icon: 'shopping',
    iconType: 'material',
    color: '#20B2AA',
  },
];

const CategoryIcon = ({ category, isSelected }) => {
  const iconColor = isSelected ? category.color : (category.color || theme.colors.textMuted);
  const size = 32; // Larger icon size
  
  if (category.iconType === 'ionicons') {
    return <Ionicons name={category.icon} size={size} color={iconColor} />;
  }
  return <MaterialCommunityIcons name={category.icon} size={size} color={iconColor} />;
};

export const CategoryBarWithIcons = ({ selectedCategory, onSelectCategory }) => {
  const handleCategoryPress = (category) => {
    // All categories now select directly - no popup needed
    // Categories with displayCollections will show sliders automatically
    onSelectCategory(category.slug);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES_DATA.map((category) => {
          const isSelected = selectedCategory === category.slug;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconWrapper,
                isSelected && { transform: [{ scale: 1.1 }] }
              ]}>
                <CategoryIcon category={category} isSelected={isSelected} />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextActive,
                  isSelected && { color: category.color }
                ]}
              >
                {category.name}
              </Text>
              {isSelected && (
                <View style={[styles.activeIndicator, { backgroundColor: category.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 4,
    minWidth: 65,
  },
  iconWrapper: {
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  categoryTextActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
