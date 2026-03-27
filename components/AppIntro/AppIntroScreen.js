import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { AppReadyProvider, useAppReady } from '../../context/AppReadyContext';

const MIN_SHOW_MS = 2200; // minimum time logo stays visible
const FADE_OUT_MS = 350;

const IntroOverlay = ({ children }) => {
  const { ready } = useAppReady();
  const [visible, setVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const minDone = useRef(false);
  const appReady = useRef(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const minTimer = setTimeout(() => {
      minDone.current = true;
      if (appReady.current) fadeOut();
    }, MIN_SHOW_MS);

    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    appReady.current = true;
    if (minDone.current) fadeOut();
  }, [ready]);

  const fadeOut = () => {
    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {visible && (
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
