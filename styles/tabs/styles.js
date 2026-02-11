import { StyleSheet } from "react-native";
import { theme } from "../theme";
import { IS_TABLET, rs } from "../utils/responsive";

export const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: IS_TABLET ? 72 : 60,
  },
  icon: {
    width: rs(24),
    height: rs(24),
    tintColor: theme.colors.tabBarInactive,
  },
  selectedIcon: {
    width: rs(24),
    height: rs(24),
    tintColor: theme.colors.tabBarActive,
  },
  label: {
    fontSize: IS_TABLET ? 13 : 11,
    fontWeight: '500',
    color: theme.colors.tabBarInactive,
  },
  labelFocused: {
    fontSize: IS_TABLET ? 13 : 11,
    fontWeight: '600',
    color: theme.colors.tabBarActive,
  },
});
