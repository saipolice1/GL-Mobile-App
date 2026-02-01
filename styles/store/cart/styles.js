import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  checkoutButton: {
    marginTop: 20,
    backgroundColor: theme.colors.gold,
    margin: 20,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
