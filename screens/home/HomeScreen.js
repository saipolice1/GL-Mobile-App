import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LogoHeader } from '../../components/Home/LogoHeader';
import { CategoryBarWithIcons, CATEGORIES_DATA } from '../../components/Home/CategoryBarWithIcons';
import { DeliveryProgressBar } from '../../components/Home/DeliveryProgressBar';
import { ProductGrid } from '../../components/Home/ProductGrid';
import { ProductFilter } from '../../components/Home/ProductFilter';
import { HeroBanner } from '../../components/Home/HeroBanner';
import { RecentlyViewedSection } from '../../components/Home/RecentlyViewedSection';
import { QuickReorderSection } from '../../components/Home/QuickReorderSection';
import { CategoryProductsSection } from '../../components/Home/CategoryProductsSection';
import { CategoryProductsGrouped } from '../../components/Home/CategoryProductsGrouped';
import { ProductModal } from '../../components/ProductModal/ProductModal';
import { WishlistModal } from '../../components/Wishlist/WishlistModal';
import { NotificationsModal } from '../../components/Notifications/NotificationsModal';
import { ViewAllModal } from '../../components/ViewAllModal/ViewAllModal';
import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';
import { getBestSellers, listRecommendationAlgorithms } from '../../utils/wixRecommendations';
import Routes from '../../routes/routes';

// Height threshold for logo to disappear
const LOGO_SCROLL_THRESHOLD = 50;

