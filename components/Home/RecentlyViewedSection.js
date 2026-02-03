import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WixMediaImage } from '../../WixMediaImage';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import { theme } from '../../styles/theme';

const RecentlyViewedCard = ({ product, onPress }) => {
  const price = product.priceData?.formatted?.price || 
    `$${Number.parseFloat(product.priceData?.price || 0).toFixed(2)}`;
  
  const stockQuantity = product?.stock?.quantity;
  const isOutOfStock = stockQuantity === 0 || product?.stock?.inStock === false;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isTrending = product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;

  // LOW STOCK takes priority - never show both badges
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock && !isLowStock;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <WixMediaImage
          media={product.media?.mainMedia?.image?.url}
          width={80}
          height={80}
        >
          {({ url }) => (
            <Image 
              source={{ uri: url }} 
              style={[styles.image, isOutOfStock && styles.imageGrayedOut]}
            />
          )}
        </WixMediaImage>
        {/* Low Stock Badge - Priority over Trending */}
        {showLowStock && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
          </View>
        )}
        {/* Trending Badge - Only if NOT low stock */}
        {showTrending && (
          <View style={styles.trendingBadge}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
        )}
      </View>
      <Text style={[styles.name, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>{product.name}</Text>
      <Text style={[styles.price, isOutOfStock && styles.textGrayedOut]}>{price}</Text>
    </TouchableOpacity>
  );
};

export const RecentlyViewedSection = ({ onProductPress }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    const items = await getRecentlyViewed();
    setProducts(items.slice(0, 6));
  };

  // Refresh when component re-mounts (user comes back to home)
  useEffect(() => {
    const interval = setInterval(loadRecentlyViewed, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={20} color={theme.colors.text} />
          <Text style={styles.title}>Recently Viewed</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
          <RecentlyViewedCard
            key={product._id}
            product={product}
            onPress={onProductPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
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
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: 100,
    marginHorizontal: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  imageGrayedOut: {
    opacity: 0.4,
  },
  textGrayedOut: {
    color: theme.colors.textMuted,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fireEmoji: {
    fontSize: 12,
  },
  name: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 6,
    lineHeight: 16,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
});

export default RecentlyViewedSection;
