import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');
// 3 columns with padding: (screenWidth - 32 horizontal padding - 16 gap total) / 3
const CARD_WIDTH = (width - 48) / 3;

export const ProductCard = ({ product, onPress, onAddToCart, isBestSeller = false }) => {
  const imageUrl = product?.media?.mainMedia?.image?.url 
    || product?.media?.items?.[0]?.image?.url
    || 'https://via.placeholder.com/200';
  
  const price = product?.priceData?.formatted?.price 
    || product?.convertedPriceData?.formatted?.price
    || '$0.00';
  
  const name = product?.name || 'Product';
  
  // Check if product is a best seller - from prop or ribbon data
  const showFireIcon = isBestSeller || product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;
  
  // Check if product is out of stock
  // Wix stock can be in stock.quantity or stock.inventoryStatus
  const stockQuantity = product?.stock?.quantity ?? product?.stock?.trackQuantity 
    ? product?.stock?.quantity 
    : undefined;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  
  // Check if product is low stock (selling fast) - show for items with 1-5 in stock
  const isLowStock = (stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5) ||
    (product?.stock?.inventoryStatus === 'PARTIALLY_OUT_OF_STOCK');

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(product)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, isOutOfStock && styles.imageGrayedOut]}
          resizeMode="cover"
        />
        {isOutOfStock && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
        {isLowStock && !isOutOfStock && (
          <View style={styles.sellingFastBadge}>
            <View style={styles.sellingFastDot} />
            <Text style={styles.sellingFastText}>
              {stockQuantity !== undefined ? `Only ${stockQuantity} left` : 'Selling Fast'}
            </Text>
          </View>
        )}
        {showFireIcon && !isOutOfStock && !isLowStock && (
          <View style={styles.bestSellerBadge}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
        )}
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onAddToCart?.(product)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGrayedOut: {
    opacity: 0.4,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  fireEmoji: {
    fontSize: 16,
  },
  sellingFastBadge: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sellingFastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  sellingFastText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  info: {
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 16,
    marginBottom: 3,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
