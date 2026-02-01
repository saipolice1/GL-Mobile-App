import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';
import { WixMediaImage } from '../../WixMediaImage';

import { CATEGORIES_DATA } from './CategoryBarWithIcons';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

// Helper to check if product is in stock
const isProductInStock = (product) => {
  const stockQuantity = product?.stock?.quantity;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  return stockQuantity !== 0 && inStock;
};

// Helper to find collection with multiple matching strategies
const findMatchingCollection = (collections, selectedCategory) => {
  // Direct slug match
  let collection = collections.find(c => c.slug === selectedCategory);
  if (collection) return { collection, collectionIds: [collection._id] };
  
  // Get category data
  const categoryData = CATEGORIES_DATA.find(cat => cat.slug === selectedCategory);
  
  // Build search terms
  const searchTerms = [
    selectedCategory,
    selectedCategory.replace(/-/g, ' '),
    selectedCategory.replace(/-/g, ''),
    categoryData?.name?.toLowerCase(),
  ].filter(Boolean);
  
  // Try to find matching collection
  collection = collections.find(c => {
    const cSlug = c.slug?.toLowerCase() || '';
    const cName = c.name?.toLowerCase() || '';
    return searchTerms.some(term => 
      cSlug === term || cSlug.includes(term) || 
      cName === term || cName.includes(term) ||
      term.includes(cSlug) || term.includes(cName)
    );
  });
  
  if (collection) return { collection, collectionIds: [collection._id] };
  
  // For categories with displayCollections, gather all their collection IDs for banner products
  if (categoryData?.displayCollections && categoryData.displayCollections.length > 0) {
    const displayCollectionIds = [];
    
    for (const displayCol of categoryData.displayCollections) {
      const matchedCollection = collections.find(c => c.slug === displayCol.slug);
      if (matchedCollection) {
        displayCollectionIds.push(matchedCollection._id);
      }
    }
    
    if (displayCollectionIds.length > 0) {
      return { collection: null, collectionIds: displayCollectionIds };
    }
  }
  
  return { collection: null, collectionIds: [] };
};

