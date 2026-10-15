import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Icon } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../styles/theme";
import { IS_SMALL_PHONE } from "../../utils/responsive";
import { wixCient } from "../../authentication/wixClient";

const ScreenWidth = Dimensions.get("window").width;

// Floating pill tab bar sizing (tighter on small phones)
const TAB_HEIGHT = IS_SMALL_PHONE ? 46 : 52;
const TAB_PADDING_H = IS_SMALL_PHONE ? 4 : 8;

// Screens where the tab bar should be hidden
const HIDDEN_TAB_SCREENS = ['Checkout', 'CheckoutThankYou'];

// Check if any nested navigator is showing a screen that should hide tabs
function shouldHideTabBar(state) {
  if (!state) return false;

  const activeRoute = state.routes[state.index];

  // Check if this route's name should hide tabs
  if (HIDDEN_TAB_SCREENS.includes(activeRoute.name)) {
    return true;
  }

  // Check nested navigators (e.g., Cart tab has a stack with Checkout inside)
  if (activeRoute.state) {
    return shouldHideTabBar(activeRoute.state);
  }

  return false;
}

export const TabBar = ({ state, descriptors, navigation }) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Inner width of the pill (measured on layout) used to size/position the blob
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const hasPositioned = useRef(false);

  const tabWidth = barWidth > 0 ? barWidth / state.routes.length : 0;

  // Slide the highlight blob to the active tab with a little "stretch"
  useEffect(() => {
    if (!tabWidth) return;

    const targetX = state.index * tabWidth - TAB_PADDING_H / 2;

    // First measurement: jump straight to the active tab without animating
    if (!hasPositioned.current) {
      translateX.setValue(targetX);
      hasPositioned.current = true;
      return;
    }

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        friction: 9,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: 1.25,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(scaleX, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, tabWidth]);

  // Check if we should hide tabs (e.g., during checkout)
  const hideTabBar = shouldHideTabBar(state);

  // Fetch cart to get item count
  const { data: currentCart } = useQuery({
    queryKey: ['currentCart'],
    queryFn: async () => {
      try {
        return await wixCient.currentCart.getCurrentCart();
      } catch (error) {
        if (error?.message?.includes('OWNED_CART_NOT_FOUND')) {
          return null;
        }
        return null;
      }
    },
  });

  // Calculate total items in cart
  const cartItemCount = currentCart?.lineItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const keyboardDidShow = () => {
    setKeyboardVisible(true);
  };

  const keyboardDidHide = () => {
    setKeyboardVisible(false);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      keyboardDidShow,
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      keyboardDidHide,
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: keyboardVisible || hideTabBar ? "none" : "flex",
        backgroundColor: "transparent",
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      <View
        style={tabStyles.pill}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - 16)}
      >
        {barWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              tabStyles.blob,
              {
                width: tabWidth + TAB_PADDING_H,
                transform: [{ translateX }, { scaleX }],
              },
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const icon = options.tabBarIcon;
          const isFocused = state.index === index;
          const isCartTab = route.name === 'Cart';

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };
          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || `${label} tab`}
              testID={options.tabBarTestID}
              activeOpacity={1}
              onPress={onPress}
              onLongPress={onLongPress}
              style={tabStyles.tabItem}
            >
              <View style={tabStyles.tabInner}>
                <View style={{ position: 'relative' }}>
                  <Icon
                    size={ScreenWidth * 0.06}
                    source={icon}
                    color={isFocused ? theme.colors.tabBarActive : theme.colors.text}
                  />
                  {isCartTab && cartItemCount > 0 && (
                    <View style={tabStyles.badge}>
                      <Text style={tabStyles.badgeText}>
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    color: isFocused ? theme.colors.tabBarActive : theme.colors.text,
                    fontSize: 11,
                    fontWeight: isFocused ? '600' : '400',
                  }}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: IS_SMALL_PHONE ? 0 : 66,
    height: TAB_HEIGHT,
    paddingHorizontal: IS_SMALL_PHONE ? 4 : 8,
  },
  blob: {
    position: 'absolute',
    left: 8,
    top: 8,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.055)',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
});
