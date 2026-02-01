import { StyleSheet } from "react-native";
import { theme } from "../theme";

export const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.tabBarInactive,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.tabBarActive,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.tabBarInactive,
  },
  labelFocused: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.tabBarActive,
  },
});
