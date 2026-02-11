import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  StyleSheet, 
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { IS_TABLET, rs } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');
const CATEGORY_WIDTH = 85;
// 3 columns: available width minus category sidebar, divided by 3 with gap
const PRODUCT_WIDTH = (width - CATEGORY_WIDTH - 40) / 3;

// Category data with icons
export const CATEGORIES_DATA = [
  { 
    id: 'best-sellers', 
    name: 'Best Sellers', 
    slug: 'best-sellers', 
    icon: 'flame',
    iconType: 'ionicons',
    color: '#FF6B35',
  },
  { 
    id: 'beers', 
    name: 'Beers', 
    slug: 'beers', 
    icon: 'beer',
    iconType: 'material',
  },
  { 
    id: 'vodka', 
    name: 'Vodka', 
    slug: 'vodka', 
    icon: 'glass-cocktail',
    iconType: 'material',
  },
  { 
    id: 'gin', 
    name: 'Gin', 
    slug: 'gin', 
    icon: 'glass-tulip',
    iconType: 'material',
  },
  { 
    id: 'whiskey', 
    name: 'Whiskey', 
    slug: 'whiskey', 
    icon: 'glass-stange',
    iconType: 'material',
  },
  { 
    id: 'liqueur', 
    name: 'Liqueur', 
    slug: 'liqueur', 
    icon: 'bottle-wine',
    iconType: 'material',
  },
  { 
    id: 'tequila', 
    name: 'Tequila', 
    slug: 'tequila', 
    icon: 'glass-mug-variant',
    iconType: 'material',
  },
  { 
    id: 'champagne', 
    name: 'Champagne', 
    slug: 'champagne', 
    icon: 'glass-flute',
    iconType: 'material',
  },
  { 
    id: 'red-wines', 
    name: 'Red Wines', 
    slug: 'red-wines', 
    icon: 'glass-wine',
    iconType: 'material',
    color: '#722F37',
  },
  { 
    id: 'white-wines', 
    name: 'White Wines', 
    slug: 'white-wines', 
    icon: 'glass-wine',
    iconType: 'material',
    color: '#F5DEB3',
  },
  { 
    id: 'rtd', 
    name: 'RTD', 
    slug: 'rtd-pre-mixed', 
    icon: 'bottle-soda-classic',
    iconType: 'material',
  },
  { 
    id: 'rum', 
    name: 'Rum', 
    slug: 'rum', 
    icon: 'pirate',
    iconType: 'material',
  },
];

const CategoryIcon = ({ category, isSelected }) => {
  const iconColor = isSelected ? theme.colors.accent : (category.color || theme.colors.textMuted);
  const size = 22;
  
  if (category.iconType === 'ionicons') {
    return <Ionicons name={category.icon} size={size} color={iconColor} />;
  }
  return <MaterialCommunityIcons name={category.icon} size={size} color={iconColor} />;
};

// Left sidebar with categories
const CategorySidebar = ({ selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView 
      style={styles.sidebar}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sidebarContent}
    >
      {CATEGORIES_DATA.map((category) => {
        const isSelected = selectedCategory === category.slug;
        
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              isSelected && styles.categoryItemActive,
            ]}
            onPress={() => onSelectCategory(category.slug)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.categoryIconContainer,
              isSelected && styles.categoryIconContainerActive,
            ]}>
              <CategoryIcon category={category} isSelected={isSelected} />
            </View>
            <Text
              style={[
                styles.categoryText,
                isSelected && styles.categoryTextActive,
              ]}
              numberOfLines={2}
            >
              {category.name}
            </Text>
            {isSelected && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// Product card for the right side
const ProductCard = ({ product, onPress, onAddToCart, isBestSeller }) => {
  const imageUrl = product?.media?.mainMedia?.image?.url 
    || product?.media?.items?.[0]?.image?.url
    || 'https://via.placeholder.com/200';
  
  const price = product?.priceData?.formatted?.price 
    || product?.convertedPriceData?.formatted?.price
    || '$0.00';
  
  const name = product?.name || 'Product';
  const showFireIcon = isBestSeller || product?.ribbon === 'Best Seller';

  return (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => onPress?.(product)}
      activeOpacity={0.9}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {showFireIcon && (
          <View style={styles.bestSellerBadge}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onAddToCart?.(product)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={theme.colors.textLight} style={{ fontWeight: 'bold' }} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{name}</Text>
        <Text style={styles.productPrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Main split layout component
export const CategoryProductSplit = ({ 
  selectedCategory, 
  onSelectCategory,
  products = [],
  onProductPress,
  onAddToCart,
  isLoading,
  isBestSellersCategory,
}) => {
  
  const renderProduct = ({ item }) => (
    <ProductCard 
      product={item} 
      onPress={onProductPress}
      onAddToCart={onAddToCart}
      isBestSeller={isBestSellersCategory}
    />
  );

  const renderHeader = () => {
    const currentCategory = CATEGORIES_DATA.find(c => c.slug === selectedCategory);
    return (
      <View style={styles.productHeader}>
        <Text style={styles.productHeaderTitle}>
          {isBestSellersCategory ? '🔥 ' : ''}{currentCategory?.name || 'Products'}
        </Text>
        <Text style={styles.productCount}>{products.length} items</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No products found</Text>
    </View>
  );

  return (
    <View style={styles.splitContainer}>
      {/* Left: Categories */}
      <CategorySidebar 
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      
      {/* Right: Products */}
      <View style={styles.productsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            numColumns={3}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
  },
  
  // Sidebar styles
  sidebar: {
    width: CATEGORY_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  sidebarContent: {
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
  },
  categoryItemActive: {
    backgroundColor: theme.colors.background,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconContainerActive: {
    backgroundColor: '#E8F5E9',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryTextActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: theme.colors.accent,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  
  // Products container styles
  productsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  productHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  productCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  
  // Product card styles
  productCard: {
    width: PRODUCT_WIDTH,
    marginBottom: 12,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  fireEmoji: {
    fontSize: 12,
  },
  addButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: rs(28, 1.5),
    height: rs(28, 1.5),
    borderRadius: rs(14, 1.5),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: IS_TABLET ? 44 : 28,
    minHeight: IS_TABLET ? 44 : 28,
  },
  productInfo: {
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 16,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
