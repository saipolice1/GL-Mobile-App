import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { wixCient } from '../authentication/wixClient';
import { members } from '@wix/members';

/**
 * Visitor Tracking Service
 * 
 * Triggers native Wix visitor alerts using legitimate customer actions:
 * 1. Cart activities - Creates alerts in Wix Dashboard when visitors add items
 * 2. Member activities - Generates alerts when users engage with products  
 * 3. Contact form submissions - Shows visitor alerts in Wix app
 * 
 * These actions trigger the same native alerts you see for website visitors!
 */

const VISITOR_STORAGE_KEY = '@grafton_visitor_id';
const ACTIVITY_STORAGE_KEY = '@grafton_visitor_activity';
const SESSION_KEY = '@grafton_session_data';
const FIRST_LAUNCH_KEY = '@grafton_first_launch';

// Generate a unique visitor ID
const generateVisitorId = () => {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create visitor ID
export async function getVisitorId() {
  try {
    let visitorId = await AsyncStorage.getItem(VISITOR_STORAGE_KEY);
    if (!visitorId) {
      visitorId = generateVisitorId();
      await AsyncStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch (error) {
    console.error('Error getting visitor ID:', error);
    return generateVisitorId();
  }
}

// Check if this is the first time the app has been launched
export async function isFirstLaunch() {
  try {
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return hasLaunched === null;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
}

// Mark that the app has been launched
export async function markAppLaunched() {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error marking app launched:', error);
  }
}

// Get device info for tracking
export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    brand: Device.brand || 'Unknown',
    modelName: Device.modelName || 'Unknown',
    osVersion: String(Platform.Version),
    isDevice: Device.isDevice,
  };
}

// Get member info if logged in
export async function getMemberInfo() {
  try {
    const member = await wixCient.use(members).getCurrentMember();
    if (member?.member) {
      return {
        memberId: member.member._id || null,
        memberName: member.member.profile?.nickname || member.member.loginEmail || 'Member',
        memberEmail: member.member.loginEmail || null,
      };
    }
    return null;
  } catch (error) {
    // User not logged in or error getting member info
    return null;
  }
}

// Cache location for the session (undefined = not yet fetched, null = denied/unavailable)
let cachedLocation = undefined;

// Get location info (city/region/country) — requests permission on first call
async function getLocationInfo() {
  if (cachedLocation !== undefined) return cachedLocation;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      cachedLocation = null;
      return null;
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
      maximumAge: 10 * 60 * 1000,
      timeout: 5000,
    });
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    cachedLocation = geocode
      ? {
          city: geocode.city || null,
          region: geocode.region || null,
          country: geocode.country || null,
          postalCode: geocode.postalCode || null,
        }
      : null;
    return cachedLocation;
  } catch (error) {
    console.log('📍 Location not available:', error.message);
    cachedLocation = null;
    return null;
  }
}

// Activity types
export const ACTIVITY_TYPES = {
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  SEARCH: 'search',
  CATEGORY_VIEW: 'category_view',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
  APP_OPEN: 'app_open',
  APP_CLOSE: 'app_close',
  FIRST_APP_OPEN: 'first_app_open', // New visitor - first time opening app
};

/**
 * Track visitor activity - stores locally and sends webhook notifications
 * This data can be synced with orders for analytics
 */
export async function trackActivity(activityType, data = {}) {
  try {
    const visitorId = await getVisitorId();
    const deviceInfo = getDeviceInfo();
    const memberInfo = await getMemberInfo();
    const locationInfo = await getLocationInfo();
    
    const activity = {
      id: `act_${Date.now()}`,
      visitorId,
      type: activityType,
      data,
      timestamp: new Date().toISOString(),
      device: deviceInfo,
      member: memberInfo,
      location: locationInfo,
    };
    
    console.log('📊 Tracking:', activity.type, data.productName || data.page || '');
    
    // Store activity locally
    await storeActivityLocally(activity);
    
    // Send webhook notification for key events
    await sendWebhookNotification(activity);
    
    // Update session data for potential order sync
    await updateSessionData(activityType, data);
    
    return activity;
  } catch (error) {
    console.error('Error tracking activity:', error);
    return null;
  }
}

/**
 * Send app events to Wix backend for proper Analytics/Inbox integration
 * App → Velo HTTP Function → Wix APIs (with site credentials)
 */
