import React, { useState, useCallback } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { CategoryProductSplit, CATEGORIES_DATA } from '../../../components/Home/CategoryProductSplit';
import { theme } from '../../../styles/theme';
import { wixCient } from '../../../authentication/wixClient';
import Routes from '../../../routes/routes';

export const CategoriesScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('best-sellers');

  // Fetch collections from Wix
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

  // Fetch products based on selected category
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', selectedCategory, collections],
    queryFn: async () => {
      try {
        if (selectedCategory === 'best-sellers') {
          const response = await wixCient.products.queryProducts().limit(20).find();
          return response?.items || [];
        } else {
          // Find collection by slug
          const collection = collections.find(c => c.slug === selectedCategory);
          
          if (collection) {
            const response = await wixCient.products
              .queryProducts()
              .hasSome('collectionIds', [collection._id])
              .limit(50)
              .find();
            return response?.items || [];
          }
          
          // Fallback: fetch all and return
          const response = await wixCient.products
            .queryProducts()
            .limit(50)
            .find();
          return response?.items || [];
        }
      } catch (error) {
        console.log('Products fetch error:', error);
        return [];
      }
    },
    enabled: true,
  });

  const handleCategorySelect = useCallback((slug) => {
    setSelectedCategory(slug);
  }, []);

  const handleProductPress = useCallback((product) => {
    navigation.navigate(Routes.Product, { product });
  }, [navigation]);

  const handleAddToCart = useCallback((product) => {
    console.log('Add to cart:', product.name);
  }, []);

  // Check if we're in best sellers category
  const isBestSellersCategory = selectedCategory === 'best-sellers';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <View style={styles.titleText}>
            </View>
          </View>
        </View>
      </View>
      
      <CategoryProductSplit
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        products={products}
        onProductPress={handleProductPress}
        onAddToCart={handleAddToCart}
        isLoading={isLoadingProducts}
        isBestSellersCategory={isBestSellersCategory}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
