import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '../services/notifications';

const INBOX_KEY = '@notification_inbox';
const MAX_INBOX = 50;

async function saveToInbox(notification) {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const entry = {
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      receivedAt: new Date().toISOString(),
      read: false,
    };
    const updated = [entry, ...existing].slice(0, MAX_INBOX);
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.log('Failed to save notification to inbox:', e);
    return [];
  }
}

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
  const [inbox, setInbox] = useState([]);

  const notificationListener = useRef();
  const responseListener = useRef();

  // Load inbox from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(INBOX_KEY).then(raw => {
      if (raw) setInbox(JSON.parse(raw));
    });
  }, []);

  const clearInbox = async () => {
    await AsyncStorage.removeItem(INBOX_KEY);
    setInbox([]);
  };

  const markAllRead = async () => {
    const updated = inbox.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
    setInbox(updated);
  };

  const unreadCount = inbox.filter(n => !n.read).length;

  useEffect(() => {
    // Clear badge when app comes to foreground
    const appStateListener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        Notifications.setBadgeCountAsync(0);
      }
    });
    // Also clear immediately on mount
    Notifications.setBadgeCountAsync(0);

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
      saveToInbox(notification).then(setInbox);
    });

    // Listen for notification taps — clear badge on tap
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      Notifications.setBadgeCountAsync(0);
      const data = response.notification.request.content.data;
      if (onNotificationTap) {
        onNotificationTap(data);
      }
    });

    // Handle cold-start: app was killed and user tapped a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('Cold-start notification:', response);
        Notifications.setBadgeCountAsync(0);
        const data = response.notification.request.content.data;
        if (onNotificationTap) {
          onNotificationTap(data);
        }
      }
    });

    return () => {
      appStateListener.remove();
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
    inbox,
    unreadCount,
    clearInbox,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
