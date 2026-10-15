/**
 * Wix Recommendations API Utility
 * 
 * Uses Wix REST API to fetch best sellers and recommended products
 * API Docs: https://dev.wix.com/docs/rest/api-reference/wix-e-commerce/recommendations/introduction
 */

import { wixCient } from '../authentication/wixClient';

// Wix Stores App ID (required for recommendations)
const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

// Cache for algorithm ID to avoid repeated API calls.
// undefined = not looked up yet, null = looked up but no "Best sellers" algorithm exists
let cachedBestSellersAlgorithmId;

// Cache for the algorithm list, plus the in-flight request so concurrent callers share it
let cachedAlgorithms = null;
let algorithmsPromise = null;

// Cache for best sellers results to avoid repeated API calls and keep consistent results
let bestSellersPromise = null; // in-flight request shared by concurrent callers
let cachedBestSellers = null;
let bestSellersCacheTime = null;
const BEST_SELLERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_BEST_SELLERS_LIMIT = 21;

/**
 * Get access token from the Wix client
 */
const getAccessToken = async () => {
  try {
    const tokens = await wixCient.auth.getTokens();
    return tokens?.accessToken?.value || null;
  } catch (error) {
    console.log('Error getting access token:', error);
    return null;
  }
};

/**
 * Get the base site URL from environment
 */
const getSiteUrl = () => {
  // Use the store URL from env or default
  return process.env.EXPO_PUBLIC_STORE_URL || 'https://www.graftonliquor.com';
};

/**
 * Fetch available recommendation algorithms from the API
 * GET https://www.wixapis.com/ecom/v1/recommendations/algorithms
 *
 * Returns null on network/unexpected errors so the result is not cached.
 */
