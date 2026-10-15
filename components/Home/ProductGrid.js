import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native';
import { ProductCard } from './ProductCard';
import { theme } from '../../styles/theme';
import { SkeletonGrid, SkeletonProductCard, useShimmer } from './SkeletonProductCard';
import { TAB_BAR_CLEARANCE } from '../../constants/layout';

export const ProductGrid = ({ 
  products, 
  onProductPress, 
  onAddToCart,
  isLoading,
  categoryName,
  ListHeaderComponent,
  ListFooterComponent,
  isBestSellersCategory = false,
  onScroll,
  hideEmptyMessage = false,
  trendingProductIds = [],
  onRefresh,
  refreshing,
}) => {
  const { width } = useWindowDimensions();
  const isRefreshing = Boolean(refreshing);
  const shimmer = useShimmer(isRefreshing);
  const skeletonCardWidth = (width - 64) / 3;

  // Placeholder items shown in the grid while a pull-to-refresh is in progress
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        _id: `__skeleton_${index}`,
        __skeleton: true,
      })),
    []
  );

  if (isLoading) {
    return (
      <SkeletonGrid />
    );
  }

  const renderItem = ({ item }) =>
    item.__skeleton ? (
      <SkeletonProductCard cardWidth={skeletonCardWidth} shimmer={shimmer} />
    ) : (
      <ProductCard
        product={item}
        onPress={onProductPress}
        onAddToCart={onAddToCart}
        isBestSeller={isBestSellersCategory}
        trendingProductIds={trendingProductIds}
      />
    );

  const renderHeader = () => (
    <View>
      {ListHeaderComponent}
      {categoryName && (
        <View style={styles.headerContainer}>
          <Text style={styles.categoryTitle}>
            {isBestSellersCategory ? '🔥 ' : ''}{categoryName}
          </Text>
          <Text style={styles.productCount}>{products?.length || 0} items</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    // Don't show "No products found" if hideEmptyMessage is true
    if (hideEmptyMessage) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={isRefreshing ? skeletonItems : products}
      renderItem={renderItem}
      keyExtractor={(item, index) => item._id || item.id || String(index)}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={renderEmpty}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.text}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: TAB_BAR_CLEARANCE,
    backgroundColor: theme.colors.background,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  headerContainer: {
    paddingVertical: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
});
