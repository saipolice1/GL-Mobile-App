import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { AppReadyProvider, useAppReady } from '../../context/AppReadyContext';

const MIN_SHOW_MS = 2500;
const FADE_OUT_MS = 400;

const IntroOverlay = ({ children }) => {
  const { markIntroComplete } = useAppReady();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide native splash immediately so our JS overlay takes over
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(() => {
        markIntroComplete();
        setOverlayVisible(false);
      });
    }, MIN_SHOW_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* App renders in background during intro */}
      {children}
      {/* Logo overlay sits on top — fades out after MIN_SHOW_MS */}
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