const fetchRecommendationAlgorithms = async () => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('No access token available for recommendations');
      return [];
    }

    const response = await fetch('https://www.wixapis.com/ecom/v1/recommendations/algorithms', {
      method: 'GET',
      headers: {
        'Authorization': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('List algorithms error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data?.algorithms || [];
  } catch (error) {
    console.log('Error listing algorithms:', error);
    return null;
  }
};

/**
 * List available recommendation algorithms
 * Cached after the first successful fetch; concurrent callers share one request.
 */
export const listRecommendationAlgorithms = async () => {
  if (cachedAlgorithms) {
    return cachedAlgorithms;
  }
  if (algorithmsPromise) {
    return algorithmsPromise;
  }

  algorithmsPromise = fetchRecommendationAlgorithms();
  try {
    const algorithms = await algorithmsPromise;
    if (algorithms) {
      cachedAlgorithms = algorithms;
    }
    return algorithms || [];
  } finally {
    algorithmsPromise = null;
  }
};

/**
 * Find the "Best Sellers" algorithm ID
 */
export const getBestSellersAlgorithmId = async () => {
  if (cachedBestSellersAlgorithmId !== undefined) {
    return cachedBestSellersAlgorithmId;
  }

  const algorithms = await listRecommendationAlgorithms();

  // Look for "Best sellers" algorithm (exact match preferred),
  // otherwise try partial matches
  const bestSellersAlg =
    algorithms.find(alg =>
      alg.name?.toLowerCase() === 'best sellers' ||
      alg.name?.toLowerCase() === 'bestsellers'
    ) ||
    algorithms.find(alg =>
      alg.name?.toLowerCase().includes('best seller') ||
      alg.name?.toLowerCase().includes('bestseller')
    );

  // Cache the miss too (null) so we don't keep re-querying
  cachedBestSellersAlgorithmId = bestSellersAlg?._id ?? null;
  return cachedBestSellersAlgorithmId;
};

/**
 * Get recommendations using a specific algorithm
 * POST https://www.wixapis.com/ecom/v1/recommendations/request
 * 
 * @param {Object} options
 * @param {string} options.algorithmId - Algorithm ID to use
 * @param {number} options.minimumRecommendedItems - Minimum items threshold (default: 4)
 * @param {string[]} options.itemIds - Context item IDs (for "related items" algorithms)
 */
export const getRecommendations = async (options = {}) => {
  const { 
    algorithmId, 
    minimumRecommendedItems = 4,
    itemIds = []
  } = options;

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('No access token for recommendations');
      return [];
    }

    const requestBody = {
      algorithms: [{
        _id: algorithmId,
        appId: WIX_STORES_APP_ID,
      }],
      minimumRecommendedItems,
    };

    // Add item IDs if provided (for "related items" type algorithms)
    if (itemIds.length > 0) {
      requestBody.items = itemIds.map(id => ({
        appId: WIX_STORES_APP_ID,
        catalogItemId: id,
      }));
    }

    console.log('Requesting recommendations:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://www.wixapis.com/ecom/v1/recommendations/request', {
      method: 'POST',
      headers: {
        'Authorization': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Get recommendations error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('Recommendations response:', JSON.stringify(data, null, 2));
    
    // Extract catalog item IDs from the recommendation
    const recommendedItemIds = data?.recommendation?.items?.map(item => item.catalogItemId) || [];
    console.log('Recommended item IDs:', recommendedItemIds);
    
    return recommendedItemIds;
  } catch (error) {
    console.log('Error getting recommendations:', error);
    return [];
  }
};

/**
 * Fetch full product data for a list of product IDs
 * Uses the Wix SDK products.getProduct method
 */
export const getProductsByIds = async (productIds) => {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  try {
    // Use queryProducts with hasSome to fetch multiple products
    const response = await wixCient.products
      .queryProducts()
      .hasSome('_id', productIds)
      .limit(productIds.length)
      .find();
    
    const products = response?.items || [];
    
    // Sort products in the same order as the input IDs
    const sortedProducts = productIds
      .map(id => products.find(p => p._id === id))
      .filter(Boolean);
    
    return sortedProducts;
  } catch (error) {
    console.log('Error fetching products by IDs:', error);
    return [];
  }
};

/**
 * Main function: Get Best Sellers products
 *
 * Returns cached results when fresh, and shares a single in-flight request
 * between concurrent callers (e.g. several home sections mounting at once).
 *
 * @param {number} limit - Maximum number of products to return (default: 21)
 * @param {boolean} forceRefresh - Force refresh cache (default: false)
 */
export const getBestSellers = async (limit = 21, forceRefresh = false) => {
  // Check cache first (unless force refresh)
  if (!forceRefresh && cachedBestSellers && bestSellersCacheTime) {
    const cacheAge = Date.now() - bestSellersCacheTime;
    if (cacheAge < BEST_SELLERS_CACHE_DURATION) {
      return cachedBestSellers.slice(0, limit);
    }
  }

  // Reuse a request that is already in flight
  if (!forceRefresh && bestSellersPromise) {
    const products = await bestSellersPromise;
    return (products || []).slice(0, limit);
  }

  // Always fetch at least the default amount so the shared result suits every caller
  bestSellersPromise = getBestSellersUncached(
    Math.max(limit, DEFAULT_BEST_SELLERS_LIMIT),
    forceRefresh
  );
  try {
    const products = await bestSellersPromise;
    return (products || []).slice(0, limit);
  } finally {
    bestSellersPromise = null;
  }
};

/**
 * Fetch Best Sellers products (no request de-duplication)
 *
 * 1. Gets the "Best sellers" algorithm ID
 * 2. Fetches recommendations using that algorithm
 * 3. Converts item IDs to full product data
 * 4. Caches results to prevent products changing on category switch
 * 
 * @param {number} limit - Maximum number of products to return (default: 21)
 * @param {boolean} forceRefresh - Force refresh cache (default: false)
 */
const getBestSellersUncached = async (limit = 21, forceRefresh = false) => {
  // Check cache first (unless force refresh)
  if (!forceRefresh && cachedBestSellers && bestSellersCacheTime) {
    const now = Date.now();
    const cacheAge = now - bestSellersCacheTime;
    if (cacheAge < BEST_SELLERS_CACHE_DURATION) {
      return cachedBestSellers.slice(0, limit);
    }
  }
  
  try {
    // Step 1: Get algorithm ID
    const algorithmId = await getBestSellersAlgorithmId();
    
    if (!algorithmId) {
      const fallback = await getFallbackBestSellers(limit);
      // Cache fallback results too
      cachedBestSellers = fallback;
      bestSellersCacheTime = Date.now();
      return fallback;
    }

    // Step 2: Get recommendations (request more than needed in case some are out of stock)
    const productIds = await getRecommendations({
      algorithmId,
      minimumRecommendedItems: Math.min(limit, 10),
    });

    if (productIds.length === 0) {
      const fallback = await getFallbackBestSellers(limit);
      cachedBestSellers = fallback;
      bestSellersCacheTime = Date.now();
      return fallback;
    }

    // Step 3: Get full product data (take up to limit)
    const products = await getProductsByIds(productIds.slice(0, limit));
    
    // Cache the results
    cachedBestSellers = products;
    bestSellersCacheTime = Date.now();
    
    return products;
  } catch (error) {
    const fallback = await getFallbackBestSellers(limit);
    cachedBestSellers = fallback;
    bestSellersCacheTime = Date.now();
    return fallback;
  }
};

/**
 * Fallback: Get "best sellers" by querying recently updated products
 * (when Recommendations API is not available)
 */
export const getFallbackBestSellers = async (limit = 21) => {
  try {
    // Fetch products sorted by last updated (most recent first)
    const response = await wixCient.products
      .queryProducts()
      .descending('lastUpdated')
      .limit(limit * 2) // Get extra to account for out of stock
      .find();
    
    const items = response?.items || [];
    
    // Filter to in-stock items only (keep original order, no shuffle)
    const inStock = items.filter(p => p.stock?.inStock !== false);
    
    return inStock.slice(0, limit);
  } catch (error) {
    return [];
  }
};

/**
 * Clear the best sellers cache
 * Useful when you want to force refresh the best sellers
 */
export const clearBestSellersCache = () => {
  cachedBestSellers = null;
  bestSellersCacheTime = null;
};

/**
 * Get related/similar products for a given product
 * Uses "Frequently bought together" or "Related items" algorithm
 */
export const getRelatedProducts = async (productId, limit = 10) => {
  try {
    const algorithms = await listRecommendationAlgorithms();
    
    // Find a "related items" or "frequently bought together" algorithm
    const relatedAlg = algorithms.find(alg => 
      alg.name?.toLowerCase().includes('related') ||
      alg.name?.toLowerCase().includes('similar') ||
      alg.name?.toLowerCase().includes('frequently bought') ||
      alg.name?.toLowerCase().includes('you may also like')
    );

    if (!relatedAlg) {
      // Fall back to querying same collection
      return [];
    }

    const productIds = await getRecommendations({
      algorithmId: relatedAlg._id,
      minimumRecommendedItems: 4,
      itemIds: [productId],
    });

    if (productIds.length === 0) {
      return [];
    }

    // Filter out the original product
    const filteredIds = productIds.filter(id => id !== productId);
    const products = await getProductsByIds(filteredIds.slice(0, limit));
    
    return products;
  } catch (error) {
    console.log('Error getting related products:', error);
    return [];
  }
};

export default {
  listRecommendationAlgorithms,
  getBestSellersAlgorithmId,
  getRecommendations,
  getProductsByIds,
  getBestSellers,
  getFallbackBestSellers,
  getRelatedProducts,
};
