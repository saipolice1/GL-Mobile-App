import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

const INTRO_DURATION = 1600;
const FADE_IN_MS = 400;
const FADE_OUT_MS = 300;

export const AppIntroScreen = ({ children }) => {
  const [done, setDone] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true })
        .start(() => setDone(true));
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, []);

  if (done) return children;

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Animated.Image
        source={require('../../assets/icon.png')}
        style={[styles.logo, { transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
