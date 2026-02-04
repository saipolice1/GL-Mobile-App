import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AnimatedFire = ({ size = 24 }) => {
  // Separate animations for each flame layer
  const redScale = useRef(new Animated.Value(1)).current;
  const orangeScale = useRef(new Animated.Value(1)).current;
  const yellowScale = useRef(new Animated.Value(1)).current;
  
  const redOpacity = useRef(new Animated.Value(1)).current;
  const orangeOpacity = useRef(new Animated.Value(0.9)).current;
  const yellowOpacity = useRef(new Animated.Value(0.8)).current;
  
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Red/outer flame - slower, larger pulses
    const redLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(redScale, {
          toValue: 1.12,
          duration: 280,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(redScale, {
          toValue: 0.95,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Orange/middle flame - medium speed
    const orangeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orangeScale, {
          toValue: 1.15,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orangeScale, {
          toValue: 0.92,
          duration: 180,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Yellow/inner flame - fastest, most erratic
    const yellowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(yellowScale, {
          toValue: 1.18,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(yellowScale, {
          toValue: 0.88,
          duration: 130,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Opacity flickers
    const redOpacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(redOpacity, { toValue: 0.85, duration: 200, useNativeDriver: true }),
        Animated.timing(redOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ])
    );

    const orangeOpacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orangeOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(orangeOpacity, { toValue: 0.75, duration: 100, useNativeDriver: true }),
        Animated.timing(orangeOpacity, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      ])
    );

    const yellowOpacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(yellowOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(yellowOpacity, { toValue: 0.6, duration: 70, useNativeDriver: true }),
        Animated.timing(yellowOpacity, { toValue: 0.9, duration: 90, useNativeDriver: true }),
        Animated.timing(yellowOpacity, { toValue: 0.7, duration: 60, useNativeDriver: true }),
      ])
    );

    // Sway animation
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    redLoop.start();
    orangeLoop.start();
    yellowLoop.start();
    redOpacityLoop.start();
    orangeOpacityLoop.start();
    yellowOpacityLoop.start();
    swayLoop.start();

    return () => {
      redLoop.stop();
      orangeLoop.stop();
      yellowLoop.stop();
      redOpacityLoop.stop();
      orangeOpacityLoop.stop();
      yellowOpacityLoop.stop();
      swayLoop.stop();
    };
  }, []);

  const rotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Red/dark orange base layer */}
      <Animated.View
        style={[
          styles.flameLayer,
          {
            transform: [{ scale: redScale }, { rotate }],
            opacity: redOpacity,
          },
        ]}
      >
        <MaterialCommunityIcons name="fire" size={size} color="#D62828" />
      </Animated.View>

      {/* Orange middle layer */}
      <Animated.View
        style={[
          styles.flameLayer,
          {
            transform: [
              { scale: orangeScale },
              { rotate },
              { translateY: -size * 0.02 },
            ],
            opacity: orangeOpacity,
          },
        ]}
      >
        <MaterialCommunityIcons name="fire" size={size * 0.85} color="#F77F00" />
      </Animated.View>

      {/* Yellow/bright inner layer */}
      <Animated.View
        style={[
          styles.flameLayer,
          {
            transform: [
              { scale: yellowScale },
              { rotate },
              { translateY: -size * 0.04 },
            ],
            opacity: yellowOpacity,
          },
        ]}
      >
        <MaterialCommunityIcons name="fire" size={size * 0.65} color="#FCBF49" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
