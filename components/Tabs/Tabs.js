import * as React from "react";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Icon } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { theme } from "../../styles/theme";
import { wixCient } from "../../authentication/wixClient";

const ScreenHeight = Dimensions.get("window").height;
const ScreenWidth = Dimensions.get("window").width;

export const TabBar = ({ state, descriptors, navigation }) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
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
      style={{
        flexDirection: "row",
        display: keyboardVisible ? "none" : "flex",
      }}
    >
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
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            activeOpacity={1}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              color: theme.colors.text,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              flexDirection: "column",
              height: ScreenHeight * 0.1,
              backgroundColor: theme.colors.tabBar,
            }}
          >
            <View style={{ position: 'relative' }}>
              <Icon
                size={ScreenWidth * 0.06}
                source={icon}
                style={{
                  opacity: isFocused ? 1 : 0.6,
                }}
                color={isFocused ? theme.colors.tabBarActive : theme.colors.tabBarInactive}
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
                color: isFocused ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                fontSize: 11,
                fontWeight: isFocused ? '600' : '400',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
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
