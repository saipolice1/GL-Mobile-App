import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ProductCard } from './ProductCard';
import { theme } from '../../styles/theme';

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
}) => {
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  const renderItem = ({ item }) => (
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
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => item._id || item.id || Math.random().toString()}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={renderEmpty}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
