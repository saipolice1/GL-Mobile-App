import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { View, TouchableOpacity, Text as RNText } from "react-native";
import { Divider, Text } from "react-native-paper";
import { wixCient } from "../../../authentication/wixClient";
import { ErrorView } from "../../../components/ErrorView/ErrorView";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import Routes from "../../../routes/routes";
import { usePreventBackNavigation } from "../../../utils/usePreventBackNavigation";
import { theme } from "../../../styles/theme";

export function CheckoutThankYouScreen({ route, navigation }) {
  usePreventBackNavigation({ navigation });

  const orderQuery = useQuery({
    queryKey: ["order", route.params.orderId],
    queryFn: () => wixCient.orders.getOrder(route.params.orderId),
    retry: (failureCount, error) => {
      // Don't retry if it's a permission error
      const isPermissionError = 
        error?.details?.applicationError?.code === 'READ_ORDER_FORBIDDEN' ||
        error?.message?.toLowerCase().includes('permission denied') ||
        error?.message?.toLowerCase().includes('forbidden');
      
      if (isPermissionError) {
        return false; // Don't retry permission errors
      }
      return failureCount < 3;
    },
  });

  if (orderQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (orderQuery.isError) {
    // Check if it's a permission error
    const isPermissionError = 
      orderQuery.error?.details?.applicationError?.code === 'READ_ORDER_FORBIDDEN' ||
      orderQuery.error?.message?.toLowerCase().includes('permission denied') ||
      orderQuery.error?.message?.toLowerCase().includes('forbidden');
    
    if (isPermissionError) {
      // Show success message without order details if permissions are denied
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
          <Text style={{ marginTop: 20, textAlign: 'center' }}>
            Your order has been placed successfully.
          </Text>
          <Text style={{ marginTop: 10, textAlign: 'center' }}>
            You'll receive an email confirmation shortly.
          </Text>
          <Text style={{ marginTop: 10, textAlign: 'center', color: theme.colors.textMuted, fontSize: 12 }}>
            Order ID: {route.params.orderId}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(Routes.home)}
            style={{
              marginTop: 40,
              backgroundColor: theme.colors.text,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
            }}
          >
            <RNText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Continue Shopping
            </RNText>
          </TouchableOpacity>
        </View>
      );
    }
    
    return <ErrorView message={orderQuery.error.message} />;
  }

  const fullName =
    orderQuery.data.billingInfo.contactDetails.firstName +
    " " +
    orderQuery.data.billingInfo.contactDetails.lastName;

  return (
    <View
      style={{
        alignItems: "center",
        height: "100%",
      }}
    >
      <Text variant="titleLarge" style={{ marginTop: 50 }}>
        Thank you, {fullName}
      </Text>
      <Text style={{ marginTop: 20 }}>
        You'll receive an email confirmation shortly.
      </Text>
      <Text style={{ marginTop: 20 }}>
        Order number: {orderQuery.data.number}
      </Text>

      <Divider />
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 40,
          marginVertical: 20,
        }}
      >
        <Text style={{ flexGrow: 1 }}>Subtotal</Text>
        <Text>{orderQuery.data.priceSummary.subtotal.formattedAmount}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 40,
        }}
      >
        <Text style={{ flexGrow: 1 }}>Sales Tax</Text>
        <Text>{orderQuery.data.priceSummary.tax.formattedAmount}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 40,
          marginTop: 20,
        }}
      >
        <Text variant="titleLarge" style={{ flexGrow: 1 }}>
          Total
        </Text>
        <Text>{orderQuery.data.priceSummary.total.formattedAmount}</Text>
      </View>
      <View style={{ flexGrow: 1 }} />
      <View style={{ padding: 20, width: "100%" }}>
        <TouchableOpacity
          style={{ 
            width: "100%", 
            backgroundColor: theme.colors.accent,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
          }}
          onPress={() => {
            navigation.navigate(Routes.Products);
          }}
          activeOpacity={0.8}
        >
          <RNText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Continue Shopping
          </RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