const ProductBannerItem = ({ product, onPress }) => {
  const price = product?.priceData?.formatted?.price || product?.price?.formatted?.price || '';
  const originalPrice = product?.priceData?.formatted?.discountedPrice !== product?.priceData?.formatted?.price 
    ? product?.priceData?.formatted?.discountedPrice 
    : null;
  const imageUrl = product?.media?.mainMedia?.image?.url;
  
  // Get inventory count
  const stockQuantity = product?.stock?.quantity || product?.inventoryItem?.quantity;
  const showLowStock = stockQuantity && stockQuantity <= 10 && stockQuantity > 0;
  
  return (
    <TouchableOpacity 
      style={styles.bannerItem}
      onPress={() => onPress(product)}
      activeOpacity={0.95}
    >
      <View style={styles.bannerContent}>
        {/* Left side - Product info */}
        <View style={styles.productInfo}>
          {showLowStock && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>Only {stockQuantity} left!</Text>
            </View>
          )}
          <Text style={styles.productName} numberOfLines={2}>{product?.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{price}</Text>
            {originalPrice && (
              <Text style={styles.originalPrice}>{originalPrice}</Text>
            )}
          </View>
          <View style={styles.shopNowContainer}>
            <Text style={styles.shopNowText}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.accent} />
          </View>
        </View>
        
        {/* Right side - Product image */}
        <View style={styles.imageContainer}>
          <WixMediaImage media={imageUrl} width={140} height={160}>
            {({ url }) => (
              <Image 
                source={{ uri: url }} 
                style={styles.productImage}
                resizeMode="contain"
              />
            )}
          </WixMediaImage>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HeroBanner = ({ onProductPress, selectedCategory = 'trending', collections = [] }) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch products relevant to selected category - ONLY IN STOCK ITEMS
  const { data: featuredProducts = [], isFetching } = useQuery({
    queryKey: ['bannerProducts', selectedCategory],
    queryFn: async () => {
      try {
        // First, get all collections
        const collectionsRes = await wixCient.collections.queryCollections().find();
        const allCollections = collectionsRes?.items || [];
        
        // Find collection based on selected category
        if (selectedCategory === 'trending' || selectedCategory === 'all-products') {
          // For trending/all, show best sellers or trending products
          const targetCollection = allCollections.find(c => 
            c.slug === 'trending' || 
            c.slug === 'best-sellers' || 
            c.slug === 'popular' ||
            c.name?.toLowerCase().includes('best') ||
            c.name?.toLowerCase().includes('trending')
          );
          
          if (targetCollection) {
            const response = await wixCient.products
              .queryProducts()
              .hasSome('collectionIds', [targetCollection._id])
              .limit(20)
              .find();
            if (response?.items?.length > 0) {
              const inStockItems = response.items.filter(isProductInStock);
              const shuffled = [...inStockItems].sort(() => Math.random() - 0.5);
              return shuffled.slice(0, 6);
            }
          }
        } else {
          // Use improved matching for categories with displayCollections
          const { collectionIds } = findMatchingCollection(allCollections, selectedCategory);
          
          console.log(`HeroBanner: Looking for "${selectedCategory}", found ${collectionIds.length} collection(s)`);
          
          if (collectionIds.length > 0) {
            const response = await wixCient.products
              .queryProducts()
              .hasSome('collectionIds', collectionIds)
              .limit(20)
              .find();
            if (response?.items?.length > 0) {
              const inStockItems = response.items.filter(isProductInStock);
              const shuffled = [...inStockItems].sort(() => Math.random() - 0.5);
              console.log(`HeroBanner: Found ${inStockItems.length} in-stock products for "${selectedCategory}"`);
              return shuffled.slice(0, 6);
            }
          }
        }
        
        // Fallback: get random products from all
        const response = await wixCient.products
          .queryProducts()
          .limit(30)
          .find();
        
        // Filter to only in-stock items, shuffle and return random 6
        const inStockItems = (response?.items || []).filter(isProductInStock);
        const shuffled = [...inStockItems].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 6);
      } catch (error) {
        console.log('Banner products fetch error:', error);
        return [];
      }
    },
  });

  // Smooth fade animation when category changes
  useEffect(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Reset carousel position
      setCurrentIndex(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  // Auto scroll
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % featuredProducts.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, featuredProducts.length]);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (width - 32));
    if (index !== currentIndex && index >= 0 && index < featuredProducts.length) {
      setCurrentIndex(index);
    }
  };

  const handleProductPress = (product) => {
    if (onProductPress) {
      onProductPress(product);
    }
  };

  // Loading placeholder banner
  const LoadingBanner = () => (
    <View style={styles.bannerItem}>
      <View style={styles.bannerContent}>
        <View style={styles.productInfo}>
          <View style={styles.loadingBadge} />
          <View style={styles.loadingTitle} />
          <View style={styles.loadingPrice} />
          <View style={styles.loadingButton} />
        </View>
        <View style={styles.imageContainer}>
          <View style={styles.loadingImage} />
        </View>
      </View>
    </View>
  );

  // Show loading state instead of hiding
  if (isFetching || featuredProducts.length === 0) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.flatListContent}>
          <LoadingBanner />
        </View>
        <View style={styles.pagination}>
          {[0, 1, 2].map((_, index) => (
            <View
              key={index}
              style={[styles.paginationDot, index === 0 && styles.paginationDotActive]}
            />
          ))}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <FlatList
        ref={flatListRef}
        data={featuredProducts}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={width - 32}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <ProductBannerItem product={item} onPress={handleProductPress} />
        )}
        getItemLayout={(data, index) => ({
          length: width - 32,
          offset: (width - 32) * index,
          index,
        })}
      />
      
      {/* Pagination dots */}
      {featuredProducts.length > 1 && (
        <View style={styles.pagination}>
          {featuredProducts.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  bannerItem: {
    width: width - 32,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // Loading placeholder styles
  loadingBadge: {
    width: 80,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: 10,
  },
  loadingTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  loadingPrice: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  loadingButton: {
    width: 80,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  loadingImage: {
    width: 120,
    height: 140,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stockBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  soldOutBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textMuted: {
    color: theme.colors.textMuted,
    opacity: 0.6,
  },
  imageGrayedOut: {
    opacity: 0.4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  shopNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  imageContainer: {
    width: 140,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 130,
    height: 150,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: theme.colors.accent,
  },
});
