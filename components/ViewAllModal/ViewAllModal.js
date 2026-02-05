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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { WixMediaImage } from '../../WixMediaImage';
import { EmbeddedProductModal } from '../ProductModal/EmbeddedProductModal';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
// Full width modal now, so use full screen width
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

// Product Card for grid display
const GridProductCard = ({ product, onPress, trendingProductIds = [] }) => {
  const price = product?.priceData?.formatted?.price || 
    `$${Number.parseFloat(product?.priceData?.price || 0).toFixed(2)}`;
  
  const stockQuantity = product?.stock?.quantity;
  const inStock = product?.stock?.inStock !== false && product?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isInTrendingList = trendingProductIds.includes(product?._id);
  
  // Also check for known trending product names as a fallback
  const hasKnownTrendingName = product?.name && (
    product.name.toLowerCase().includes('absolut') ||
    product.name.toLowerCase().includes('jim beam') ||
    product.name.toLowerCase().includes('jameson') ||
    product.name.toLowerCase().includes('canadian club')
  );
  
  const isTrending = isInTrendingList || hasKnownTrendingName || product?.ribbon === 'Best Seller' || product?.ribbons?.length > 0;

  // Show BOTH badges - trending on top-left, low stock on bottom-left
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock;

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
            <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
          </View>
        )}

        {/* Add to cart button - tapping opens product modal */}
        {!isOutOfStock && (
          <TouchableOpacity 
            style={styles.addButtonContainer}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
          >
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color={theme.colors.secondary} style={{ fontWeight: 'bold' }} />
            </View>
          </TouchableOpacity>
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
  categoryIconType = 'material',
  categoryColor = theme.colors.text,
  trendingProductIds = [],
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleProductModalClose = () => {
    setProductModalVisible(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Render icon based on type
  const renderIcon = () => {
    if (!categoryIcon) return null;
    if (categoryIconType === 'ionicons') {
      return <Ionicons name={categoryIcon} size={20} color={categoryColor} />;
    }
    return <MaterialCommunityIcons name={categoryIcon} size={20} color={categoryColor} />;
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
                {categoryIcon && (
                  <View style={[styles.headerIcon, { backgroundColor: categoryColor + '20' }]}>
                    {renderIcon()}
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
                    trendingProductIds={trendingProductIds}
                  />
                )}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Embedded Product Modal - renders inside ViewAllModal */}
        <EmbeddedProductModal
          visible={productModalVisible}
          product={selectedProduct}
          onClose={handleProductModalClose}
        />
      </Modal>
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
    maxHeight: height * 0.9,
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
});

export default ViewAllModal;
