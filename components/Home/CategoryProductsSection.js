import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WixMediaImage } from '../../WixMediaImage';
import { theme } from '../../styles/theme';
import { CATEGORIES_DATA } from './CategoryBarWithIcons';

// Horizontal Product Card for category sliders
const HorizontalProductCard = ({ product, onPress }) => {
  const price = product.priceData?.formatted?.price || 
    `$${Number.parseFloat(product.priceData?.price || 0).toFixed(2)}`;
  
  const stockQuantity = product?.stock?.quantity;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <WixMediaImage
          media={product.media?.mainMedia?.image?.url}
          width={100}
          height={100}
        >
          {({ url }) => (
            <Image 
              source={{ uri: url }} 
              style={[styles.image, isOutOfStock && styles.imageGrayedOut]}
            />
          )}
        </WixMediaImage>
        {isOutOfStock && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
        {isLowStock && !isOutOfStock && (
          <View style={styles.lowStockBadge}>
            <View style={styles.lowStockDot} />
            <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
          </View>
        )}
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.name, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>{product.name}</Text>
      <Text style={[styles.price, isOutOfStock && styles.textGrayedOut]}>{price}</Text>
    </TouchableOpacity>
  );
};

// Single category row with horizontal slider
const CategoryRow = ({ category, products, onProductPress, onSeeAll }) => {
  if (!products || products.length === 0) return null;

  const IconComponent = category.iconType === 'material' ? MaterialCommunityIcons : Ionicons;
  const iconColor = category.color || theme.colors.text;

  return (
    <View style={styles.categoryContainer}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconComponent 
            name={category.icon} 
            size={22} 
            color={iconColor} 
          />
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.count}>({products.length})</Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => onSeeAll?.(category.slug)}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.accent} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.slice(0, 10).map((product) => (
          <HorizontalProductCard
            key={product._id}
            product={product}
            onPress={onProductPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Main component that displays all categories with their products
export const CategoryProductsSection = ({ 
  allProducts = [], 
  collections = [],
  onProductPress,
  onCategorySelect 
}) => {
  // Skip trending and all-products in the category list
  const displayCategories = CATEGORIES_DATA.filter(
    cat => cat.slug !== 'trending' && cat.slug !== 'all-products'
  );

  // Group products by collection/category
  const getProductsForCategory = (categorySlug, categoryData) => {
    // If category has displayCollections, gather products from all of them
    if (categoryData?.displayCollections && categoryData.displayCollections.length > 0) {
      const collectionIds = [];
      categoryData.displayCollections.forEach(dc => {
        const collection = collections.find(c => c.slug === dc.slug);
        if (collection) {
          collectionIds.push(collection._id);
        }
      });
      
      if (collectionIds.length > 0) {
        return allProducts.filter(product => 
          product.collectionIds?.some(id => collectionIds.includes(id))
        );
      }
    }
    
    // Find matching collection by slug
    const collection = collections.find(c => c.slug === categorySlug);
    
    if (collection) {
      return allProducts.filter(product => 
        product.collectionIds?.includes(collection._id)
      );
    }
    
    // Fallback: match by name
    const categoryName = categorySlug.replace(/-/g, ' ').toLowerCase();
    return allProducts.filter(product => {
      const productName = product.name?.toLowerCase() || '';
      const productDesc = product.description?.toLowerCase() || '';
      return productName.includes(categoryName) || productDesc.includes(categoryName);
    });
  };

  return (
    <View style={styles.container}>
      {displayCategories.map((category) => {
        const categoryProducts = getProductsForCategory(category.slug, category);
        return (
          <CategoryRow
            key={category.id}
            category={category}
            products={categoryProducts}
            onProductPress={onProductPress}
            onSeeAll={onCategorySelect}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  count: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    marginRight: 4,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGrayedOut: {
    opacity: 0.4,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textGrayedOut: {
    color: theme.colors.textMuted,
  },
  addButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  lowStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#333',
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 8,
    lineHeight: 16,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
  },
});
