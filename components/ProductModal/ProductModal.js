import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WixMediaImage } from '../../WixMediaImage';
import { wixCient } from '../../authentication/wixClient';
import { theme } from '../../styles/theme';
import { addToRecentlyViewed, getRecentlyViewed } from '../../utils/recentlyViewed';
import { isFavorite, toggleFavorite, subscribeFavorites } from '../../services/favorites';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.85;
const IMAGE_SIZE = 120; // 1:1 ratio small image

export const ProductModal = ({ 
  visible, 
  product: initialProduct, 
  onClose, 
  collectionId,
  onViewCart 
}) => {
  // Current product being displayed (can change when tapping similar/recent products)
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isProductFavorite, setIsProductFavorite] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  // Track quantities for similar and recently viewed products
  const [similarQuantities, setSimilarQuantities] = useState({});
  const [recentQuantities, setRecentQuantities] = useState({});
  const queryClient = useQueryClient();

  // Update currentProduct when initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setCurrentProduct(initialProduct);
    }
  }, [initialProduct]);

  // Reset quantity when product changes and add to recently viewed
  useEffect(() => {
    setQuantity(1);
    setSelectedOptions({});
    setAddedToCart(false);
    
    // Add product to recently viewed when modal opens
    if (visible && currentProduct) {
      // Check if product is favorite
      isFavorite(currentProduct._id).then(setIsProductFavorite);
      
      addToRecentlyViewed(currentProduct).then(() => {
        // Fetch updated recently viewed list
        getRecentlyViewed().then(items => {
          // Filter out current product
          setRecentlyViewed(items.filter(p => p._id !== currentProduct._id).slice(0, 6));
        });
      });
    }
  }, [currentProduct?._id, visible]);

  // Subscribe to favorites changes
  useEffect(() => {
    const unsubscribe = subscribeFavorites(async () => {
      if (currentProduct?._id) {
        const isFav = await isFavorite(currentProduct._id);
        setIsProductFavorite(isFav);
      }
    });
    return unsubscribe;
  }, [currentProduct?._id]);

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (currentProduct) {
      await toggleFavorite(currentProduct);
      const isFav = await isFavorite(currentProduct._id);
      setIsProductFavorite(isFav);
    }
  };

  // Handle switching to a different product (from similar/recently viewed)
  const handleSwitchProduct = useCallback((newProduct) => {
    setCurrentProduct(newProduct);
    setQuantity(1);
    setSelectedOptions({});
    setAddedToCart(false);
  }, []);

  // Get the product's primary collection ID (first one in array)
  const productCollectionId = currentProduct?.collectionIds?.[0] || collectionId;

  // Fetch similar products based on the product's own category
  const { data: similarProducts = [] } = useQuery({
    queryKey: ['similarProducts', productCollectionId, currentProduct?._id],
    queryFn: async () => {
      try {
        if (!productCollectionId) {
          // Fallback: get random products if no collection ID
          const response = await wixCient.products.queryProducts().limit(10).find();
          return (response?.items || []).filter(p => p._id !== currentProduct?._id).slice(0, 6);
        }
        // Fetch products from the same collection as the selected product
        const response = await wixCient.products
          .queryProducts()
          .hasSome('collectionIds', [productCollectionId])
          .limit(10)
          .find();
        return (response?.items || []).filter(p => p._id !== currentProduct?._id).slice(0, 6);
      } catch (error) {
        console.log('Similar products error:', error);
        return [];
      }
    },
    enabled: visible && !!currentProduct,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      // Build line items array with main product and selected similar/recent products
      const lineItems = [
        {
          quantity,
          catalogReference: {
            appId: '1380b703-ce81-ff05-f115-39571d94dfcd',
            catalogItemId: currentProduct._id,
            options: Object.keys(selectedOptions).length > 0 
              ? { options: selectedOptions } 
              : undefined,
          },
        },
      ];

      // Add similar products with quantities > 0
      Object.entries(similarQuantities).forEach(([productId, qty]) => {
        if (qty > 0) {
          lineItems.push({
            quantity: qty,
            catalogReference: {
              appId: '1380b703-ce81-ff05-f115-39571d94dfcd',
              catalogItemId: productId,
            },
          });
        }
      });

      // Add recently viewed products with quantities > 0
      Object.entries(recentQuantities).forEach(([productId, qty]) => {
        if (qty > 0) {
          lineItems.push({
            quantity: qty,
            catalogReference: {
              appId: '1380b703-ce81-ff05-f115-39571d94dfcd',
              catalogItemId: productId,
            },
          });
        }
      });

      return wixCient.currentCart.addToCurrentCart({ lineItems });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['currentCart'], response.cart);
      // Close modal after adding to cart
      onClose();
    },
    onError: (error) => {
      console.log('Add to cart error:', error);
    },
  });

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const getPrice = () => {
    const priceAmount = Number.parseFloat(currentProduct?.priceData?.price) || 0;
    return priceAmount * quantity;
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  if (!visible) return null;
  if (!currentProduct) return null;

  const price = getPrice();
  const unitPrice = Number.parseFloat(currentProduct?.priceData?.price) || 0;
  
  // Get stock information
  const stockQuantity = currentProduct?.stock?.quantity;
  const inStock = currentProduct?.stock?.inStock !== false;
  const trackInventory = currentProduct?.stock?.trackQuantity !== false;
  const isOutOfStock = stockQuantity === 0 || (trackInventory && !inStock);
  const isLowStock = stockQuantity !== undefined && stockQuantity <= 2 && stockQuantity > 0;
  const description = currentProduct?.description?.replace(/<[^>]*>/g, '')?.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
              <Ionicons 
                name={isProductFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isProductFavorite ? "#E53935" : theme.colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Product Header with Small Image */}
            <View style={styles.productHeader}>
              <WixMediaImage
                media={currentProduct.media?.mainMedia?.image?.url}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
              >
                {({ url }) => (
                  <Image 
                    source={{ uri: url }} 
                    style={styles.productImage}
                  />
                )}
              </WixMediaImage>
              
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {currentProduct.name}
                </Text>
                <Text style={styles.productPrice}>
                  {currentProduct.priceData?.formatted?.price || formatPrice(unitPrice)}
                </Text>
                
                {/* Stock Quantity Display */}
                {trackInventory && stockQuantity !== undefined && (
                  <View style={styles.stockContainer}>
                    <Text style={[
                      styles.stockText,
                      isOutOfStock && styles.stockTextOutOfStock,
                      isLowStock && styles.stockTextLow
                    ]}>
                      {isOutOfStock 
                        ? 'Out of Stock' 
                        : `${stockQuantity} left in stock`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Description Section */}
            {description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionTitle}>About this product</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled
                  ]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={quantity <= 1 ? theme.colors.textMuted : theme.colors.text} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{quantity}</Text>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(1)}
                >
                  <Ionicons name="add" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Product Options (if any) */}
            {currentProduct.productOptions?.length > 0 && (
              <View style={styles.optionsSection}>
                {currentProduct.productOptions.map((option) => (
                  <View key={option.name} style={styles.optionGroup}>
                    <Text style={styles.optionTitle}>{option.name}</Text>
                    <View style={styles.optionChoices}>
                      {option.choices?.map((choice) => (
                        <TouchableOpacity
                          key={choice.description}
                          style={[
                            styles.optionChip,
                            selectedOptions[option.name] === choice.description && 
                              styles.optionChipSelected
                          ]}
                          onPress={() => {
                            setSelectedOptions(prev => ({
                              ...prev,
                              [option.name]: choice.description
                            }));
                          }}
                        >
                          <Text style={[
                            styles.optionChipText,
                            selectedOptions[option.name] === choice.description && 
                              styles.optionChipTextSelected
                          ]}>
                            {choice.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.sectionTitle}>You May Also Like</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarContainer}
                >
                  {similarProducts.map((item) => (
                    <SimilarProductCardWithQuantity 
                      key={item._id} 
                      product={item}
                      quantity={similarQuantities[item._id] || 0}
                      onQuantityChange={(delta) => {
                        setSimilarQuantities(prev => ({
                          ...prev,
                          [item._id]: Math.max(0, (prev[item._id] || 0) + delta)
                        }));
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recently Viewed Products */}
            {recentlyViewed.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.sectionTitle}>Recently Viewed</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarContainer}
                >
                  {recentlyViewed.map((item) => (
                    <SimilarProductCardWithQuantity 
                      key={item._id} 
                      product={item}
                      quantity={recentQuantities[item._id] || 0}
                      onQuantityChange={(delta) => {
                        setRecentQuantities(prev => ({
                          ...prev,
                          [item._id]: Math.max(0, (prev[item._id] || 0) + delta)
                        }));
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Spacer for bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Add to Cart Footer */}
          <View style={styles.footer}>
            {isOutOfStock ? (
              <View style={[styles.addToCartButton, styles.outOfStockButton]}>
                <Text style={styles.outOfStockButtonText}>Out of Stock</Text>
              </View>
            ) : addedToCart ? (
              <View style={[styles.addToCartButton, styles.addedToCartButton]}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.addToCartText}>Added to Cart!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  addToCartMutation.isPending && styles.addToCartButtonLoading
                ]}
                onPress={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.addToCartContent}>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityBadgeText}>{quantity}</Text>
                    </View>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                    <Text style={styles.addToCartPrice}>{formatPrice(price)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Similar Product Card Component - With +/- buttons
const SimilarProductCardWithQuantity = ({ product, quantity, onQuantityChange }) => {
  const price = product.priceData?.formatted?.price || 
    `$${Number.parseFloat(product.priceData?.price || 0).toFixed(2)}`;

  return (
    <View style={styles.similarCard}>
      <WixMediaImage
        media={product.media?.mainMedia?.image?.url}
        width={80}
        height={80}
      >
        {({ url }) => (
          <Image 
            source={{ uri: url }} 
            style={styles.similarImage}
          />
        )}
      </WixMediaImage>
      <Text style={styles.similarName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.similarPrice}>{price}</Text>
      
      {/* Quantity Controls */}
      <View style={styles.similarQuantityContainer}>
        <TouchableOpacity
          style={[styles.similarQuantityButton, quantity === 0 && styles.similarQuantityButtonDisabled]}
          onPress={() => onQuantityChange(-1)}
          disabled={quantity === 0}
        >
          <Ionicons 
            name="remove" 
            size={16} 
            color={quantity === 0 ? theme.colors.textMuted : theme.colors.text} 
          />
        </TouchableOpacity>
        <Text style={styles.similarQuantityText}>{quantity}</Text>
        <TouchableOpacity
          style={styles.similarQuantityButton}
          onPress={() => onQuantityChange(1)}
        >
          <Ionicons name="add" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  headerButtons: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  productHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 24,
  },
  productImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  stockContainer: {
    marginTop: 4,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  stockTextLow: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  stockTextOutOfStock: {
    color: '#9E9E9E',
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  quantitySection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  optionChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionChipSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  optionChipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  optionChipTextSelected: {
    color: theme.colors.textLight,
  },
  similarSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  similarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  similarCard: {
    width: 100,
    marginRight: 12,
  },
  similarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  similarName: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent,
    marginBottom: 6,
  },
  similarQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 4,
  },
  similarQuantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarQuantityButtonDisabled: {
    opacity: 0.4,
  },
  similarQuantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addToCartButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addToCartButtonLoading: {
    opacity: 0.8,
  },
  outOfStockButton: {
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockButtonText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  addedToCartButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quantityBadgeText: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  addToCartText: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartPrice: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductModal;
