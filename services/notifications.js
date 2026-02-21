import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Order status types - matches Wix eCommerce order statuses
export const ORDER_STATUS = {
  PLACED: 'ORDER_PLACED',
  CONFIRMED: 'ORDER_CONFIRMED',
  PREPARING: 'ORDER_PREPARING',
  READY_FOR_PICKUP: 'ORDER_READY_FOR_PICKUP',
  SHIPPED: 'ORDER_SHIPPED',
  OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
  DELIVERED: 'ORDER_DELIVERED',
  FULFILLED: 'ORDER_FULFILLED',
  CANCELLED: 'ORDER_CANCELLED',
  REFUNDED: 'ORDER_REFUNDED',
};

// Notification messages for each status
const NOTIFICATION_MESSAGES = {
  [ORDER_STATUS.PLACED]: {
    title: '🎉 Order Placed!',
    body: 'Your order has been successfully placed. We\'re processing it now.',
  },
  [ORDER_STATUS.CONFIRMED]: {
    title: '✅ Order Confirmed',
    body: 'Great news! Your order has been confirmed and is being prepared.',
  },
  [ORDER_STATUS.PREPARING]: {
    title: '📦 Preparing Your Order',
    body: 'Our team is carefully preparing your order.',
  },
  [ORDER_STATUS.READY_FOR_PICKUP]: {
    title: '🏪 Ready for Pickup!',
    body: 'Your order is ready! Come pick it up at our store.',
  },
  [ORDER_STATUS.SHIPPED]: {
    title: '🚚 Order Shipped!',
    body: 'Your order is on its way! Track your delivery in the app.',
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    title: '🏃 Out for Delivery',
    body: 'Your order is out for delivery and will arrive soon!',
  },
  [ORDER_STATUS.DELIVERED]: {
    title: '🎊 Order Delivered!',
    body: 'Your order has been delivered. Enjoy your drinks! 🥂',
  },
  [ORDER_STATUS.FULFILLED]: {
    title: '✨ Order Fulfilled',
    body: 'Your order has been completed. Thank you for shopping with us!',
  },
  [ORDER_STATUS.CANCELLED]: {
    title: '❌ Order Cancelled',
    body: 'Your order has been cancelled. Contact us if you have questions.',
  },
  [ORDER_STATUS.REFUNDED]: {
    title: '💰 Order Refunded',
    body: 'Your refund has been processed. It may take 3-5 business days to appear.',
  },
};

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A2C2A',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        // For Expo Go testing
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (e) {
      console.log('Error getting push token:', e);
      token = null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Send local notification for order status update
export async function sendOrderStatusNotification(status, orderNumber) {
  const message = NOTIFICATION_MESSAGES[status];
  
  if (!message) {
    console.log('Unknown order status:', status);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: `Order #${orderNumber}: ${message.body}`,
      data: { 
        status, 
        orderNumber,
        type: 'order_update',
      },
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

// Schedule a notification for later (useful for reminders)
export async function scheduleNotification(title, body, triggerSeconds = 5) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: {
      seconds: triggerSeconds,
    },
  });
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get pending notifications
export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Add notification listeners
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Promotional notification helpers
export async function sendPromoNotification(title, body, promoCode) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎁 ${title}`,
      body,
      data: { 
        type: 'promo',
        promoCode,
      },
      sound: 'default',
    },
    trigger: null,
  });
}

// Cart reminder notification
export async function sendCartReminderNotification(itemCount) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛒 Items waiting in your cart',
      body: `You have ${itemCount} item${itemCount > 1 ? 's' : ''} in your cart. Complete your order now!`,
      data: { 
        type: 'cart_reminder',
      },
      sound: 'default',
    },
    trigger: {
      seconds: 3600, // 1 hour later
    },
  });
}

// Register push token with Wix backend for order notifications
export async function registerPushTokenWithWix(memberId, pushToken) {
  if (!memberId || !pushToken) {
    console.log('⚠️ Cannot register push token: missing memberId or pushToken');
    return false;
  }

  try {
    const response = await fetch('https://www.graftonliquor.co.nz/_functions/registerPushToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberId,
        pushToken,
        platform: Platform.OS,
      }),
    });

    if (response.ok) {
      console.log('✅ Push token registered with Wix for member:', memberId);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Failed to register push token:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error registering push token:', error.message);
    return false;
  }
}
