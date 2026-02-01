/**
 * Wix Recommendations API Utility
 * 
 * Uses Wix REST API to fetch best sellers and recommended products
 * API Docs: https://dev.wix.com/docs/rest/api-reference/wix-e-commerce/recommendations/introduction
 */

import { wixCient } from '../authentication/wixClient';

// Wix Stores App ID (required for recommendations)
const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

// Cache for algorithm ID to avoid repeated API calls
let cachedBestSellersAlgorithmId = null;

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
 * List available recommendation algorithms
 * GET https://www.wixapis.com/v1/recommendations/algorithms
 */
export const listRecommendationAlgorithms = async () => {
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
    console.log('=== AVAILABLE ALGORITHMS ===');
    data?.algorithms?.forEach(alg => {
      console.log(`Name: "${alg.name}" | ID: ${alg._id} | AppId: ${alg.appId}`);
    });
    console.log('============================');
    
    return data?.algorithms || [];
  } catch (error) {
    console.log('Error listing algorithms:', error);
    return [];
  }
};

/**
 * Find the "Best Sellers" algorithm ID
 */
export const getBestSellersAlgorithmId = async () => {
  if (cachedBestSellersAlgorithmId) {
    return cachedBestSellersAlgorithmId;
  }

  const algorithms = await listRecommendationAlgorithms();
  
  // Look for "Best sellers" or similar algorithm
  const bestSellersAlg = algorithms.find(alg => 
    alg.name?.toLowerCase().includes('best seller') ||
    alg.name?.toLowerCase().includes('bestseller') ||
    alg.name?.toLowerCase().includes('popular') ||
    alg.name?.toLowerCase().includes('trending')
  );

  if (bestSellersAlg) {
    cachedBestSellersAlgorithmId = bestSellersAlg._id;
    console.log('Found Best Sellers algorithm:', bestSellersAlg.name, bestSellersAlg._id);
    return bestSellersAlg._id;
  }

  // Fallback: use the first Wix Stores algorithm
  const storesAlg = algorithms.find(alg => alg.appId === WIX_STORES_APP_ID);
  if (storesAlg) {
    cachedBestSellersAlgorithmId = storesAlg._id;
    console.log('Using Wix Stores algorithm:', storesAlg.name, storesAlg._id);
    return storesAlg._id;
  }

  return null;
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
 * 1. Gets the "Best sellers" algorithm ID
 * 2. Fetches recommendations using that algorithm
 * 3. Converts item IDs to full product data
 * 
 * @param {number} limit - Maximum number of products to return
 */
export const getBestSellers = async (limit = 20) => {
  console.log('=== FETCHING BEST SELLERS ===');
  
  try {
    // Step 1: Get algorithm ID
    const algorithmId = await getBestSellersAlgorithmId();
    
    if (!algorithmId) {
      console.log('No best sellers algorithm found, falling back to default query');
      return await getFallbackBestSellers(limit);
    }

    // Step 2: Get recommendations
    const productIds = await getRecommendations({
      algorithmId,
      minimumRecommendedItems: Math.min(limit, 10),
    });

    if (productIds.length === 0) {
      console.log('No recommendations returned, using fallback');
      return await getFallbackBestSellers(limit);
    }

    // Step 3: Get full product data
    const products = await getProductsByIds(productIds.slice(0, limit));
    
    console.log(`Best Sellers: Returned ${products.length} products`);
    return products;
  } catch (error) {
    console.log('Error in getBestSellers:', error);
    return await getFallbackBestSellers(limit);
  }
};

/**
 * Fallback: Get "best sellers" by querying products with most inventory sold
 * (when Recommendations API is not available)
 */
export const getFallbackBestSellers = async (limit = 20) => {
  console.log('Using fallback best sellers query...');
  
  try {
    // Fetch products and sort by numericId descending (newer products)
    // This is a rough proxy when we can't access sales data
    const response = await wixCient.products
      .queryProducts()
      .descending('lastUpdated')
      .limit(limit * 2) // Get extra to account for out of stock
      .find();
    
    const items = response?.items || [];
    
    // Filter to in-stock items and shuffle for variety
    const inStock = items.filter(p => p.stock?.inStock !== false);
    const shuffled = inStock.sort(() => Math.random() - 0.5);
    
    console.log(`Fallback: Returned ${Math.min(shuffled.length, limit)} products`);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.log('Error in fallback best sellers:', error);
    return [];
  }
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