async function sendWebhookNotification(activity) {
  // Only send significant events to avoid spam
  const importantEvents = [
    ACTIVITY_TYPES.ADD_TO_CART,
    ACTIVITY_TYPES.CHECKOUT_START,
    // ACTIVITY_TYPES.APP_OPEN, // Disabled - too frequent
    ACTIVITY_TYPES.FIRST_APP_OPEN, // New visitors only
    ACTIVITY_TYPES.PRODUCT_VIEW, // For high-value products
  ];
  
  if (!importantEvents.includes(activity.type)) {
    return;
  }
  
  try {
    // Send minimal payload to Velo HTTP function
    const payload = {
      type: activity.type,
      visitorId: activity.visitorId,
      timestamp: activity.timestamp,
      device: {
        platform: activity.device.platform,
        brand: activity.device.brand,
        model: activity.device.modelName
      },
      // Member info (if logged in)
      memberId: activity.member?.memberId ?? null,
      memberName: activity.member?.memberName || null,
      memberEmail: activity.member?.memberEmail ?? null,
      // Event-specific data
      productId: activity.data.productId || null,
      productName: activity.data.productName || null,
      category: activity.data.category || null,
      price: activity.data.price || null,
      quantity: activity.data.quantity || null,
      searchQuery: activity.data.query || null,
      // Use ?? instead of || so that `false` is sent correctly (not converted to null)
      isNewVisitor: activity.data.isNewVisitor ?? null,
      // Location (city/region/country from device GPS — null if permission denied)
      city: activity.location?.city || null,
      region: activity.location?.region || null,
      country: activity.location?.country || null,
      postalCode: activity.location?.postalCode || null,
    };
    
    // Send to your Velo HTTP function (with site credentials)
    // Function name: post_appAnalytics → URL: /_functions/appAnalytics
    const url = 'https://www.graftonliquor.co.nz/_functions/appAnalytics';
    
    console.log('🔗 Attempting to reach:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ App event sent to backend:', activity.type, result);
    } else {
      const errorText = await response.text().catch(() => 'No response body');
      console.log('⚠️ Backend event failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('⚠️ App analytics failed (silent):', error.message);
    // Silent fail - don't break user experience
  }
}

/**
 * Update session data that can be attached to orders
 */
async function updateSessionData(activityType, data) {
  try {
    const existing = await AsyncStorage.getItem(SESSION_KEY);
    const session = existing ? JSON.parse(existing) : {
      startTime: new Date().toISOString(),
      viewedProducts: [],
      searchQueries: [],
      cartActions: [],
    };
    
    // Track viewed products
    if (activityType === ACTIVITY_TYPES.PRODUCT_VIEW && data.productName) {
      if (!session.viewedProducts.includes(data.productName)) {
        session.viewedProducts.push(data.productName);
        // Keep only last 10
        if (session.viewedProducts.length > 10) {
          session.viewedProducts.shift();
        }
      }
    }
    
    // Track searches
    if (activityType === ACTIVITY_TYPES.SEARCH && data.query) {
      if (!session.searchQueries.includes(data.query)) {
        session.searchQueries.push(data.query);
        if (session.searchQueries.length > 5) {
          session.searchQueries.shift();
        }
      }
    }
    
    // Track cart actions
    if (activityType === ACTIVITY_TYPES.ADD_TO_CART) {
      session.cartActions.push({
        action: 'add',
        product: data.productName,
        time: new Date().toISOString(),
      });
      if (session.cartActions.length > 20) {
        session.cartActions.shift();
      }
    }
    
    session.lastActivity = new Date().toISOString();
    
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error updating session:', error);
  }
}

/**
 * Get session data - can be attached to order notes
 */
export async function getSessionData() {
  try {
    const existing = await AsyncStorage.getItem(SESSION_KEY);
    return existing ? JSON.parse(existing) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get session summary for order notes
 */
export async function getSessionSummary() {
  const session = await getSessionData();
  if (!session) return '';
  
  const parts = [];
  
  if (session.viewedProducts.length > 0) {
    parts.push(`Viewed: ${session.viewedProducts.slice(0, 3).join(', ')}`);
  }
  
  if (session.searchQueries.length > 0) {
    parts.push(`Searched: ${session.searchQueries.join(', ')}`);
  }
  
  return parts.join(' | ');
}

/**
 * Clear session data (call after order completion)
 */
export async function clearSessionData() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// Store activity locally for analytics
async function storeActivityLocally(activity) {
  try {
    const existing = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
    const activities = existing ? JSON.parse(existing) : [];
    
    activities.push(activity);
    
    // Keep last 100 activities
    if (activities.length > 100) {
      activities.shift();
    }
    
    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error('Error storing activity:', error);
  }
}

// Get stored activities
export async function getStoredActivities() {
  try {
    const existing = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error getting stored activities:', error);
    return [];
  }
}

// Clear stored activities
export async function clearStoredActivities() {
  try {
    await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing activities:', error);
  }
}

// Convenience tracking functions
export const trackPageView = (pageName, params = {}) => 
  trackActivity(ACTIVITY_TYPES.PAGE_VIEW, { page: pageName, ...params });

export const trackProductView = (product) => 
  trackActivity(ACTIVITY_TYPES.PRODUCT_VIEW, { 
    productId: product._id || product.id,
    productName: product.name,
    price: product.priceData?.price,
    category: product.collectionIds?.[0],
  });

export const trackAddToCart = (product, quantity = 1) => 
  trackActivity(ACTIVITY_TYPES.ADD_TO_CART, { 
    productId: product._id || product.id,
    productName: product.name,
    price: product.priceData?.price,
    quantity,
  });

export const trackRemoveFromCart = (product, quantity = 1) => 
  trackActivity(ACTIVITY_TYPES.REMOVE_FROM_CART, { 
    productId: product._id || product.id,
    productName: product.name,
    quantity,
  });

export const trackSearch = (query, resultsCount = 0) => 
  trackActivity(ACTIVITY_TYPES.SEARCH, { query, resultsCount });

export const trackCategoryView = (categorySlug, categoryName) => 
  trackActivity(ACTIVITY_TYPES.CATEGORY_VIEW, { categorySlug, categoryName });

export const trackCheckoutStart = (cartTotal, itemCount) => 
  trackActivity(ACTIVITY_TYPES.CHECKOUT_START, { cartTotal, itemCount });

export const trackCheckoutComplete = (orderId, orderTotal, itemCount) => 
  trackActivity(ACTIVITY_TYPES.CHECKOUT_COMPLETE, { orderId, orderTotal, itemCount });

export const trackAppOpen = async () => {
  // Check if this is the first launch
  const firstLaunch = await isFirstLaunch();
  
  if (firstLaunch) {
    // Track as new visitor
    await trackActivity(ACTIVITY_TYPES.FIRST_APP_OPEN, {
      isNewVisitor: true,
      installDate: new Date().toISOString(),
    });
    await markAppLaunched();
  } else {
    // Track as returning visitor
    await trackActivity(ACTIVITY_TYPES.APP_OPEN, {
      isNewVisitor: false,
    });
  }
};

export const trackAppClose = () => 
  trackActivity(ACTIVITY_TYPES.APP_CLOSE, {});
