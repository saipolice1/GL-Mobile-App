import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkout } from "@wix/ecom";
import { products } from "@wix/stores";
import * as Linking from "expo-linking";
import * as React from "react";
import { Pressable, ScrollView, useWindowDimensions, View, TouchableOpacity, Text as RNText, ActivityIndicator, Image, StyleSheet as RNStyleSheet, Alert } from "react-native";
import {
  Portal,
  Snackbar,
  Text,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import RenderHtml from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons";
import { wixCient } from "../../../authentication/wixClient";
import { SimpleContainer } from "../../../components/Container/SimpleContainer";
import { NumericInput } from "../../../components/Input/NumericInput";
import Routes from "../../../routes/routes";
import { styles } from "../../../styles/store/product/styles";
import { WixMediaImage } from "../../../WixMediaImage";
import { theme as appTheme } from "../../../styles/theme";
import { useNotifications } from "../../../context/NotificationContext";
import { useWixSession } from "../../../authentication/session";

// Custom Accordion Component
const Accordion = ({ title, children, titleStyle, style }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  return (
    <View style={[accordionStyles.container, style]}>
      <TouchableOpacity 
        style={accordionStyles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[accordionStyles.title, titleStyle]}>{title}</Text>
        <Ionicons 
          name={expanded ? "remove" : "add"} 
          size={24} 
          color={appTheme.colors.accent} 
        />
      </TouchableOpacity>
      {expanded && (
        <View style={accordionStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const accordionStyles = RNStyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.text,
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
});

export function ProductScreen({ route, navigation }) {
  const { product, collectionName } = route.params;
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [requestedQuantity, setRequestQuantity] = React.useState(1);
  const [selectedProductOptions, setSelectedProductOptions] = React.useState(
    {},
  );
  const [addToCartSnackBarVisible, setAddToCartSnackBarVisible] =
    React.useState(false);
  const [backInStockSubscribed, setBackInStockSubscribed] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);
  
  const { expoPushToken, permissionGranted } = useNotifications();
  const { isLoggedIn } = useWixSession();

  const selectedVariant = product.variants?.find(
    (variant) =>
      Object.entries(selectedProductOptions).length > 0 &&
      Object.entries(selectedProductOptions).every(
        ([key, value]) => variant.choices[key] === value,
      ),
  );

  const description = product?.description ?? "";

  const buyNowMutation = useMutation({
    mutationFn: async (quantity) => {
      const item = {
        quantity,
        catalogReference: cartCatalogReference(
          product,
          selectedVariant,
          selectedProductOptions,
        ),
      };

      const currentCheckout = await wixCient.checkout.createCheckout({
        lineItems: [item],
        channelType: checkout.ChannelType.OTHER_PLATFORM,
      });

      const { redirectSession } =
        await wixCient.redirects.createRedirectSession({
          ecomCheckout: { checkoutId: currentCheckout._id },
          callbacks: {
            thankYouPageUrl: Linking.createURL("/store/checkout/thank-you"),
            cartPageUrl: Linking.createURL("/store/cart"),
            postFlowUrl: Linking.createURL("/store/products"),
          },
        });

      return redirectSession;
    },
    onSuccess: (redirectSession) => {
      navigation.navigate(Routes.Cart, {
        screen: Routes.Checkout,
        params: { redirectSession, cameFrom: Routes.Store },
        goBack: Routes.Products,
      });
    },
  });

  const addToCurrentCartMutation = useMutation({
    mutationFn: async (quantity) =>
      wixCient.currentCart.addToCurrentCart({
        lineItems: [
          {
            quantity,
            catalogReference: cartCatalogReference(
              product,
              selectedVariant,
              selectedProductOptions,
            ),
          },
        ],
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(["currentCart"], response.cart);
      setAddToCartSnackBarVisible(true);
    },
  });

  const handleBackInStockSubscribe = async () => {
    try {
      // Check if user is logged in
      if (!isLoggedIn) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to receive back-in-stock notifications.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => navigation.navigate(Routes.Account)
            },
          ]
        );
        return;
      }

      setSubscribing(true);

      // Get member info with error handling for expired sessions
      let memberId;
      try {
        const memberResponse = await wixCient.members.getCurrentMember();
        memberId = memberResponse?.member?._id;
      } catch (memberError) {
        console.log('getCurrentMember failed:', memberError?.message || memberError);
        Alert.alert(
          "Sign In Required",
          "Please sign in to receive back-in-stock notifications.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => navigation.navigate(Routes.Account)
            },
          ]
        );
        setSubscribing(false);
        return;
      }

      if (!memberId) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to receive back-in-stock notifications.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => navigation.navigate(Routes.Account)
            },
          ]
        );
        setSubscribing(false);
        return;
      }

      // Get variant ID if applicable
      const variantId = selectedVariant?._id || null;

      // Use a dev token fallback for Expo Go
      const token = expoPushToken || (__DEV__ ? `dev_${memberId}` : null);
      if (!token) {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications to receive back-in-stock alerts.",
          [{ text: "OK" }]
        );
        setSubscribing(false);
        return;
      }

      // Call Wix Velo HTTP function to register subscription
      const response = await fetch('https://www.graftonliquor.co.nz/_functions/backInStockSubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          variantId,
          memberId,
          pushToken: token,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Back-in-stock HTTP error:', response.status, errorText);
        throw new Error('Failed to subscribe');
      }

      setBackInStockSubscribed(true);
      Alert.alert(
        "Subscribed!",
        "We'll notify you when this item is back in stock.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Back-in-stock subscribe failed:', error);
      Alert.alert(
        "Subscription Failed",
        "Unable to subscribe for notifications. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubscribing(false);
    }
  };

  const inStock = productInStock(product, selectedVariant, requestedQuantity);
  const isProductOutOfStock =
    product.stock.inventoryStatus === products.InventoryStatus.OUT_OF_STOCK;
  const allProductOptionsSelected = (product.productOptions ?? []).every(
    (productOption) => productOption.name in selectedProductOptions,
  );

  const canBeAddedToCart = inStock && allProductOptionsSelected;

  return (
    <SimpleContainer
      navigation={navigation}
      title={collectionName}
      backIcon={true}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        styles={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.backContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }]}
          >
            <Ionicons name="chevron-back" size={24} color={appTheme.colors.text} />
            <RNText style={[styles.backButtonText, { marginLeft: 4 }]}>Back To {collectionName}</RNText>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: appTheme.colors.background }]}>
          <WixMediaImage
            media={product.media.mainMedia.image.url}
            height={400}
            width={300}
          >
            {({ url }) => (
              <Image source={{ uri: url }} style={[styles.cardImage, { width: '100%', height: 350, resizeMode: 'contain' }]} />
            )}
          </WixMediaImage>
          {selectedVariant?.variant?.sku && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <RNText style={styles.productSku}>SKU: {selectedVariant?.variant?.sku}</RNText>
            </View>
          )}
          {product.productOptions.map((productOption) => (
            <View style={styles.variantsContainer}>
              <Dropdown
                label={productOption.name}
                options={productOption.choices.map((choice) => ({
                  label: choice.description,
                  value: choice.description,
                }))}
                value={selectedProductOptions[productOption.name]}
                onSelect={(value) => {
                  setSelectedProductOptions((selectedProductOptions) => {
                    const newSelectedProductOptions = {
                      ...selectedProductOptions,
                      [productOption.name]: value,
                    };
                    if (typeof value === "undefined") {
                      delete newSelectedProductOptions[productOption.name];
                    }
                    return newSelectedProductOptions;
                  });
                }}
                mode="outlined"
              />
            </View>
          ))}

          {/* Product Title and Price */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <RNText style={[styles.productTitle, { fontSize: 24, fontWeight: '700', color: appTheme.colors.text }]} numberOfLines={2}>
              {product.name}
            </RNText>
            {selectedVariant?.variant?.convertedPriceData?.formatted?.discountedPrice && (
              <RNText style={{ fontSize: 18, color: appTheme.colors.accent, fontWeight: '600', marginTop: 8 }}>
                {selectedVariant?.variant?.convertedPriceData?.formatted?.discountedPrice}
              </RNText>
            )}
          </View>

          {/* Product Content */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={styles.flexJustifyStart}>
              {isProductOutOfStock ? (
                <View>
                  <RNText style={{ color: "#B22D1D", marginBottom: 12 }}>Out of Stock</RNText>
                  <TouchableOpacity
                    onPress={handleBackInStockSubscribe}
                    disabled={backInStockSubscribed || subscribing}
                    style={{
                      backgroundColor: backInStockSubscribed
                        ? '#E8F5E9'
                        : '#FFF8E1',
                      borderColor: backInStockSubscribed ? '#4CAF50' : '#FFA000',
                      borderWidth: 2,
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      shadowColor: backInStockSubscribed ? '#4CAF50' : '#FFA000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    activeOpacity={0.8}
                  >
                    {subscribing ? (
                      <ActivityIndicator color="#E65100" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={backInStockSubscribed ? "checkmark-circle" : "notifications-outline"}
                          size={20}
                          color={backInStockSubscribed ? '#2E7D32' : '#E65100'}
                        />
                        <RNText style={{
                          color: backInStockSubscribed ? '#2E7D32' : '#E65100',
                          fontSize: 15,
                          fontWeight: '700',
                          letterSpacing: 0.3,
                        }}>
                          {backInStockSubscribed
                            ? "You'll be notified"
                            : "Notify me when back in stock"}
                        </RNText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : !allProductOptionsSelected ? (
                <RNText style={{ color: "#B22D1D" }}>
                  Please select all product options
                </RNText>
              ) : !inStock ? (
                <View>
                  <RNText style={{ color: "#B22D1D", marginBottom: 12 }}>Out of Stock</RNText>
                  <TouchableOpacity
                    onPress={handleBackInStockSubscribe}
                    disabled={backInStockSubscribed || subscribing}
                    style={{
                      backgroundColor: backInStockSubscribed
                        ? '#E8F5E9'
                        : '#FFF8E1',
                      borderColor: backInStockSubscribed ? '#4CAF50' : '#FFA000',
                      borderWidth: 2,
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      shadowColor: backInStockSubscribed ? '#4CAF50' : '#FFA000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    activeOpacity={0.8}
                  >
                    {subscribing ? (
                      <ActivityIndicator color="#E65100" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={backInStockSubscribed ? "checkmark-circle" : "notifications-outline"}
                          size={20}
                          color={backInStockSubscribed ? '#2E7D32' : '#E65100'}
                        />
                        <RNText style={{
                          color: backInStockSubscribed ? '#2E7D32' : '#E65100',
                          fontSize: 15,
                          fontWeight: '700',
                          letterSpacing: 0.3,
                        }}>
                          {backInStockSubscribed
                            ? "You'll be notified"
                            : "Notify me when back in stock"}
                        </RNText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <RNText style={{ fontSize: 13, marginBottom: 8, color: appTheme.colors.text }}>
                    Quantity
                  </RNText>
                  <NumericInput
                    value={requestedQuantity}
                    onChange={(val) => setRequestQuantity(val)}
                    min={1}
                    style={{
                      width: 100,
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                    }}
                  />
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() =>
                addToCurrentCartMutation.mutateAsync(requestedQuantity)
              }
              disabled={!canBeAddedToCart || addToCurrentCartMutation.isPending}
              style={[
                styles.flexGrow1Button,
                {
                  backgroundColor: !canBeAddedToCart
                    ? appTheme.colors.surfaceVariant
                    : appTheme.colors.accent,
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !canBeAddedToCart ? 0.6 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {addToCurrentCartMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <RNText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Add to Cart
                </RNText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => buyNowMutation.mutateAsync(requestedQuantity)}
              disabled={!canBeAddedToCart || buyNowMutation.isPending}
              style={[
                styles.flexGrow1Button,
                {
                  backgroundColor: !canBeAddedToCart
                    ? appTheme.colors.surfaceVariant
                    : appTheme.colors.surface,
                  borderColor: appTheme.colors.accent,
                  borderWidth: 1.5,
                  marginTop: 0,
                  borderRadius: 8,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: !canBeAddedToCart ? 0.6 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {buyNowMutation.isPending ? (
                <ActivityIndicator color={appTheme.colors.accent} />
              ) : (
                <>
                  <Ionicons name="bag-outline" size={20} color={appTheme.colors.accent} />
                  <RNText style={{ color: appTheme.colors.accent, fontSize: 16, fontWeight: '600' }}>
                    Buy Now
                  </RNText>
                </>
              )}
            </TouchableOpacity>
            <RenderHtml
              style={styles.flexJustifyStart}
              source={{ html: description }}
              contentWidth={width}
            />
          </View>
        </View>

        {product.additionalInfoSections.map((section) => (
          <Accordion
            title={section.title}
            key={section.title}
            style={{ backgroundColor: appTheme.colors.surface }}
            titleStyle={{ fontSize: 18, color: appTheme.colors.text }}
          >
            <RenderHtml
              contentWidth={width}
              baseStyle={{ paddingHorizontal: 20, color: appTheme.colors.textSecondary }}
              source={{ html: section.description ?? "" }}
            />
          </Accordion>
        ))}

        <Portal>
          <Snackbar
            visible={addToCartSnackBarVisible}
            onDismiss={() => setAddToCartSnackBarVisible(false)}
            style={{ backgroundColor: appTheme.colors.accent }}
            action={{
              label: "View Cart",
              labelStyle: { color: '#FFFFFF' },
              onPress: () => {
                navigation.navigate(Routes.Cart);
              },
            }}
            duration={5000}
          >
            <RNText style={{ color: '#FFFFFF' }}>Added to Cart</RNText>
          </Snackbar>
        </Portal>
      </ScrollView>
    </SimpleContainer>
  );
}

function cartCatalogReference(
  product,
  selectedVariant,
  selectedProductOptions,
) {
  return {
    catalogItemId: product._id,
    appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e",
    options: product.manageVariants
      ? {
          variantId: selectedVariant?._id,
        }
      : { options: selectedProductOptions },
  };
}

function productInStock(product, selectedVariant, requestedQuantity) {
  if (product.stock.inventoryStatus === products.InventoryStatus.OUT_OF_STOCK) {
    return false;
  }

  if (!product.manageVariants) {
    return true;
  }

  if (!selectedVariant) {
    return false;
  }

  return (
    selectedVariant.stock.inStock &&
    selectedVariant.stock.quantity >= requestedQuantity
  );
}