export const HomeScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [viewAllData, setViewAllData] = useState(null);
  const [currentCollectionId, setCurrentCollectionId] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [filterBy, setFilterBy] = useState('all');
  const queryClient = useQueryClient();
  
  // Track scroll for logo visibility
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animated opacity for logo - fades out on scroll
  const logoOpacity = scrollY.interpolate({
    inputRange: [0, LOGO_SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // Animated height for logo container
  const logoHeight = scrollY.interpolate({
    inputRange: [0, LOGO_SCROLL_THRESHOLD],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  });
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Fetch current cart to get total
  const { data: currentCart } = useQuery({
    queryKey: ['currentCart'],
    queryFn: async () => {
      try {
        return await wixCient.currentCart.getCurrentCart();
      } catch (error) {
        // Cart not found is OK
        if (error?.message?.includes('OWNED_CART_NOT_FOUND')) {
          return null;
        }
        console.log('Cart fetch error:', error);
        return null;
      }
    },
    // Real-time cart updates
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false,
    staleTime: 25000,
  });

  // Calculate cart total
  const cartTotal = currentCart?.lineItems?.reduce((acc, item) => {
    return acc + (Number.parseFloat(item.price?.amount) || 0) * item.quantity;
  }, 0) || 0;

  // Fetch collections from Wix
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      try {
        const response = await wixCient.collections.queryCollections().find();
        // Log all collections for debugging
        console.log('=== WIX COLLECTIONS ===');
        response?.items?.forEach(c => console.log(`Name: "${c.name}" | Slug: "${c.slug}" | ID: ${c._id}`));
        console.log('=======================');
        return response?.items || [];
      } catch (error) {
        console.log('Collections fetch error:', error);
        return [];
      }
    },
  });

  // Fetch products based on selected category
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', selectedCategory, collections],
    queryFn: async () => {
      try {
        // Helper function to fetch all products with pagination
        const fetchAllProducts = async (queryBuilder, maxProducts = 1000) => {
          let allProducts = [];
          let offset = 0;
          const pageSize = 100; // Wix max per request
          
          while (allProducts.length < maxProducts) {
            const response = await queryBuilder
              .skip(offset)
              .limit(pageSize)
              .find();
            
            const items = response?.items || [];
            if (items.length === 0) break;
            
            allProducts = [...allProducts, ...items];
            offset += pageSize;
            
            // If we got less than pageSize, we've reached the end
            if (items.length < pageSize) break;
          }
          
          console.log(`Fetched ${allProducts.length} total products`);
          return allProducts;
        };

        if (selectedCategory === 'trending') {
          // Use Wix Recommendations API for best sellers
          
          // Get best sellers using the Recommendations API (21 products)
          const bestSellers = await getBestSellers(21);
          
          if (bestSellers.length > 0) {
            return bestSellers;
          }
          
          // Fallback: this should not happen as getBestSellers has its own fallback
          return [];
        } else {
          // Find collection by slug
          let collection = collections.find(c => c.slug === selectedCategory);
          
          // If not found, try multiple matching strategies
          if (!collection) {
            const categoryData = CATEGORIES_DATA.find(cat => cat.slug === selectedCategory);
            
            // Skip if this category uses displayCollections (handled by CategoryProductsGrouped)
            if (categoryData?.displayCollections) {
              return []; // CategoryProductsGrouped handles this
            }
            
            // Strategy 2: Try different slug formats
            const searchTerms = [
              selectedCategory,
              selectedCategory.replace(/-/g, ' '),
              selectedCategory.replace(/-/g, ''),
              categoryData?.name?.toLowerCase(),
            ].filter(Boolean);
            
            // Try to find a matching collection
            collection = collections.find(c => {
              const cSlug = c.slug?.toLowerCase() || '';
              const cName = c.name?.toLowerCase() || '';
              return searchTerms.some(term => 
                cSlug === term || 
                cSlug.includes(term) || 
                cName === term ||
                cName.includes(term) ||
                term.includes(cSlug) ||
                term.includes(cName)
              );
            });
          }
          
          // Strategy 3: For simple categories without displayCollections, try parent slug matching
          if (!collection) {
            const categoryData = CATEGORIES_DATA.find(cat => cat.slug === selectedCategory);
            
            // Skip if this category uses displayCollections (handled by CategoryProductsGrouped)
            if (categoryData?.displayCollections) {
              return []; // CategoryProductsGrouped handles this
            }
            
            // Try finding parent collection by name similarity
            const parentSearchTerms = [
              categoryData?.slug,
              categoryData?.slug?.replace(/-/g, ' '),
              categoryData?.name?.toLowerCase(),
            ].filter(Boolean);
            
            const parentCollection = collections.find(c => {
              const cSlug = c.slug?.toLowerCase() || '';
              const cName = c.name?.toLowerCase() || '';
              return parentSearchTerms.some(term => 
                cSlug === term || cSlug.includes(term) || 
                cName === term || cName.includes(term)
              );
            });
            
            if (parentCollection) {
              console.log(`Matched parent collection: "${parentCollection.name}"`);
              const response = await wixCient.products
                .queryProducts()
                .hasSome('collectionIds', [parentCollection._id])
                .limit(100)
                .find();
              return response?.items || [];
            }
          }
          
          if (collection) {
            // Check if it's "All Products" collection - use pagination
            if (collection.slug === 'all-products' || collection._id === '00000000-000000-000000-000000000001') {
              console.log('Fetching ALL products with pagination...');
              const allProducts = await fetchAllProducts(
                wixCient.products.queryProducts()
              );
              return allProducts;
            }
            
            // For other collections, fetch with higher limit
            const response = await wixCient.products
              .queryProducts()
              .hasSome('collectionIds', [collection._id])
              .limit(100)
              .find();
            console.log(`Collection "${collection.name}": Found ${response?.items?.length || 0} products`);
            return response?.items || [];
          }
          
          // Fallback: fetch all products with pagination
          console.log('No collection found, fetching all products with pagination');
          const allProducts = await fetchAllProducts(
            wixCient.products.queryProducts()
          );
          return allProducts;
        }
      } catch (error) {
        console.log('Products fetch error:', error);
        return [];
      }
    },
    enabled: true,
    // Real-time inventory updates
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when app is in background
    staleTime: 25000, // Consider data stale after 25 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Apply sorting and filtering to products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Apply filter
    if (filterBy === 'in-stock') {
      result = result.filter(p => p.stock?.inStock !== false && p.stock?.quantity !== 0);
    } else if (filterBy === 'on-sale') {
      result = result.filter(p => p.priceData?.discountedPrice && 
        Number(p.priceData?.discountedPrice) < Number(p.priceData?.price));
    }

    // Apply sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => 
          (Number(a.priceData?.price) || 0) - (Number(b.priceData?.price) || 0)
        );
        break;
      case 'price-high':
        result.sort((a, b) => 
          (Number(b.priceData?.price) || 0) - (Number(a.priceData?.price) || 0)
        );
        break;
      case 'name-az':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-za':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default:
        break;
    }

    return result;
  }, [products, sortBy, filterBy]);

  const handleCategorySelect = useCallback((slug) => {
    setSelectedCategory(slug);
    // Reset filters when changing category
    setSortBy('default');
    setFilterBy('all');
  }, []);

  // Find collection ID for current category
  const getCurrentCollectionId = useCallback(() => {
    if (selectedCategory === 'trending') {
      const trendingCollection = collections.find(c => 
        c.slug === 'trending' || 
        c.slug === 'best-sellers' || 
        c.name?.toLowerCase().includes('trending') ||
        c.name?.toLowerCase().includes('best seller')
      );
      return trendingCollection?._id;
    }
    const collection = collections.find(c => c.slug === selectedCategory);
    return collection?._id;
  }, [selectedCategory, collections]);

  const handleProductPress = useCallback((product) => {
    setSelectedProduct(product);
    setCurrentCollectionId(getCurrentCollectionId());
    setProductModalVisible(true);
  }, [getCurrentCollectionId]);

  const handleCloseModal = useCallback(() => {
    setProductModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const handleViewCart = useCallback(() => {
    navigation.navigate(Routes.Cart);
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate(Routes.Search);
  }, [navigation]);

  // Handle wishlist press
  const handleWishlistPress = useCallback(() => {
    setWishlistModalVisible(true);
  }, []);

  // Handle notifications press
  const handleNotificationsPress = useCallback(() => {
    setNotificationsModalVisible(true);
  }, []);

  // Handle wishlist item press - receives already converted product from WishlistModal
  const handleWishlistItemPress = useCallback((product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  }, []);

  // Handle View All press from subcategory sliders
  const handleViewAll = useCallback((data) => {
    // data contains: { name, products, icon, iconType, color }
    setViewAllData(data);
    setViewAllModalVisible(true);
  }, []);

  // Handle product press from ViewAllModal - no longer used, ViewAllModal has its own ProductModal
  const handleViewAllProductPress = useCallback((product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  }, []);

  // Find current category name from CATEGORIES_DATA
  const currentCategory = CATEGORIES_DATA.find(c => c.slug === selectedCategory);
  const currentCategoryName = currentCategory?.name || 'Products';
  
  // Check if we're in trending category
  const isBestSellersCategory = selectedCategory === 'trending';

  // Handle banner product press
  const handleBannerProductPress = useCallback((product) => {
    // Find new arrivals collection
    const newArrivalsCollection = collections.find(c => 
      c.slug === 'new' || 
      c.slug === 'new-arrivals' || 
      c.name?.toLowerCase().includes('new arrival')
    );
    setSelectedProduct(product);
    setCurrentCollectionId(newArrivalsCollection?._id);
    setProductModalVisible(true);
  }, [collections]);

  // Check if we're showing "All" category with grouped display
  const isAllCategory = selectedCategory === 'all-products';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Fixed Header - Always visible at top */}
      <View style={styles.fixedHeader}>
        {/* Logo - fades on scroll */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, height: logoHeight }]}>
          <LogoHeader compact onWishlistPress={handleWishlistPress} onNotificationsPress={handleNotificationsPress} />
        </Animated.View>
        
        {/* Category Slider - Always visible */}
        <CategoryBarWithIcons 
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        
        {/* Filter Options */}
        <ProductFilter
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterBy}
          productCount={filteredAndSortedProducts.length}
        />
      </View>
      
      {/* Scrollable Content */}
      {(() => {
        // Check if current category has displayCollections (sliders for sub-collections)
        const categoryData = CATEGORIES_DATA.find(c => c.slug === selectedCategory);
        const hasDisplayCollections = categoryData?.displayCollections && categoryData.displayCollections.length > 0;
        
        return hasDisplayCollections && !isAllCategory ? (
          // Use grouped view for categories with displayCollections (Beers, Whiskey, Wines)
          <CategoryProductsGrouped
            collections={collections}
            categorySlug={selectedCategory}
            CATEGORIES_DATA={CATEGORIES_DATA}
            onProductPress={handleProductPress}
            onViewAll={handleViewAll}
            isLoading={isLoadingProducts}
            onScroll={handleScroll}
            ListHeaderComponent={
              <View>
                {/* Product Banner */}
                <HeroBanner 
                  onProductPress={handleBannerProductPress} 
                  selectedCategory={selectedCategory}
                  collections={collections}
                />
                
                {/* Delivery Progress */}
                <DeliveryProgressBar cartTotal={cartTotal} />
                
                {/* Quick Reorder */}
                <QuickReorderSection onProductPress={handleProductPress} />
              </View>
            }
            ListFooterComponent={
              <View>
                {/* Recently Viewed */}
                <RecentlyViewedSection onProductPress={handleProductPress} />
              </View>
            }
          />
        ) : (
          // Use regular grid for simple categories or "All" category
          <ProductGrid
            products={isAllCategory ? [] : filteredAndSortedProducts}
            onProductPress={handleProductPress}
            onAddToCart={handleProductPress}
            isLoading={isLoadingProducts}
            categoryName={isAllCategory ? null : currentCategoryName}
            isBestSellersCategory={isBestSellersCategory}
            hideEmptyMessage={isAllCategory}
            onScroll={handleScroll}
            ListHeaderComponent={
              <View>
                {/* Product Banner - relevant to category */}
                <HeroBanner 
                  onProductPress={handleBannerProductPress} 
                  selectedCategory={selectedCategory}
                  collections={collections}
                />
                
                {/* Delivery Progress */}
                <DeliveryProgressBar cartTotal={cartTotal} />
                
                {/* Quick Reorder */}
                <QuickReorderSection onProductPress={handleProductPress} />
                
                {/* All Category - Grouped by category with sliders */}
                {isAllCategory && (
                  <CategoryProductsSection
                    allProducts={products}
                    collections={collections}
                    onProductPress={handleProductPress}
                    onCategorySelect={handleCategorySelect}
                  />
                )}
              </View>
            }
            ListFooterComponent={
              <View>
                {/* Recently Viewed - show for all categories EXCEPT "All" */}
                {!isAllCategory && (
                  <RecentlyViewedSection onProductPress={handleProductPress} />
                )}
              </View>
            }
          />
        );
      })()}

      {/* Product Modal */}
      <ProductModal
        visible={productModalVisible}
        product={selectedProduct}
        onClose={handleCloseModal}
        collectionId={currentCollectionId}
        onViewCart={handleViewCart}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        visible={wishlistModalVisible}
        onClose={() => setWishlistModalVisible(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />

      {/* View All Modal - for subcategory products */}
      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => {
          setViewAllModalVisible(false);
          setViewAllData(null);
        }}
        products={viewAllData?.products || []}
        categoryName={viewAllData?.name || 'Products'}
        categoryIcon={viewAllData?.icon}
        categoryIconType={viewAllData?.iconType}
        categoryColor={viewAllData?.color}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedHeader: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E5E5',
  },
  logoContainer: {
    overflow: 'hidden',
  },
});
