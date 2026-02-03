import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const SAME_DAY_MIN = 80;
const FREE_DELIVERY_MIN = 200;

export const DeliveryProgressBar = ({ cartTotal = 0 }) => {
  const sameDayRemaining = Math.max(0, SAME_DAY_MIN - cartTotal);
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_MIN - cartTotal);
  
  const sameDayProgress = Math.min(1, cartTotal / SAME_DAY_MIN);
  const freeDeliveryProgress = Math.min(1, cartTotal / FREE_DELIVERY_MIN);
  
  const sameDayUnlocked = cartTotal >= SAME_DAY_MIN;
  const freeDeliveryUnlocked = cartTotal >= FREE_DELIVERY_MIN;

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for unlocked states
  useEffect(() => {
    if (sameDayUnlocked || freeDeliveryUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [sameDayUnlocked, freeDeliveryUnlocked]);

  // Shimmer animation for progress bar
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Bounce animation for icons
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -3,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Only show when cart has items
  if (cartTotal === 0) {
    return null;
  }

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      {/* Same Day Delivery Progress */}
      <View style={styles.progressSection}>
        <View style={styles.textRow}>
          <View style={styles.labelRow}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <Ionicons 
                name={sameDayUnlocked ? "checkmark-circle" : "bicycle-outline"} 
                size={16} 
                color={sameDayUnlocked ? theme.colors.accent : theme.colors.textMuted} 
              />
            </Animated.View>
            <Text style={[styles.label, sameDayUnlocked && styles.labelUnlocked]}>
              {sameDayUnlocked 
                ? '✨ Same-day delivery available!'
                : `Add $${sameDayRemaining.toFixed(2)} for same-day delivery`
              }
            </Text>
          </View>
          <Text style={styles.minAmount}>${SAME_DAY_MIN}</Text>
        </View>
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill, 
              { width: `${sameDayProgress * 100}%` },
            ]}
          >
            <Animated.View 
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] }
              ]} 
            />
          </LinearGradient>
        </View>
      </View>

      {/* Free Delivery Progress */}
      <View style={[styles.progressSection, styles.progressSectionLast]}>
        <View style={styles.textRow}>
          <View style={styles.labelRow}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <Ionicons 
                name={freeDeliveryUnlocked ? "checkmark-circle" : "gift-outline"} 
                size={16} 
                color={freeDeliveryUnlocked ? theme.colors.accent : theme.colors.textMuted} 
              />
            </Animated.View>
            <Text style={[styles.label, freeDeliveryUnlocked && styles.labelUnlocked]}>
              {freeDeliveryUnlocked 
                ? '🎉 FREE delivery unlocked!'
                : `Add $${freeDeliveryRemaining.toFixed(2)} for FREE delivery`
              }
            </Text>
          </View>
          <Text style={styles.minAmount}>${FREE_DELIVERY_MIN}</Text>
        </View>
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={['#F59E0B', '#EF4444', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill, 
              { width: `${freeDeliveryProgress * 100}%` },
            ]}
          >
            <Animated.View 
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] }
              ]} 
            />
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressSectionLast: {
    marginBottom: 0,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 6,
    flex: 1,
  },
  labelUnlocked: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  minAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillComplete: {
    backgroundColor: '#10B981', // Green gradient start
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ skewX: '-20deg' }],
  },
});
