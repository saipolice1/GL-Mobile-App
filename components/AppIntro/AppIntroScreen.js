import * as SplashScreen from 'expo-splash-screen';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { wixCient } from '../../authentication/wixClient';
import { AppReadyProvider, useAppReady } from '../../context/AppReadyContext';
import { cacheProducts, getCachedProducts } from '../../services/productCache';

// Min time the logo is visible after it first appears on screen
const MIN_SHOW_MS = 2800;
// Hard cap — never block longer than this even on very slow networks
const MAX_SHOW_MS = 7000;
const FADE_OUT_MS = 400;

// Module-level: records when IntroOverlay's useEffect first fires (first paint).
// Using a module-level var instead of a ref means remounts don't reset the clock.
let _paintedAt = null;

async function prefetchAllProducts(queryClient) {
  try {
    // Already in RQ memory cache — nothing to do
    if (queryClient.getQueryData(['all-products'])?.length > 0) return;

    // Fresh AsyncStorage cache — hydrate RQ from it (fast path)
    const stored = await getCachedProducts();
    if (stored?.length > 0) {
      queryClient.setQueryData(['all-products'], stored);
      console.log(`✅ Hydrated ${stored.length} products from cache`);
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
      console.log(`✅ Prefetched ${allItems.length} products`);
    }
  } catch (e) {
    console.log('Prefetch skipped:', e?.message);
  }
}

const IntroOverlay = ({ children }) => {
  const { markIntroComplete } = useAppReady();
  const queryClient = useQueryClient();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const fadedOut = useRef(false);
  const minReached = useRef(false);
  const productsReady = useRef(false);

  const doFadeOut = useCallback(() => {
    if (fadedOut.current) return;
    fadedOut.current = true;
    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => {
      markIntroComplete();
      setOverlayVisible(false);
    });
  }, []);

  const checkDone = useCallback(() => {
    if (minReached.current && productsReady.current) doFadeOut();
  }, [doFadeOut]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // Capture when the screen was first painted (survives re-runs via _paintedAt guard)
    if (!_paintedAt) _paintedAt = Date.now();

    // ── Min timer ─────────────────────────────────────────────────────────────
    // Guarantees logo is visible for MIN_SHOW_MS from the moment it first painted.
    // Accounts for any time already elapsed if this effect re-runs due to a remount.
    const elapsed = Date.now() - _paintedAt;
    const minRemaining = Math.max(MIN_SHOW_MS - elapsed, 400);

    const minTimer = setTimeout(() => {
      minReached.current = true;
      checkDone();
    }, minRemaining);

    // ── Max timer ─────────────────────────────────────────────────────────────
    // Hard cap so a slow network never blocks the user indefinitely.
    const maxTimer = setTimeout(() => {
      productsReady.current = true;
      checkDone();
    }, Math.max(MAX_SHOW_MS - elapsed, minRemaining + 500));

    // ── Product prefetch ──────────────────────────────────────────────────────
    // Runs in background. When done, signals productsReady so the intro can end
    // as soon as the min time is also up — no skeleton on first search.
    prefetchAllProducts(queryClient).then(() => {
      productsReady.current = true;
      checkDone();
    });

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [checkDone]);

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
