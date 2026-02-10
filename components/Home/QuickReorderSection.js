import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { IS_TABLET, rs } from '../../utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { WixMediaImage } from '../../WixMediaImage';
import { wixCient } from '../../authentication/wixClient';
import { theme } from '../../styles/theme';

const QuickReorderCard = ({ product, onPress }) => {
  const price = product.priceData?.formatted?.price || 
    `$${Number.parseFloat(product.priceData?.price || 0).toFixed(2)}`;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <WixMediaImage
        media={product.media?.mainMedia?.image?.url}
        width={rs(80)}
        height={rs(80)}
      >
        {({ url }) => (
          <Image 
            source={{ uri: url }} 
            style={styles.image}
          />
        )}
      </WixMediaImage>
      <View style={styles.reorderBadge}>
        <MaterialCommunityIcons name="repeat" size={12} color="#FFFFFF" />
      </View>
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.price}>{price}</Text>
    </TouchableOpacity>
  );
};

export const QuickReorderSection = ({ onProductPress }) => {
  // Fetch user's order history from Wix
  const { data: orderProducts = [], isLoading, error } = useQuery({
    queryKey: ['quickReorder'],
    queryFn: async () => {
      try {
        // Get user's orders
        const ordersResponse = await wixCient.orders.searchOrders({
          search: {
            cursorPaging: {
              limit: 5
            }
          }
        });
        
        const orders = ordersResponse?.orders || [];
        
        if (orders.length === 0) {
          return [];
        }

        // Extract unique product IDs from orders
        const productIds = new Set();
        orders.forEach(order => {
          order.lineItems?.forEach(item => {
            if (item.catalogReference?.catalogItemId) {
              productIds.add(item.catalogReference.catalogItemId);
            }
          });
        });

        if (productIds.size === 0) {
          return [];
        }

        // Fetch product details for those IDs
        const productsResponse = await wixCient.products.queryProducts()
          .hasSome('_id', Array.from(productIds))
          .limit(10)
          .find();

        return productsResponse?.items || [];
      } catch (error) {
        // Check if it's a permission error
        const isPermissionError = 
          error?.details?.applicationError?.code === 'READ_ORDER_FORBIDDEN' ||
          error?.message?.toLowerCase().includes('permission denied') ||
          error?.message?.toLowerCase().includes('forbidden');
        
        if (isPermissionError) {
          console.log('Orders permission not granted - Quick Reorder section will be hidden');
        } else {
          console.log('Quick reorder fetch error:', error);
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's a permission error
      const isPermissionError = 
        error?.details?.applicationError?.code === 'READ_ORDER_FORBIDDEN' ||
        error?.message?.toLowerCase().includes('permission denied') ||
        error?.message?.toLowerCase().includes('forbidden');
      
      if (isPermissionError) {
        return false; // Don't retry permission errors
      }
      return failureCount < 3; // Retry other errors up to 3 times
    },
  });

  // Don't show if no previous orders
  if (!isLoading && orderProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="repeat" size={20} color={theme.colors.primary} />
          <Text style={styles.title}>Order Again</Text>
        </View>
        <Text style={styles.subtitle}>Your previous purchases</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {orderProducts.map((product) => (
            <QuickReorderCard
              key={product._id}
              product={product}
              onPress={onProductPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#F0FDF4', // Light green background
    marginVertical: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginLeft: 28,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  card: {
    width: rs(100),
    marginHorizontal: 4,
    position: 'relative',
  },
  image: {
    width: rs(100),
    height: rs(100),
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  reorderBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: IS_TABLET ? 14 : 12,
    color: theme.colors.text,
    marginTop: 6,
    lineHeight: IS_TABLET ? 20 : 16,
  },
  price: {
    fontSize: IS_TABLET ? 15 : 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
});

export default QuickReorderSection;
