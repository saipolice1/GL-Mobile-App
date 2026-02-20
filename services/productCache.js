import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'CACHED_PRODUCTS';
const CACHE_TIMESTAMP_KEY = 'CACHED_PRODUCTS_TIMESTAMP';
const COLLECTIONS_CACHE_KEY = 'CACHED_COLLECTIONS';
const COLLECTIONS_TIMESTAMP_KEY = 'CACHED_COLLECTIONS_TIMESTAMP';

// Cache duration: 24 hours for full product data (images, descriptions, etc.)
// Inventory is always fetched fresh
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Save products to cache
 * @param {Array} products - Full product data from Wix
 */
export async function cacheProducts(products) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(products));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`📦 Cached ${products.length} products`);
  } catch (error) {
    console.log('Failed to cache products:', error.message);
  }
}

/**
 * Get cached products if available and not expired
 * @returns {Array|null} - Cached products or null if expired/unavailable
 */
export async function getCachedProducts() {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION_MS) {
      console.log('📦 Product cache expired');
      return null;
    }

    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const products = JSON.parse(cached);
    console.log(`📦 Loaded ${products.length} products from cache (${Math.round(age / 60000)}min old)`);
    return products;
  } catch (error) {
    console.log('Failed to get cached products:', error.message);
    return null;
  }
}

/**
 * Save collections to cache
 * @param {Array} collections - Collections data from Wix
 */
export async function cacheCollections(collections) {
  try {
    await AsyncStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(collections));
    await AsyncStorage.setItem(COLLECTIONS_TIMESTAMP_KEY, Date.now().toString());
    console.log(`📦 Cached ${collections.length} collections`);
  } catch (error) {
    console.log('Failed to cache collections:', error.message);
  }
}

/**
 * Get cached collections if available and not expired
 * @returns {Array|null} - Cached collections or null if expired/unavailable
 */
export async function getCachedCollections() {
  try {
    const timestamp = await AsyncStorage.getItem(COLLECTIONS_TIMESTAMP_KEY);
    if (!timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION_MS) {
      console.log('📦 Collections cache expired');
      return null;
    }

    const cached = await AsyncStorage.getItem(COLLECTIONS_CACHE_KEY);
    if (!cached) return null;

    const collections = JSON.parse(cached);
    console.log(`📦 Loaded ${collections.length} collections from cache`);
    return collections;
  } catch (error) {
    console.log('Failed to get cached collections:', error.message);
    return null;
  }
}

/**
 * Merge fresh inventory data into cached products
 * @param {Array} cachedProducts - Products from cache
 * @param {Array} inventoryItems - Fresh inventory from Wix
 * @returns {Array} - Products with updated inventory
 */
export function mergeInventory(cachedProducts, inventoryItems) {
  if (!inventoryItems || inventoryItems.length === 0) return cachedProducts;

  // Create inventory lookup map
  const inventoryMap = new Map();
  inventoryItems.forEach(item => {
    if (item.productId) {
      inventoryMap.set(item.productId, {
        inStock: item.trackQuantity ? item.quantity > 0 : true,
        quantity: item.quantity,
        trackQuantity: item.trackQuantity,
      });
    }
  });

  // Merge inventory into products
  return cachedProducts.map(product => {
    const inventory = inventoryMap.get(product._id);
    if (inventory) {
      return {
        ...product,
        stock: {
          ...product.stock,
          ...inventory,
        },
      };
    }
    return product;
  });
}

/**
 * Clear all product caches
 */
export async function clearProductCache() {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEY,
      CACHE_TIMESTAMP_KEY,
      COLLECTIONS_CACHE_KEY,
      COLLECTIONS_TIMESTAMP_KEY,
    ]);
    console.log('📦 Product cache cleared');
  } catch (error) {
    console.log('Failed to clear cache:', error.message);
  }
}

/**
 * Check if cache exists and is valid
 * @returns {boolean}
 */
export async function hasFreshCache() {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    const age = Date.now() - parseInt(timestamp, 10);
    return age < CACHE_DURATION_MS;
  } catch {
    return false;
  }
}
