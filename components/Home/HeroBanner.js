import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, FlatList, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { IS_TABLET, rs } from '../../utils/responsive';
import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';
import { WixMediaImage } from '../../WixMediaImage';

import { CATEGORIES_DATA } from './CategoryBarWithIcons';

const { width: INITIAL_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = IS_TABLET ? 240 : 200;

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

const ProductBannerItem = ({ product, onPress, bannerWidth }) => {
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
      style={[styles.bannerItem, { width: bannerWidth }]}
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
          <WixMediaImage media={imageUrl} width={rs(140)} height={rs(160)}>
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
  const { width } = useWindowDimensions();
  const bannerWidth = width - 32;

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
          
          if (collectionIds.length > 0) {
            const response = await wixCient.products
              .queryProducts()
              .hasSome('collectionIds', collectionIds)
              .limit(20)
              .find();
            if (response?.items?.length > 0) {
              const inStockItems = response.items.filter(isProductInStock);
              const shuffled = [...inStockItems].sort(() => Math.random() - 0.5);
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

  // Build looped data: [last, ...items, first] for infinite scroll
  const loopedData = React.useMemo(() => {
    if (featuredProducts.length < 2) return featuredProducts;
    return [
      { ...featuredProducts[featuredProducts.length - 1], _loopKey: 'clone-last' },
      ...featuredProducts,
      { ...featuredProducts[0], _loopKey: 'clone-first' },
    ];
  }, [featuredProducts]);

  const isAutoScrolling = React.useRef(false);

  // Smooth fade animation when category changes
  useEffect(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Reset carousel position to first real item (index 1 in looped data)
      setCurrentIndex(0);
      if (featuredProducts.length >= 2) {
        flatListRef.current?.scrollToOffset({ offset: bannerWidth, animated: false });
      } else {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
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
    if (featuredProducts.length < 2) return;
    
    const interval = setInterval(() => {
      isAutoScrolling.current = true;
      // currentIndex is 0-based real index; in looped data the real items start at offset 1
      const loopedIndex = currentIndex + 1; // current position in looped array
      const nextLoopedIndex = loopedIndex + 1;
      flatListRef.current?.scrollToOffset({ offset: nextLoopedIndex * bannerWidth, animated: true });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, featuredProducts.length, bannerWidth]);

  // Initialize scroll position to first real item (index 1 in looped data)
  useEffect(() => {
    if (featuredProducts.length >= 2) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: bannerWidth, animated: false });
      }, 50);
    }
  }, [featuredProducts.length, bannerWidth]);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    if (featuredProducts.length < 2) {
      const index = Math.round(contentOffset / bannerWidth);
      if (index !== currentIndex && index >= 0 && index < featuredProducts.length) {
        setCurrentIndex(index);
      }
      return;
    }

    const loopedIndex = Math.round(contentOffset / bannerWidth);
    const totalReal = featuredProducts.length;

    if (loopedIndex === 0) {
      // Scrolled to the prepended clone (last item clone) — jump to real last item
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: totalReal * bannerWidth, animated: false });
        isAutoScrolling.current = false;
      }, 300);
      setCurrentIndex(totalReal - 1);
    } else if (loopedIndex === totalReal + 1) {
      // Scrolled to the appended clone (first item clone) — jump to real first item
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: bannerWidth, animated: false });
        isAutoScrolling.current = false;
      }, 300);
      setCurrentIndex(0);
    } else {
      // Normal real item
      const realIndex = loopedIndex - 1;
      if (realIndex !== currentIndex && realIndex >= 0 && realIndex < totalReal) {
        setCurrentIndex(realIndex);
      }
      isAutoScrolling.current = false;
    }
  };

  const handleProductPress = (product) => {
    if (onProductPress) {
      onProductPress(product);
    }
  };

  // Loading placeholder banner
  const LoadingBanner = () => (
    <View style={[styles.bannerItem, { width: bannerWidth }]}>
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
        data={loopedData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item._loopKey || item._id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <ProductBannerItem product={item} onPress={handleProductPress} bannerWidth={bannerWidth} />
        )}
        getItemLayout={(data, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
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
    fontSize: IS_TABLET ? 20 : 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: IS_TABLET ? 28 : 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: IS_TABLET ? 24 : 20,
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
    width: rs(140),
    height: rs(160),
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: rs(130),
    height: rs(150),
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
