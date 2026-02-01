import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WixMediaImage } from '../../WixMediaImage';
import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';

// Horizontal Product Card - matching CategoryProductsSection style
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
          width={120}
          height={120}
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

// Collection Row - fetches products from a SINGLE Wix collection by slug
const CollectionRow = ({ collectionSlug, collectionName, collectionIcon, collectionIconType, collectionColor, allCollections, onProductPress }) => {
  // Find the collection ID from slug
  const collection = allCollections.find(c => c.slug === collectionSlug);
  const collectionId = collection?._id;
  
  // Determine icon to show (fallback to tag)
  const iconName = collectionIcon || 'tag';
  const iconType = collectionIconType || 'material';
  const iconColor = collectionColor || theme.colors.accent;
  
  // Fetch products for this specific collection
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['collectionProducts', collectionSlug, collectionId],
    queryFn: async () => {
      if (!collectionId) {
        console.log(`CollectionRow: No collection ID for slug "${collectionSlug}"`);
        return [];
      }
      console.log(`CollectionRow: Fetching products for "${collectionName}" (${collectionSlug}) - ID: ${collectionId}`);
      try {
        const response = await wixCient.products
          .queryProducts()
          .hasSome('collectionIds', [collectionId])
          .limit(20)
          .find();
        console.log(`CollectionRow: Found ${response.items?.length || 0} products for "${collectionName}"`);
        return response.items || [];
      } catch (err) {
        console.log(`CollectionRow ERROR for "${collectionName}":`, err.message);
        throw err;
      }
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Log errors
  if (error) {
    console.log(`CollectionRow: Error for "${collectionName}":`, error.message);
  }

  // Render the icon based on type
  const renderIcon = () => {
    if (iconType === 'ionicons') {
      return <Ionicons name={iconName} size={20} color={iconColor} />;
    }
    return <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />;
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.categoryContainer}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {renderIcon()}
            <Text style={styles.title}>{collectionName}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      </View>
    );
  }

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={styles.categoryContainer}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {renderIcon()}
          <Text style={styles.title}>{collectionName}</Text>
          <Text style={styles.count}>({products.length})</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
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

/**
 * CategoryProductsGrouped Component
 * Shows multiple collection sliders when a category with displayCollections is selected
 * 
 * Example: When "Beers" is selected, display 3 horizontal sliders:
 *   - Single Cans (beer-single-can collection)
 *   - 6 Packs (beers-6-pack collection)
 *   - Full Packs (beers collection)
 * 
 * Each slider fetches products directly from its Wix collection by slug.
 */
export const CategoryProductsGrouped = ({ 
  collections = [], 
  categorySlug, 
  onProductPress,
  onScroll,
  ListHeaderComponent,
  ListFooterComponent,
  CATEGORIES_DATA = []
}) => {
  // Find the category data
  const categoryData = CATEGORIES_DATA.find(c => c.slug === categorySlug);
  
  // Only render if this category has displayCollections defined
  if (!categoryData?.displayCollections || categoryData.displayCollections.length === 0) {
    console.log('CategoryProductsGrouped: No displayCollections for', categorySlug);
    return null;
  }

  console.log('CategoryProductsGrouped: Rendering sliders for', categoryData.name);
  console.log('CategoryProductsGrouped: Available collections count:', collections.length);
  console.log('CategoryProductsGrouped: Display collections:', categoryData.displayCollections.map(c => c.name));
  
  // Log which collections we can find
  categoryData.displayCollections.forEach(dc => {
    const found = collections.find(c => c.slug === dc.slug);
    console.log(`  - "${dc.name}" (${dc.slug}): ${found ? `FOUND (ID: ${found._id})` : 'NOT FOUND'}`);
  });

  return (
    <Animated.ScrollView
      style={styles.mainScrollView}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Header Content (Banner, Delivery, Quick Reorder) */}
      {ListHeaderComponent}
      
      {/* Collection Sliders - one for each displayCollection */}
      <View style={styles.container}>
        {categoryData.displayCollections.map((displayCol) => (
          <CollectionRow
            key={displayCol.slug}
            collectionSlug={displayCol.slug}
            collectionName={displayCol.name}
            collectionIcon={displayCol.icon}
            collectionIconType={displayCol.iconType}
            collectionColor={displayCol.color}
            allCollections={collections}
            onProductPress={onProductPress}
          />
        ))}
      </View>
      
      {/* Footer Content (Recently Viewed) */}
      {ListFooterComponent}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  mainScrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Category container styles
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Card styles
  card: {
    width: 130,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
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
    color: theme.colors.accent,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 12,
  },
});

export default CategoryProductsGrouped;
