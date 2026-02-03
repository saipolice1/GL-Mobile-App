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
  subscribeFavorites,
  getFavoritesCount 
} from '../../services/favorites';
import { EmbeddedProductModal } from '../ProductModal/EmbeddedProductModal';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
// Full width modal now, so use full screen width
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

// Grid Product Card for wishlist
const WishlistGridCard = ({ item, onPress }) => {
  const isOutOfStock = item.inStock === false || item.stockQuantity === 0;
  const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;
  const isTrending = item.isTrending || item.ribbon === 'Best Seller';

  // Show BOTH badges - trending on top-left, low stock on bottom-left
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock;

  return (
    <TouchableOpacity 
      style={styles.gridCard} 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={[styles.cardImage, isOutOfStock && styles.imageGrayedOut]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="wine" size={24} color={theme.colors.textMuted} />
          </View>
        )}
        
        {/* Out of Stock Badge */}
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
            <Text style={styles.lowStockText}>Only {item.stockQuantity} left</Text>
          </View>
        )}

        {/* Add to cart indicator - tapping opens product modal */}
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButtonContainer}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color={theme.colors.secondary} style={{ fontWeight: 'bold' }} />
            </View>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.cardName, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.cardPrice, isOutOfStock && styles.textGrayedOut]}>
        {item.discountedPrice && item.discountedPrice !== item.price ? item.discountedPrice : item.price}
      </Text>
    </TouchableOpacity>
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

// Convert wishlist item to product format for ProductModal
const convertToProduct = (item) => ({
  _id: item.id,
  name: item.name,
  description: item.description || '',
  priceData: {
    price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || 0),
    formatted: { price: item.price }
  },
  media: {
    mainMedia: {
      image: { url: item.image }
    }
  },
  stock: {
    quantity: item.stockQuantity,
    inStock: item.inStock !== false,
    inventoryStatus: item.inStock === false ? 'OUT_OF_STOCK' : 'IN_STOCK'
  },
  ribbon: item.ribbon,
  ribbons: item.ribbons,
  collectionIds: item.collectionIds || [],
});

// Wishlist Modal Component with Grid Layout
export const WishlistModal = ({ visible, onClose }) => {
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

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

  const handleProductPress = (item) => {
    // Convert wishlist item to product format and open embedded product modal
    const product = convertToProduct(item);
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleProductModalClose = () => {
    setProductModalVisible(false);
    setTimeout(() => setSelectedProduct(null), 300);
    // Reload favorites in case user unfavorited from product modal
    loadFavorites();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          
          {/* Modal Content - slides from bottom */}
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="heart" size={22} color={theme.colors.error} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>My Wishlist</Text>
                  <Text style={styles.itemCount}>
                    {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Products Grid */}
            {favorites.length === 0 ? (
              <EmptyWishlist />
            ) : (
              <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                renderItem={({ item }) => (
                  <WishlistGridCard 
                    item={item}
                    onPress={handleProductPress}
                  />
                )}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Embedded Product Modal - renders inside WishlistModal */}
        <EmbeddedProductModal
          visible={productModalVisible}
          product={selectedProduct}
          onClose={handleProductModalClose}
        />
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    height: height * 0.85,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  itemCount: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  gridContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  cardImage: {
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  lowStockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  lowStockText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendingBadge: {
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
  addButtonContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 6,
    lineHeight: 14,
  },
  cardPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 3,
  },
  textGrayedOut: {
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
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
