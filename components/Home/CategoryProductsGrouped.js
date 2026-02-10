import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { IS_TABLET, rs } from '../../utils/responsive';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WixMediaImage } from '../../WixMediaImage';
import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';

// Horizontal Product Card - matching CategoryProductsSection style
const HorizontalProductCard = ({ product, onPress, trendingProductIds = [] }) => {
  const price = product.priceData?.formatted?.price || 
    `$${Number.parseFloat(product.priceData?.price || 0).toFixed(2)}`;
  
  const stockQuantity = product?.stock?.quantity;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isInTrendingList = trendingProductIds.includes(product?._id);
  
  // Also check for known trending product names as a fallback
  const hasKnownTrendingName = product?.name && (
    product.name.toLowerCase().includes('absolut') ||
    product.name.toLowerCase().includes('jim beam') ||
    product.name.toLowerCase().includes('jameson') ||
    product.name.toLowerCase().includes('canadian club')
  );
  
  const isTrending = isInTrendingList || hasKnownTrendingName || product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;

  // Show BOTH badges - trending on top-left, low stock on bottom-left
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <WixMediaImage
          media={product.media?.mainMedia?.image?.url}
          width={rs(100)}
          height={rs(100)}
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
        {/* Trending Badge - Top Left */}
        {showTrending && (
          <View style={styles.trendingBadge}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
        )}
        {/* Low Stock Badge - Bottom Left */}
        {showLowStock && (
          <View style={styles.lowStockBadge}>
            <View style={styles.lowStockDot} />
            <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
          </View>
        )}
        {/* Smaller Add Button with muted color */}
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={theme.colors.secondary} style={{ fontWeight: 'bold' }} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.name, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>{product.name}</Text>
      <Text style={[styles.price, isOutOfStock && styles.textGrayedOut]}>{price}</Text>
    </TouchableOpacity>
  );
};

// Collection Row - fetches products from a SINGLE Wix collection by slug
const CollectionRow = ({ collectionSlug, collectionName, collectionIcon, collectionIconType, collectionColor, allCollections, onProductPress, onViewAll, trendingProductIds = [] }) => {
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
        {/* View All Button */}
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => onViewAll?.({
            name: collectionName,
            products: products,
            icon: iconName,
            iconType: iconType,
            color: iconColor,
          })}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.accent} />
        </TouchableOpacity>
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
            trendingProductIds={trendingProductIds}
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
  onViewAll,
  onScroll,
  ListHeaderComponent,
  ListFooterComponent,
  CATEGORIES_DATA = [],
  trendingProductIds = [],
}) => {
  // Find the category data
  const categoryData = CATEGORIES_DATA.find(c => c.slug === categorySlug);
  
  // Only render if this category has displayCollections defined
  if (!categoryData?.displayCollections || categoryData.displayCollections.length === 0) {
    return null;
  }

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
            onViewAll={onViewAll}
            trendingProductIds={trendingProductIds}
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Card styles
  card: {
    width: rs(100),
  },
  imageContainer: {
    width: rs(100),
    height: rs(100),
    borderRadius: 8,
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
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  lowStockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  lowStockText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendingBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fireEmoji: {
    fontSize: 10,
  },
  name: {
    fontSize: IS_TABLET ? 15 : 13,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 8,
    lineHeight: IS_TABLET ? 20 : 16,
  },
  price: {
    fontSize: IS_TABLET ? 16 : 14,
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
