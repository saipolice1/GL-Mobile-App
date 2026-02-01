import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Store URL from environment
const STORE_URL = process.env.EXPO_PUBLIC_STORE_URL || 'https://www.graftonliquor.co.nz';

// Pre-defined URLs for different features
export const WIX_PAGES = {
  // Contact/Chat - opens Wix site homepage which has chat widget
  CHAT: STORE_URL,
  CONTACT: STORE_URL,
  
  // Login page - includes Google sign-in option
  LOGIN: `${STORE_URL}/account/my-account`,
  
  // Order history for logged-in members
  ORDER_HISTORY: `${STORE_URL}/account/my-orders`,
  
  // Member account page
  ACCOUNT: `${STORE_URL}/account/my-account`,
  
  // Store homepage
  HOME: STORE_URL,
};

// Screen titles for each page type
const PAGE_TITLES = {
  [WIX_PAGES.CHAT]: 'Chat with Us',
  [WIX_PAGES.CONTACT]: 'Contact Us',
  [WIX_PAGES.LOGIN]: 'Sign In',
  [WIX_PAGES.ORDER_HISTORY]: 'Order History',
  [WIX_PAGES.ACCOUNT]: 'My Account',
  [WIX_PAGES.HOME]: 'Grafton Liquor',
};

/**
 * WebViewScreen - Opens Wix website pages in a WebView
 * 
 * Benefits:
 * - Chat messages go directly to Wix Inbox (same as website)
 * - Google Sign-In works natively
 * - Order history is accurate and real-time
 * - No backend needed - uses Wix's existing infrastructure
 * 
 * Usage:
 * navigation.navigate('WebView', { 
 *   url: WIX_PAGES.CHAT, 
 *   title: 'Chat with Us' 
 * });
 */
export const WebViewScreen = ({ navigation, route }) => {
  const { url, title } = route.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url || WIX_PAGES.HOME);
  const webViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get title from params or use default based on URL
  const screenTitle = title || PAGE_TITLES[url] || 'Grafton Liquor';

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  // Handle back button
  const handleBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  // Animate progress bar
  const handleLoadProgress = ({ nativeEvent }) => {
    setLoadProgress(nativeEvent.progress);
    Animated.timing(progressAnim, {
      toValue: nativeEvent.progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  // Inject CSS to hide Wix header/footer if needed (optional)
  const injectedCSS = `
    (function() {
      // Optional: Hide Wix header/navigation for cleaner look
      // Uncomment if you want to hide website navigation
      // var header = document.querySelector('header');
      // if (header) header.style.display = 'none';
      
      // Ensure chat widget is visible
      var chatWidget = document.querySelector('[data-hook="chat-widget-container"]');
      if (chatWidget) chatWidget.style.display = 'block';
    })();
  `;

  // Handle messages from WebView (e.g., login success)
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      // Handle login success - could refresh app state
      if (data.type === 'login_success') {
        // Could trigger app-wide login state update
        console.log('User logged in via WebView');
      }
    } catch (e) {
      // Not JSON message, ignore
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{screenTitle}</Text>
          {isLoading && (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => webViewRef.current?.reload()} 
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {isLoading && (
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]} 
        />
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onLoadProgress={handleLoadProgress}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedCSS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Enable cookies for login persistence
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        // Loading indicator
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingMessage}>Loading...</Text>
          </View>
        )}
        // Error handling
        renderError={(errorName) => (
          <View style={styles.errorContainer}>
            <Ionicons name="wifi-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.errorTitle}>Couldn't load page</Text>
            <Text style={styles.errorMessage}>
              Please check your internet connection
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => webViewRef.current?.reload()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    marginRight: 4,
  },
  closeButton: {
    padding: 8,
  },
  progressBar: {
    height: 2,
    backgroundColor: theme.colors.accent,
  },
  webView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingMessage: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.accent,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WebViewScreen;
