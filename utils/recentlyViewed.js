import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_VIEWED_KEY = '@recently_viewed_products';
const MAX_RECENTLY_VIEWED = 10;

/**
 * Get recently viewed products from local storage
 */
export const getRecentlyViewed = async () => {
  try {
    const data = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error getting recently viewed:', error);
    return [];
  }
};

/**
 * Add a product to recently viewed list
 * Stores minimal product data to save space
 */
export const addToRecentlyViewed = async (product) => {
  try {
    if (!product || !product._id) return;

    const existing = await getRecentlyViewed();
    
    // Remove if already exists (we'll add to front)
    const filtered = existing.filter(p => p._id !== product._id);
    
    // Create minimal product data
    const minimalProduct = {
      _id: product._id,
      name: product.name,
      priceData: {
        price: product.priceData?.price,
        formatted: product.priceData?.formatted,
      },
      media: {
        mainMedia: {
          image: {
            url: product.media?.mainMedia?.image?.url,
          },
        },
      },
      stock: product.stock,
      collectionIds: product.collectionIds,
      viewedAt: Date.now(),
    };
    
    // Add to front of list
    const updated = [minimalProduct, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.log('Error adding to recently viewed:', error);
    return [];
  }
};

/**
 * Clear recently viewed products
 */
export const clearRecentlyViewed = async () => {
  try {
    await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.log('Error clearing recently viewed:', error);
  }
};

export default {
  getRecentlyViewed,
  addToRecentlyViewed,
  clearRecentlyViewed,
};
