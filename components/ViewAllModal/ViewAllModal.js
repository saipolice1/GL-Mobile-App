import React, { useState } from 'react';
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
import { WixMediaImage } from '../../WixMediaImage';
import { ProductModal } from '../ProductModal/ProductModal';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width * 0.92 - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

// Product Card for grid display
const GridProductCard = ({ product, onPress }) => {
  const price = product?.priceData?.formatted?.price || 
    `$${Number.parseFloat(product?.priceData?.price || 0).toFixed(2)}`;
  
  const stockQuantity = product?.stock?.quantity;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isTrending = product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;

  return (
    <TouchableOpacity 
      style={styles.gridCard} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        <WixMediaImage
          media={product?.media?.mainMedia?.image?.url}
          width={CARD_WIDTH}
          height={CARD_WIDTH}
        >
          {({ url }) => (
            <Image 
              source={{ uri: url }} 
              style={[styles.cardImage, isOutOfStock && styles.imageGrayedOut]}
            />
          )}
        </WixMediaImage>
        
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
        
        {/* Low Stock Badge - Priority over Trending */}
        {isLowStock && !isOutOfStock && (
          <View style={styles.lowStockBadge}>
            <View style={styles.lowStockDot} />
            <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
          </View>
        )}
        
        {/* Trending Badge - Only if not low stock */}
        {isTrending && !isLowStock && !isOutOfStock && (
          <View style={styles.trendingBadge}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
        )}

        {/* Add to cart button */}
        {!isOutOfStock && (
          <View style={styles.addButtonContainer}>
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color="#FFF" />
            </View>
          </View>
        )}
      </View>
      <Text style={[styles.cardName, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>
        {product?.name}
      </Text>
      <Text style={[styles.cardPrice, isOutOfStock && styles.textGrayedOut]}>{price}</Text>
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyProducts = ({ categoryName }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="wine-outline" size={64} color={theme.colors.textMuted} />
    <Text style={styles.emptyTitle}>No products found</Text>
    <Text style={styles.emptyText}>
      {categoryName ? `No products available in ${categoryName}` : 'No products available'}
    </Text>
  </View>
);

// View All Modal Component
export const ViewAllModal = ({ 
  visible, 
  onClose, 
  products = [],
  categoryName = 'Products',
  categoryIcon = null,
  categoryColor = theme.colors.text,
  onAddToCart,
  onViewCart,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleProductModalClose = () => {
    setProductModalVisible(false);
    // Don't clear selectedProduct immediately to allow smooth animation
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleViewCart = () => {
    setProductModalVisible(false);
    onClose();
    onViewCart?.();
  };

  if (!visible) return null;

  return (
    <>
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
          
          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {categoryIcon && (
                  <View style={[styles.headerIcon, { backgroundColor: categoryColor + '20' }]}>
                    {categoryIcon}
                  </View>
                )}
                <View>
                  <Text style={styles.headerTitle}>{categoryName}</Text>
                  <Text style={styles.itemCount}>
                    {products.length} {products.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Products Grid */}
            {products.length === 0 ? (
              <EmptyProducts categoryName={categoryName} />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item._id || item.id}
                numColumns={COLUMN_COUNT}
                renderItem={({ item }) => (
                  <GridProductCard 
                    product={item}
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
      </Modal>

      {/* Product Modal - Opens on top of View All Modal */}
      <ProductModal
        visible={productModalVisible}
        product={selectedProduct}
        onClose={handleProductModalClose}
        onViewCart={handleViewCart}
      />
    </>
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
  modalContent: {
    width: '92%',
    maxHeight: height * 0.85,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
});

export default ViewAllModal;
