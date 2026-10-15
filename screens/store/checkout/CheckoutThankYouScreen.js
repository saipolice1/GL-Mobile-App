import * as Sentry from "@sentry/react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { View, TouchableOpacity, Text as RNText } from "react-native";
import { Divider, Text } from "react-native-paper";
import { wixCient } from "../../../authentication/wixClient";
import { ErrorView } from "../../../components/ErrorView/ErrorView";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import Routes from "../../../routes/routes";
import { usePreventBackNavigation } from "../../../utils/usePreventBackNavigation";
import { theme } from "../../../styles/theme";
import {
  buildOrderDiagnostics,
  getCustomerName,
  getOrderNumber,
  getPriceRows,
  isWixPermissionError,
} from "../../../utils/orderDiagnostics";

function ContinueShoppingButton({ navigation, style }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(Routes.Home)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Continue shopping"
      style={{
        backgroundColor: theme.colors.accent,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        alignItems: "center",
        ...style,
      }}
    >
      <RNText style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
        Continue Shopping
      </RNText>
    </TouchableOpacity>
  );
}

// Shown when we can't load the order details (no orderId, or Wix denies
// read permission) — the order itself was still placed successfully.
function GenericThankYou({ navigation, orderId }) {
  return (
    <View
      style={{
        alignItems: "center",
        height: "100%",
        padding: 20,
      }}
    >
      <Text variant="titleLarge" style={{ marginTop: 50 }}>
        Thank you!
      </Text>
      <Text style={{ marginTop: 20, textAlign: "center" }}>
        Your order has been placed successfully.
      </Text>
      <Text style={{ marginTop: 10, textAlign: "center" }}>
        You'll receive an email confirmation shortly.
      </Text>
      {orderId ? (
        <Text
          style={{
            marginTop: 10,
            textAlign: "center",
            color: theme.colors.textMuted,
            fontSize: 12,
          }}
        >
          Order ID: {orderId}
        </Text>
      ) : null}
      <ContinueShoppingButton navigation={navigation} style={{ marginTop: 40 }} />
    </View>
  );
}

export function CheckoutThankYouScreen({ route, navigation }) {
  usePreventBackNavigation({ navigation });
  const queryClient = useQueryClient();
  const orderId = route.params?.orderId;

  // Clear the cart cache — Wix creates a new cart after order is placed
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["currentCart"] });
  }, []);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => wixCient.orders.getOrder(orderId),
    enabled: Boolean(orderId),
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (isWixPermissionError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
  const order = orderQuery.data;

  // Report unexpected order shapes so we can see them in Sentry
  useEffect(() => {
    if (!orderId) {
      Sentry.captureMessage(
        "CheckoutThankYouScreen: opened without an orderId route param",
        { level: "warning" }
      );
      return;
    }
    if (!order) {
      return;
    }
    const diagnostics = buildOrderDiagnostics(order, orderId);
    const missingOptionalFields =
      !diagnostics.hasPriceSummary || !getCustomerName(order);
    if (missingOptionalFields) {
      Sentry.captureMessage(
        "CheckoutThankYouScreen: order returned without optional fields",
        { level: "warning", extra: diagnostics }
      );
    }
  }, [order, orderId]);

  if (!orderId) {
    return <GenericThankYou navigation={navigation} />;
  }

  if (orderQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (orderQuery.isError) {
    if (isWixPermissionError(orderQuery.error)) {
      // Show success message without order details if permissions are denied
      return <GenericThankYou navigation={navigation} orderId={orderId} />;
    }

    return (
      <ErrorView
        message={orderQuery.error?.message}
        onRetry={orderQuery.refetch}
      />
    );
  }

  const customerName = getCustomerName(order);
  const orderNumber = getOrderNumber(order, orderId);
  const priceRows = getPriceRows(order);

  return (
    <View
      style={{
        alignItems: "center",
        height: "100%",
      }}
    >
      <Text variant="titleLarge" style={{ marginTop: 50 }}>
        {customerName ? `Thank you, ${customerName}` : "Thank you!"}
      </Text>
      <Text style={{ marginTop: 20 }}>
        You'll receive an email confirmation shortly.
      </Text>
      {orderNumber ? (
        <Text style={{ marginTop: 20 }}>Order number: {orderNumber}</Text>
      ) : null}

      <Divider style={{ alignSelf: "stretch", marginHorizontal: 40, marginTop: 20 }} />
      {priceRows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: "row",
            marginHorizontal: 40,
            marginVertical: row.isTotal ? 0 : 10,
            marginTop: row.isTotal ? 20 : 10,
          }}
        >
          <Text
            variant={row.isTotal ? "titleLarge" : undefined}
            style={{ flexGrow: 1 }}
          >
            {row.label}
          </Text>
          <Text>{row.value}</Text>
        </View>
      ))}
      <View style={{ flexGrow: 1 }} />
      <View style={{ padding: 20, width: "100%" }}>
        <ContinueShoppingButton navigation={navigation} style={{ width: "100%" }} />
      </View>
    </View>
  );
}
