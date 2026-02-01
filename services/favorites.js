/**
 * Favorites/Wishlist Service
 * 
 * Manages user's favorite products using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@grafton_favorites';

// Event listeners for favorites changes
let listeners = [];

/**
 * Subscribe to favorites changes
 */
export const subscribeFavorites = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

/**
 * Notify all listeners of changes
 */
const notifyListeners = (favorites) => {
  listeners.forEach(callback => callback(favorites));
};

/**
 * Get all favorite product IDs
 */
export const getFavorites = async () => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Check if a product is in favorites
 */
export const isFavorite = async (productId) => {
  const favorites = await getFavorites();
  return favorites.some(fav => fav.id === productId);
};

/**
 * Add a product to favorites
 */
export const addToFavorites = async (product) => {
  try {
    const favorites = await getFavorites();
    
    // Check if already exists
    if (favorites.some(fav => fav.id === product._id)) {
      return favorites;
    }
    
    // Get stock info
    const stockQuantity = product.stock?.quantity;
    const inStock = product.stock?.inStock !== false && 
                    product.stock?.inventoryStatus !== 'OUT_OF_STOCK' &&
                    stockQuantity !== 0;
    
    // Check if there's a real discount (prices are different)
    const price = product.priceData?.formatted?.price || product.price?.formatted?.price || '';
    const discountedPrice = product.priceData?.formatted?.discountedPrice || product.price?.formatted?.discountedPrice || '';
    const hasRealDiscount = discountedPrice && discountedPrice !== price && discountedPrice !== '';
    
    // Add new favorite with minimal data
    const favoriteItem = {
      id: product._id,
      name: product.name,
      price: price,
      discountedPrice: hasRealDiscount ? discountedPrice : '', // Only store if different
      image: product.media?.mainMedia?.image?.url || product.media?.items?.[0]?.image?.url || null,
      slug: product.slug,
      inStock: inStock,
      stockQuantity: stockQuantity ?? null,
      addedAt: new Date().toISOString(),
    };
    
    const newFavorites = [...favorites, favoriteItem];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    notifyListeners(newFavorites);
    
    console.log('✅ Added to favorites:', product.name);
    return newFavorites;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return await getFavorites();
  }
};

/**
 * Remove a product from favorites
 */
export const removeFromFavorites = async (productId) => {
  try {
    const favorites = await getFavorites();
    const newFavorites = favorites.filter(fav => fav.id !== productId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    notifyListeners(newFavorites);
    
    console.log('🗑️ Removed from favorites:', productId);
    return newFavorites;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return await getFavorites();
  }
};

/**
 * Toggle favorite status for a product
 */
export const toggleFavorite = async (product) => {
  const productId = product._id || product.id;
  const isCurrentlyFavorite = await isFavorite(productId);
  
  if (isCurrentlyFavorite) {
    return await removeFromFavorites(productId);
  } else {
    return await addToFavorites(product);
  }
};

/**
 * Clear all favorites
 */
export const clearFavorites = async () => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    notifyListeners([]);
    return [];
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return await getFavorites();
  }
};

/**
 * Get favorites count
 */
export const getFavoritesCount = async () => {
  const favorites = await getFavorites();
  return favorites.length;
};

export default {
  getFavorites,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  clearFavorites,
  getFavoritesCount,
  subscribeFavorites,
};
