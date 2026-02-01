import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { 
  getFavorites, 
  removeFromFavorites, 
  subscribeFavorites,
  getFavoritesCount 
} from '../../services/favorites';
import { getWixClient } from '../../authentication/wixClient';
import { useQueryClient } from '@tanstack/react-query';

const { width, height } = Dimensions.get('window');

// Wishlist Item - Row style with add to cart and proper stock display
const WishlistItem = ({ item, onRemove, onPress, onAddToCart, isAddingToCart }) => {
  const isOutOfStock = item.inStock === false || item.stockQuantity === 0;
  const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;
  const hasDiscount = item.discountedPrice && 
    item.discountedPrice !== item.price && 
    item.discountedPrice !== '';
  
  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => onPress?.(item)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={[styles.itemImage, isOutOfStock && styles.imageGrayedOut]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="wine" size={24} color={theme.colors.textMuted} />
            </View>
          )}
          {/* Sold Out Badge on Image */}
          {isOutOfStock && (
            <View style={styles.soldOutOverlay}>
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>SOLD OUT</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>
            {item.name}
          </Text>
          
          {/* Price Row */}
          <View style={styles.priceRow}>
            {hasDiscount ? (
              <>
                <Text style={styles.discountedPrice}>{item.discountedPrice}</Text>
                <Text style={styles.originalPrice}>{item.price}</Text>
              </>
            ) : (
              <Text style={[styles.itemPrice, isOutOfStock && styles.textGrayedOut]}>{item.price}</Text>
            )}
          </View>
          
          {/* Stock Status */}
          {isOutOfStock ? (
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.stockText}>Out of Stock</Text>
            </View>
          ) : isLowStock ? (
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.stockText, { color: '#F59E0B' }]}>Only {item.stockQuantity} left - Fast Selling!</Text>
            </View>
          ) : (
            <Text style={styles.inStockText}>In Stock</Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isOutOfStock ? (
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => onAddToCart(item)}
            disabled={isAddingToCart}
            activeOpacity={0.7}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="cart" size={16} color="#FFF" />
                <Text style={styles.addToCartText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.soldOutButton}>
            <Text style={styles.soldOutButtonText}>Unavailable</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Empty State Component
const EmptyWishlist = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="heart-outline" size={64} color={theme.colors.textMuted} />
    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
    <Text style={styles.emptyText}>
      Tap the heart icon on products to save them here
    </Text>
  </View>
);

// Wishlist Modal Component
export const WishlistModal = ({ visible, onClose, onProductPress, onViewCart }) => {
  const [favorites, setFavorites] = useState([]);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const queryClient = useQueryClient();

  // Load favorites on mount and subscribe to changes
  useEffect(() => {
    loadFavorites();
    const unsubscribe = subscribeFavorites((newFavorites) => {
      setFavorites(newFavorites);
    });
    return unsubscribe;
  }, []);

  // Reload when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadFavorites();
    }
  }, [visible]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const handleRemove = async (productId) => {
    await removeFromFavorites(productId);
  };

  const handleProductPress = (item) => {
    onProductPress?.(item);
    onClose();
  };

  const handleAddToCart = async (item) => {
    setAddingToCartId(item.id);
    try {
      const wixClient = await getWixClient();
      const response = await wixClient.currentCart.addToCurrentCart({
        lineItems: [{
          catalogReference: {
            catalogItemId: item.id,
            appId: '1380b703-ce81-ff05-f115-39571d94dfcd'
          },
          quantity: 1
        }]
      });
      
      // Update the cart cache
      queryClient.setQueryData(['currentCart'], response.cart);
      
      // Optionally navigate to cart
      if (onViewCart) {
        onClose();
        onViewCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCartId(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Center Modal Panel */}
        <View style={styles.centeredModalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>My Wishlist</Text>
              <Text style={styles.itemCount}>
                {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          {favorites.length === 0 ? (
            <EmptyWishlist />
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WishlistItem 
                  item={item} 
                  onRemove={handleRemove}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAddingToCart={addingToCartId === item.id}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Wishlist Button Component (for header)
export const WishlistButton = ({ onPress }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();
    const unsubscribe = subscribeFavorites(async () => {
      loadCount();
    });
    return unsubscribe;
  }, []);

  const loadCount = async () => {
    const c = await getFavoritesCount();
    setCount(c);
  };

  return (
    <TouchableOpacity 
      style={styles.wishlistButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="heart-outline" size={24} color={theme.colors.text} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centeredModalContent: {
    width: '90%',
    maxHeight: height * 0.8,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  // Item styles - row layout
  itemContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textGrayedOut: {
    color: theme.colors.textMuted,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  originalPrice: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  inStockText: {
    fontSize: 12,
    color: theme.colors.success || '#10B981',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 6,
    minWidth: 100,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  soldOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  soldOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  removeButton: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 25,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  // Wishlist button styles
  wishlistButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default WishlistModal;
