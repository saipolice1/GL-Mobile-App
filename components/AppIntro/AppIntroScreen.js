import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const INTRO_DURATION = 1600; // ms to show branded screen
const FADE_IN_MS = 400;
const FADE_OUT_MS = 300;

export const AppIntroScreen = ({ children }) => {
  const [done, setDone] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash as soon as our JS screen is ready
    SplashScreen.hideAsync().catch(() => {});

    // Animate logo in
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Text fades in slightly after
    setTimeout(() => {
      Animated.timing(textFade, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 250);

    // Fade out and reveal app
    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(() => setDone(true));
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, []);

  if (done) return children;

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={{ opacity: textFade, alignItems: 'center', marginTop: 28 }}>
        <Animated.Text style={styles.brandName}>GRAFTON</Animated.Text>
        <Animated.Text style={styles.brandSub}>LIQUOR</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 120,
    height: 120,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 6,
  },
  brandSub: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
    letterSpacing: 10,
    marginTop: 4,
  },
});
