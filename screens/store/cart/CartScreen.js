import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentCart } from "@wix/ecom";
import * as Linking from "expo-linking";
import _, { isInteger } from "lodash";
import * as React from "react";
import { useEffect, useRef } from "react";
import { 
  RefreshControl, 
  ScrollView, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { wixCient } from "../../../authentication/wixClient";
import { WixMediaImage } from "../../../WixMediaImage";
import Routes from "../../../routes/routes";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { CheckoutThankYouScreen } from "../checkout/CheckoutThankYouScreen";
import { ProductScreen } from "../product/ProductScreen";
import { theme } from "../../../styles/theme";

const Stack = createNativeStackNavigator();

const SAME_DAY_MIN = 80;
const FREE_DELIVERY_MIN = 200;

// Animated Pressable Button
const AnimatedButton = ({ onPress, style, disabled, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Delivery Progress Component for Cart with Animations
const CartDeliveryProgress = ({ cartTotal }) => {
  const sameDayRemaining = Math.max(0, SAME_DAY_MIN - cartTotal);
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_MIN - cartTotal);
  
  const sameDayProgress = Math.min(1, cartTotal / SAME_DAY_MIN);
  const freeDeliveryProgress = Math.min(1, cartTotal / FREE_DELIVERY_MIN);
  
  const sameDayUnlocked = cartTotal >= SAME_DAY_MIN;
  const freeDeliveryUnlocked = cartTotal >= FREE_DELIVERY_MIN;

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when thresholds are unlocked
  useEffect(() => {
    if (sameDayUnlocked || freeDeliveryUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [sameDayUnlocked, freeDeliveryUnlocked]);

  // Shimmer effect for progress bars
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Bouncing icons
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Glow effect when close to threshold
  useEffect(() => {
    if ((sameDayProgress > 0.7 && !sameDayUnlocked) || (freeDeliveryProgress > 0.7 && !freeDeliveryUnlocked)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [sameDayProgress, freeDeliveryProgress]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 250],
  });

  return (
    <Animated.View style={[cartStyles.deliveryContainer, { transform: [{ scale: pulseAnim }] }]}>
      {/* Same Day Delivery */}
      <View style={cartStyles.deliveryRow}>
        <Animated.View style={[cartStyles.deliveryIcon, { transform: [{ translateY: bounceAnim }] }]}>
          <Ionicons 
            name={sameDayUnlocked ? "checkmark-circle" : "bicycle"} 
            size={20} 
            color={sameDayUnlocked ? theme.colors.accent : theme.colors.textMuted} 
          />
        </Animated.View>
        <View style={cartStyles.deliveryInfo}>
          <Text style={[cartStyles.deliveryLabel, sameDayUnlocked && cartStyles.deliveryUnlocked]}>
            {sameDayUnlocked 
              ? '✨ Same-day delivery available!'
              : `Add $${sameDayRemaining.toFixed(2)} for same-day delivery`
            }
          </Text>
          <View style={cartStyles.progressBar}>
            <View style={[
              cartStyles.progressFill, 
              { width: `${sameDayProgress * 100}%` },
              sameDayUnlocked && cartStyles.progressComplete
            ]}>
              <Animated.View 
                style={[
                  cartStyles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Free Delivery */}
      <View style={[cartStyles.deliveryRow, { marginTop: 12 }]}>
        <Animated.View style={[cartStyles.deliveryIcon, { transform: [{ translateY: bounceAnim }] }]}>
          <Ionicons 
            name={freeDeliveryUnlocked ? "checkmark-circle" : "gift"} 
            size={20} 
            color={freeDeliveryUnlocked ? theme.colors.accent : theme.colors.textMuted} 
          />
        </Animated.View>
        <View style={cartStyles.deliveryInfo}>
          <Text style={[cartStyles.deliveryLabel, freeDeliveryUnlocked && cartStyles.deliveryUnlocked]}>
            {freeDeliveryUnlocked 
              ? '🎉 FREE delivery unlocked!'
              : `Add $${freeDeliveryRemaining.toFixed(2)} for FREE delivery`
            }
          </Text>
          <View style={cartStyles.progressBar}>
            <View style={[
              cartStyles.progressFill, 
              { width: `${freeDeliveryProgress * 100}%` },
              freeDeliveryUnlocked && cartStyles.progressComplete
            ]}>
              <Animated.View 
                style={[
                  cartStyles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Cart Item Component with animations
const CartItemCard = ({ item, currency, onUpdateQuantity, onRemove, isUpdating, index = 0 }) => {
  // Get the Wix image URL from the item
  const wixImageUrl = item.image || item.media?.mainMedia?.image?.url || '';
  const price = Number.parseFloat(item.price?.amount) || 0;
  const total = price * item.quantity;
  
  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Quantity button bounce
  const handleQuantityPress = (newQuantity) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onUpdateQuantity(newQuantity);
  };
  
  return (
    <Animated.View 
      style={[
        cartStyles.cartItem,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <WixMediaImage media={wixImageUrl} width={80} height={80}>
        {({ url }) => (
          <Image source={{ uri: url }} style={cartStyles.itemImage} />
        )}
      </WixMediaImage>
      <View style={cartStyles.itemInfo}>
        <Text style={cartStyles.itemName} numberOfLines={2}>{item.productName?.translated || 'Product'}</Text>
        <Text style={cartStyles.itemPrice}>${price.toFixed(2)} each</Text>
        
        <View style={cartStyles.quantityRow}>
          <View style={cartStyles.quantityControls}>
            <TouchableOpacity 
              style={cartStyles.quantityBtn}
              onPress={() => handleQuantityPress(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
            >
              <Ionicons name="remove" size={18} color={item.quantity <= 1 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
            <Text style={cartStyles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={cartStyles.quantityBtn}
              onPress={() => handleQuantityPress(item.quantity + 1)}
              disabled={isUpdating}
            >
              <Ionicons name="add" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={cartStyles.itemTotal}>${total.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={cartStyles.removeBtn}
        onPress={onRemove}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty Cart Component with animation
const EmptyCart = () => {
  const navigation = useNavigation();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Bounce animation for cart icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[cartStyles.emptyContainer, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Ionicons name="cart-outline" size={80} color={theme.colors.textMuted} />
      </Animated.View>
      <Text style={cartStyles.emptyTitle}>Your cart is empty</Text>
      <Text style={cartStyles.emptySubtitle}>Add some items to get started</Text>
      <AnimatedButton
        style={cartStyles.shopButton}
        onPress={() => navigation.navigate(Routes.Home)}
      >
        <Text style={cartStyles.shopButtonText}>Start Shopping</Text>
      </AnimatedButton>
    </Animated.View>
  );
};

// Smart Delivery Note Component
const SmartDeliveryNote = ({ cartTotal, cartItems = [] }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Check if cart has spirits or wines (for standard shipping eligibility)
  const hasSpiritsOrWines = cartItems.some(item => {
    const productName = (item.productName?.translated || '').toLowerCase();
    return productName.includes('spirit') || 
           productName.includes('whisky') || 
           productName.includes('whiskey') || 
           productName.includes('vodka') || 
           productName.includes('rum') || 
           productName.includes('gin') ||
           productName.includes('tequila') ||
           productName.includes('brandy') ||
           productName.includes('wine') ||
           productName.includes('champagne') ||
           productName.includes('prosecco');
  });

  const canDoSameDay = cartTotal >= SAME_DAY_MIN;
  const canDoFreeDelivery = cartTotal >= FREE_DELIVERY_MIN;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Generate smart delivery message
  const getDeliveryMessage = () => {
    if (canDoFreeDelivery) {
      return {
        icon: 'checkmark-circle',
        color: theme.colors.accent,
        title: '🎉 All delivery options available!',
        subtitle: 'FREE delivery • Same-day delivery • In-store pickup',
      };
    } else if (canDoSameDay) {
      return {
        icon: 'bicycle',
        color: theme.colors.accent,
        title: '✓ Same-day delivery unlocked!',
        subtitle: hasSpiritsOrWines 
          ? 'Same-day delivery • In-store pickup • Standard shipping available'
          : 'Same-day delivery • In-store pickup',
      };
    } else {
      // Under $80
      return {
        icon: 'storefront-outline',
        color: theme.colors.textMuted,
        title: 'In-store pickup available',
        subtitle: hasSpiritsOrWines
          ? `Add $${(SAME_DAY_MIN - cartTotal).toFixed(2)} for delivery options • Standard shipping also available for spirits & wines`
          : `Add $${(SAME_DAY_MIN - cartTotal).toFixed(2)} for delivery options`,
      };
    }
  };

  const deliveryInfo = getDeliveryMessage();

  return (
    <Animated.View style={[cartStyles.deliveryNote, { transform: [{ scale: pulseAnim }] }]}>
      <View style={cartStyles.deliveryNoteIcon}>
        <Ionicons name={deliveryInfo.icon} size={24} color={deliveryInfo.color} />
      </View>
      <View style={cartStyles.deliveryNoteContent}>
        <Text style={[cartStyles.deliveryNoteTitle, { color: deliveryInfo.color }]}>
          {deliveryInfo.title}
        </Text>
        <Text style={cartStyles.deliveryNoteSubtitle}>
          {deliveryInfo.subtitle}
        </Text>
      </View>
    </Animated.View>
  );
};

function CartView() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  // Fetch cart
  const cartQuery = useQuery({
    queryKey: ["currentCart"],
    queryFn: async () => {
      try {
        return await wixCient.currentCart.getCurrentCart();
      } catch (e) {
        if (e?.message?.includes('OWNED_CART_NOT_FOUND')) {
          return null;
        }
        throw e;
      }
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      if (quantity <= 0) {
        return wixCient.currentCart.removeLineItemsFromCurrentCart([itemId]);
      }
      return wixCient.currentCart.updateCurrentCartLineItemQuantity([
        { _id: itemId, quantity: Math.round(quantity) },
      ]);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["currentCart"], response.cart);
    },
  });

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId) => {
      return wixCient.currentCart.removeLineItemsFromCurrentCart([itemId]);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["currentCart"], response.cart);
    },
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setCheckoutLoading(true);
      const currentCheckout = await wixCient.currentCart.createCheckoutFromCurrentCart({
        channelType: currentCart.ChannelType.OTHER_PLATFORM,
      });

      const { redirectSession } = await wixCient.redirects.createRedirectSession({
        ecomCheckout: { checkoutId: currentCheckout.checkoutId },
        callbacks: {
          thankYouPageUrl: Linking.createURL("/store/checkout/thank-you"),
        },
      });

      return redirectSession;
    },
    onSuccess: (redirectSession) => {
      setCheckoutLoading(false);
      if (redirectSession) {
        navigation.navigate(Routes.Checkout, {
          redirectSession,
          cameFrom: "CartView",
        });
      }
    },
    onError: (error) => {
      setCheckoutLoading(false);
      Alert.alert('Checkout Error', 'Failed to proceed to checkout. Please try again.');
    },
  });

  // Loading state
  if (cartQuery.isLoading) {
    return (
      <SafeAreaView style={cartStyles.container} edges={['top']}>
        <View style={cartStyles.header}>
          <Text style={cartStyles.headerTitle}>My Cart</Text>
        </View>
        <View style={cartStyles.loadingContainer}>
          <Text style={cartStyles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty cart or error
  const cart = cartQuery.data;
  const hasItems = cart?.lineItems?.length > 0;

  if (!hasItems) {
    return (
      <SafeAreaView style={cartStyles.container} edges={['top']}>
        <View style={cartStyles.header}>
          <Text style={cartStyles.headerTitle}>My Cart</Text>
        </View>
        <EmptyCart />
      </SafeAreaView>
    );
  }

  // Calculate totals
  const subtotal = cart.lineItems.reduce((acc, item) => {
    return acc + (Number.parseFloat(item.price?.amount) || 0) * item.quantity;
  }, 0);

  const itemCount = cart.lineItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <SafeAreaView style={cartStyles.container} edges={['top']}>
      {/* Header */}
      <View style={cartStyles.header}>
        <Text style={cartStyles.headerTitle}>My Cart</Text>
        <Text style={cartStyles.headerSubtitle}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView 
        style={cartStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={cartQuery.isFetching}
            onRefresh={cartQuery.refetch}
          />
        }
      >
        {/* Delivery Progress */}
        <CartDeliveryProgress cartTotal={subtotal} />

        {/* Cart Items */}
        <View style={cartStyles.itemsContainer}>
          {cart.lineItems.map((item, index) => (
            <CartItemCard
              key={item._id}
              item={item}
              index={index}
              currency={cart.currency}
              onUpdateQuantity={(quantity) => 
                updateQuantityMutation.mutate({ itemId: item._id, quantity })
              }
              onRemove={() => removeMutation.mutate(item._id)}
              isUpdating={updateQuantityMutation.isPending}
            />
          ))}
        </View>

        {/* Smart Delivery Options Note */}
        <SmartDeliveryNote cartTotal={subtotal} cartItems={cart.lineItems} />
      </ScrollView>

      {/* Bottom Checkout Section */}
      <View style={cartStyles.checkoutSection}>
        <View style={cartStyles.totalRow}>
          <Text style={cartStyles.totalLabel}>Subtotal</Text>
          <Text style={cartStyles.totalAmount}>${subtotal.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[cartStyles.checkoutButton, checkoutLoading && cartStyles.checkoutButtonDisabled]}
          onPress={() => checkoutMutation.mutate()}
          disabled={checkoutLoading}
        >
          <Ionicons name="lock-closed" size={18} color={theme.colors.textLight} />
          <Text style={cartStyles.checkoutButtonText}>
            {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
          </Text>
        </TouchableOpacity>
        
        <Text style={cartStyles.secureText}>
          <Ionicons name="shield-checkmark" size={12} color={theme.colors.textMuted} /> Secure checkout
        </Text>
      </View>
    </SafeAreaView>
  );
}

const cartStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textMuted,
  },
  // Delivery Progress
  deliveryContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryIcon: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 6,
  },
  deliveryUnlocked: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: theme.colors.accent,
  },
  // Cart Items
  itemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityBtn: {
    padding: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  removeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  // Delivery Note
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deliveryNoteText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: 10,
    flex: 1,
  },
  // Checkout Section
  checkoutSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  checkoutButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  secureText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  // Empty Cart
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
});

export function CartScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={"CartView"}
    >
      <Stack.Screen name="CartView" component={CartView} />
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen
        name="CheckoutThankYou"
        component={CheckoutThankYouScreen}
      />
    </Stack.Navigator>
  );
}
