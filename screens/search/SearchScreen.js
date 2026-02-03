import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../styles/theme';
import { wixCient } from '../../authentication/wixClient';
import { ProductModal } from '../../components/ProductModal/ProductModal';
import { CATEGORIES_DATA } from '../../components/Home/CategoryBarWithIcons';
import Routes from '../../routes/routes';

const { width } = Dimensions.get('window');
// 3 columns with spacing
const PRODUCT_WIDTH = (width - 48) / 3 - 6;

// Filter/Sort options
const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A-Z' },
  { value: 'name-za', label: 'Name: Z-A' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'in-stock', label: 'In Stock Only' },
  { value: 'on-sale', label: 'On Sale' },
];

const ProductCard = ({ product, onPress, onAddToCart, isBestSeller = false }) => {
  const imageUrl = product?.media?.mainMedia?.image?.url 
    || product?.media?.items?.[0]?.image?.url
    || 'https://via.placeholder.com/200';
  
  const price = product?.priceData?.formatted?.price 
    || product?.convertedPriceData?.formatted?.price
    || '$0.00';
  
  const name = product?.name || 'Product';

  // Check if product is out of stock
  const stockQuantity = product?.stock?.quantity ?? product?.stock?.trackQuantity 
    ? product?.stock?.quantity 
    : undefined;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  
  // Check for low stock and trending
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isTrending = isBestSeller || product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;
  
  // Show BOTH badges - trending on top-left, low stock on bottom-left
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock;

  return (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => onPress?.(product)}
      activeOpacity={0.9}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.productImage, isOutOfStock && styles.productImageGrayedOut]}
          resizeMode="cover"
        />
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
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onAddToCart?.(product)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={12} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, isOutOfStock && styles.productNameGrayedOut]} numberOfLines={2}>{name}</Text>
        <Text style={[styles.productPrice, isOutOfStock && styles.productPriceGrayedOut]}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Category chip for filtering
const CategoryChip = ({ category, isSelected, onPress }) => {
  const IconComponent = category.iconType === 'material' ? MaterialCommunityIcons : Ionicons;
  
  return (
    <TouchableOpacity
      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
      onPress={() => onPress(category.slug)}
      activeOpacity={0.7}
    >
      <IconComponent 
        name={category.icon} 
        size={14} 
        color={isSelected ? '#FFF' : (category.color || theme.colors.text)} 
      />
      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

export const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = all
  const [sortBy, setSortBy] = useState('default');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      try {
        const response = await wixCient.collections.queryCollections().find();
        return response?.items || [];
      } catch (error) {
        console.log('Collections fetch error:', error);
        return [];
      }
    },
  });

  // Fetch all products with pagination
  const { data: allProducts = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      try {
        let allItems = [];
        let offset = 0;
        const pageSize = 100;
        
        while (true) {
          const response = await wixCient.products
            .queryProducts()
            .skip(offset)
            .limit(pageSize)
            .find();
          
          const items = response?.items || [];
          if (items.length === 0) break;
          
          allItems = [...allItems, ...items];
          offset += pageSize;
          
          if (items.length < pageSize) break;
          if (allItems.length >= 1000) break;
        }
        
        console.log(`SearchScreen: Fetched ${allItems.length} total products`);
        return allItems;
      } catch (error) {
        console.log('Products fetch error:', error);
        return [];
      }
    },
  });

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];

    // Apply search filter
    if (debouncedQuery.length > 0) {
      result = result.filter(product => 
        product.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      const collection = collections.find(c => c.slug === selectedCategory);
      if (collection) {
        result = result.filter(product => 
          product.collectionIds?.includes(collection._id)
        );
      }
    }

    // Apply stock/sale filter
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
  }, [allProducts, debouncedQuery, selectedCategory, collections, sortBy, filterBy]);

  const handleProductPress = useCallback((product) => {
    Keyboard.dismiss();
    setSelectedProduct(product);
    setProductModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setProductModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const handleViewCart = useCallback(() => {
    navigation.navigate(Routes.Cart);
  }, [navigation]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(selectedCategory === slug ? null : slug);
  };

  const renderProduct = ({ item }) => (
    <ProductCard 
      product={item} 
      onPress={handleProductPress}
      onAddToCart={handleProductPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsTitle}>
        {debouncedQuery.length > 0 
          ? `Results for "${debouncedQuery}"` 
          : selectedCategory 
            ? CATEGORIES_DATA.find(c => c.slug === selectedCategory)?.name || 'Products'
            : 'All Products'}
      </Text>
      <Text style={styles.resultsCount}>{filteredAndSortedProducts.length} items</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {debouncedQuery.length > 0 ? (
        <>
          <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>Try a different search term</Text>
        </>
      ) : (
        <>
          <Ionicons name="bag-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Products</Text>
          <Text style={styles.emptyText}>Try adjusting your filters</Text>
        </>
      )}
    </View>
  );

  // Categories for filter (exclude trending and all-products)
  const filterCategories = CATEGORIES_DATA.filter(
    c => c.slug !== 'trending' && c.slug !== 'all-products'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search beers, wines, spirits..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Toggle */}
        <TouchableOpacity 
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="options-outline" 
            size={18} 
            color={showFilters ? '#FFF' : theme.colors.text} 
          />
          <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryChipsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          {filterCategories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.slug}
              onPress={handleCategorySelect}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sort & Filter Options */}
      {showFilters && (
        <View style={styles.filterOptions}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterChip, sortBy === option.value && styles.filterChipActive]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text style={[styles.filterChipText, sortBy === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Show:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterChip, filterBy === option.value && styles.filterChipActive]}
                  onPress={() => setFilterBy(option.value)}
                >
                  <Text style={[styles.filterChipText, filterBy === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Results */}
      {isLoadingAll ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          numColumns={3}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        />
      )}

      {/* Product Modal */}
      <ProductModal
        visible={productModalVisible}
        product={selectedProduct}
        onClose={handleCloseModal}
        collectionId={null}
        onViewCart={handleViewCart}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  filterToggleActive: {
    backgroundColor: theme.colors.secondary,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterToggleTextActive: {
    color: '#FFF',
  },
  categoryChipsWrapper: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.secondary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  filterOptions: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 10,
    width: 55,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  productCard: {
    width: PRODUCT_WIDTH,
    marginBottom: 12,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageGrayedOut: {
    opacity: 0.4,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trendingBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fireEmoji: {
    fontSize: 10,
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  lowStockText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productInfo: {
    paddingTop: 4,
    paddingHorizontal: 1,
  },
  productName: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 14,
    marginBottom: 2,
  },
  productNameGrayedOut: {
    color: theme.colors.textMuted,
  },
  productPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  productPriceGrayedOut: {
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
