import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { getFavoritesCount, subscribeFavorites } from '../../services/favorites';

// Grafton Liquor branding colors
const BRAND_BROWN = '#4A2C2A';
const BRAND_ORANGE = '#D4632A';
const BRAND_GOLD = '#B8860B';
const BRAND_CREAM = '#F5F0E6';

export const LogoHeader = ({ compact = false, onWishlistPress, onNotificationsPress }) => {
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    loadWishlistCount();
    const unsubscribe = subscribeFavorites(() => {
      loadWishlistCount();
    });
    return unsubscribe;
  }, []);

  const loadWishlistCount = async () => {
    const count = await getFavoritesCount();
    setWishlistCount(count);
  };

  if (compact) {
    // Compact version for scrolled state
    return (
      <View style={styles.containerCompact}>
        <View style={styles.compactLogoRow}>
          <View style={styles.compactIconWrapper}>
            <MaterialCommunityIcons name="glass-wine" size={20} color={BRAND_ORANGE} />
          </View>
          <View style={styles.compactTextContainer}>
            <Text style={styles.compactBrandName}>GRAFTON</Text>
            <Text style={styles.compactLiquorText}>LIQUOR</Text>
          </View>
          
          {/* Action Buttons Row - Right Side */}
          <View style={styles.actionButtonsRow}>
            {/* Wishlist Button */}
            {onWishlistPress && (
              <TouchableOpacity 
                style={styles.wishlistButton}
                onPress={onWishlistPress}
                activeOpacity={0.7}
              >
                <Ionicons name="heart-outline" size={24} color={BRAND_BROWN} />
                {wishlistCount > 0 && (
                  <View style={styles.wishlistBadge}>
                    <Text style={styles.wishlistBadgeText}>
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            {/* Notifications Button */}
            {onNotificationsPress && (
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={onNotificationsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={24} color={BRAND_BROWN} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action Buttons - Top Right */}
      <View style={styles.actionButtonsAbsolute}>
        {/* Wishlist Button */}
        {onWishlistPress && (
          <TouchableOpacity 
            style={styles.wishlistButtonAbsolute}
            onPress={onWishlistPress}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={26} color={BRAND_BROWN} />
            {wishlistCount > 0 && (
              <View style={styles.wishlistBadge}>
                <Text style={styles.wishlistBadgeText}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        {/* Notifications Button */}
        {onNotificationsPress && (
          <TouchableOpacity 
            style={styles.notificationButtonAbsolute}
            onPress={onNotificationsPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={26} color={BRAND_BROWN} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.logoContainer}>
        {/* Top decorative line */}
        <View style={styles.decorativeLine}>
          <View style={styles.lineSegment} />
          <MaterialCommunityIcons name="star-four-points" size={10} color={BRAND_GOLD} />
          <View style={styles.lineSegment} />
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>BEER ★ WINE ★ SPIRITS</Text>
        
        {/* Main Logo with Icon */}
        <View style={styles.mainLogoRow}>
          {/* Left icon cluster */}
          <View style={styles.iconCluster}>
            <MaterialCommunityIcons name="glass-mug-variant" size={24} color={BRAND_ORANGE} />
          </View>
          
          {/* Brand Name */}
          <View style={styles.brandNameContainer}>
            <Text style={styles.brandNameMain}>GRAFTON</Text>
            <View style={styles.liquorBadge}>
              <Text style={styles.liquorText}>LIQUOR</Text>
            </View>
          </View>
          
          {/* Right icon cluster */}
          <View style={styles.iconCluster}>
            <MaterialCommunityIcons name="glass-wine" size={24} color={BRAND_ORANGE} />
          </View>
        </View>
        
        {/* Established badge */}
        <View style={styles.establishedRow}>
          <View style={styles.smallLine} />
          <Text style={styles.establishedText}>EST. 2024 • PREMIUM SELECTION</Text>
          <View style={styles.smallLine} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
  },
  containerCompact: {
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  compactLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_ORANGE,
    marginRight: 8,
  },
  compactTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactBrandName: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_BROWN,
    letterSpacing: 1,
  },
  compactLiquorText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_ORANGE,
    letterSpacing: 0.5,
  },
  logoContainer: {
    alignItems: 'center',
  },
  decorativeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  lineSegment: {
    width: 40,
    height: 1.5,
    backgroundColor: BRAND_GOLD,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND_ORANGE,
    letterSpacing: 5,
    marginBottom: 8,
  },
  mainLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCluster: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: BRAND_ORANGE,
  },
  brandNameContainer: {
    alignItems: 'center',
  },
  brandNameMain: {
    fontSize: 40,
    fontWeight: '900',
    color: BRAND_BROWN,
    letterSpacing: 5,
    textShadowColor: 'rgba(74, 44, 42, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  liquorBadge: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: -3,
  },
  liquorText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  establishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  smallLine: {
    width: 25,
    height: 1.5,
    backgroundColor: BRAND_BROWN,
    opacity: 0.4,
  },
  establishedText: {
    fontSize: 9,
    fontWeight: '600',
    color: BRAND_BROWN,
    letterSpacing: 3,
    opacity: 0.8,
  },
  // Action buttons row
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  actionButtonsAbsolute: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  // Notification button styles
  notificationButton: {
    padding: 8,
  },
  notificationButtonAbsolute: {
    padding: 8,
  },
  // Wishlist button styles
  wishlistButton: {
    padding: 8,
  },
  wishlistButtonAbsolute: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  wishlistBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wishlistBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default LogoHeader;
