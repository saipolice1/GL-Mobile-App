import { StyleSheet, Text, View } from "react-native";
import { useCartQuantities } from "../../hooks/useCartQuantities";

// Small "Only N left" pill shown at the bottom-left of a product image.
export const LowStockBadge = ({ quantity, label, style }) => (
  <View style={[styles.lowStock, style]}>
    <View style={styles.lowStockDot} />
    <Text style={styles.lowStockText}>{label || `Only ${quantity} left`}</Text>
  </View>
);

// Round counter at the top-right of a product image showing how many of
// this product are already in the cart. Renders nothing when none are.
export const InCartBadge = ({ productId, style }) => {
  const quantities = useCartQuantities();
  const inCart = quantities[productId] || 0;

  if (!inCart) return null;

  return (
    <View style={[styles.inCart, style]} accessibilityLabel={`${inCart} in cart`}>
      <Text style={styles.inCartText}>{inCart}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  lowStock: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lowStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E53935",
  },
  lowStockText: {
    color: "#1A1A1A",
    fontSize: 10,
    fontWeight: "600",
  },
  inCart: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    zIndex: 2,
  },
  inCartText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
