import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '../services/notifications';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, onNotificationTap }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        setPermissionGranted(true);
        console.log('Push notification token:', token);
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      if (onNotificationTap) {
        onNotificationTap(data);
      }
    });

    // Handle cold-start: app was killed and user tapped a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('Cold-start notification:', response);
        const data = response.notification.request.content.data;
        if (onNotificationTap) {
          onNotificationTap(data);
        }
      }
    });

    return () => {
      // Clean up listeners (safely handle Expo Go where removeNotificationSubscription may not exist)
      try {
        if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
          notificationListener.current.remove();
        } else if (notificationListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current && typeof responseListener.current.remove === 'function') {
          responseListener.current.remove();
        } else if (responseListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.log('Notification cleanup error (expected in Expo Go):', error);
      }
    };
  }, [onNotificationTap]);

  const value = {
    expoPushToken,
    notification,
    permissionGranted,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
