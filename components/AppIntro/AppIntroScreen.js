import * as SplashScreen from 'expo-splash-screen';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { wixCient } from '../../authentication/wixClient';
import { AppReadyProvider, useAppReady } from '../../context/AppReadyContext';
import { cacheProducts, getCachedProducts } from '../../services/productCache';

const MIN_SHOW_MS = 3000;
const FADE_OUT_MS = 400;

// Captured once when module first loads — survives component remounts
// so the timer always counts from the true app-start, not from a re-render
let introStartedAt = Date.now();

async function prefetchAllProducts(queryClient) {
  try {
    // Already warm in React Query memory cache — nothing to do
    const existing = queryClient.getQueryData(['all-products']);
    if (existing?.length > 0) return;

    // AsyncStorage cache still fresh — populate RQ cache from it
    const stored = await getCachedProducts();
    if (stored?.length > 0) {
      queryClient.setQueryData(['all-products'], stored);
      return;
    }

    // Cold start — fetch all pages from Wix
    let allItems = [];
    let offset = 0;
    while (true) {
      const response = await wixCient.products
        .queryProducts()
        .skip(offset)
        .limit(100)
        .find();
      const items = response?.items || [];
      if (!items.length) break;
      allItems = [...allItems, ...items];
      offset += 100;
      if (items.length < 100 || allItems.length >= 1000) break;
    }
    if (allItems.length > 0) {
      queryClient.setQueryData(['all-products'], allItems);
      await cacheProducts(allItems);
      console.log(`✅ Prefetched ${allItems.length} products during intro`);
    }
  } catch (e) {
    // Fail silently — screens will fetch themselves normally
    console.log('Product prefetch skipped:', e?.message);
  }
}

const IntroOverlay = ({ children }) => {
  const { markIntroComplete } = useAppReady();
  const queryClient = useQueryClient();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // Fire product prefetch immediately — runs in background
    prefetchAllProducts(queryClient);

    // Calculate how much of MIN_SHOW_MS is still left
    // Uses module-level timestamp so remounts don't reset the clock
    const elapsed = Date.now() - introStartedAt;
    const remaining = Math.max(MIN_SHOW_MS - elapsed, 600);

    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(() => {
        markIntroComplete();
        setOverlayVisible(false);
      });
    }, remaining);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {overlayVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fade }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
};

export const AppIntroScreen = ({ children }) => (
  <AppReadyProvider>
    <IntroOverlay>{children}</IntroOverlay>
  </AppReadyProvider>
);

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
