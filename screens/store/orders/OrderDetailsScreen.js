import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { wixCient } from '../../../authentication/wixClient';
import { theme } from '../../../styles/theme';
import Routes from '../../../routes/routes';

// ── Status helpers ────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP = {
  // fulfillmentStatus values from Wix
  NOT_FULFILLED: { label: 'Order Placed', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  PARTIALLY_FULFILLED: { label: 'Partially Shipped', color: '#3B82F6', bg: '#EFF6FF', icon: 'cube-outline' },
  FULFILLED: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
  // Push notification status values
  ORDER_PLACED: { label: 'Order Placed', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  ORDER_SHIPPED: { label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF', icon: 'cube-outline' },
  ORDER_OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#8B5CF6', bg: '#F5F3FF', icon: 'bicycle-outline' },
  ORDER_DELIVERED: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
};

const PAYMENT_STATUS_MAP = {
  PAID: { label: 'Paid', color: '#10B981' },
  NOT_PAID: { label: 'Unpaid', color: '#EF4444' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: '#F59E0B' },
  REFUNDED: { label: 'Refunded', color: '#6B7280' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', color: '#6B7280' },
};

const TIMELINE_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed', icon: 'receipt-outline' },
  { key: 'ORDER_SHIPPED', label: 'Shipped', icon: 'cube-outline' },
  { key: 'ORDER_OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: 'bicycle-outline' },
  { key: 'ORDER_DELIVERED', label: 'Delivered', icon: 'checkmark-circle-outline' },
];

/**
 * Map a Wix fulfillmentStatus to a timeline step index
 */
const fulfillmentToStep = (fulfillmentStatus) => {
  switch (fulfillmentStatus) {
    case 'NOT_FULFILLED': return 0;
    case 'PARTIALLY_FULFILLED': return 1;
    case 'FULFILLED': return 3;
    default: return 0;
  }
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusChip = ({ status }) => {
  const info = ORDER_STATUS_MAP[status] || { label: status, color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle-outline' };
  return (
    <View style={[chipStyles.container, { backgroundColor: info.bg, borderColor: info.color }]}>
      <Ionicons name={info.icon} size={16} color={info.color} />
      <Text style={[chipStyles.label, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const Timeline = ({ currentStep }) => (
  <View style={timelineStyles.container}>
    {TIMELINE_STEPS.map((step, index) => {
      const done = index <= currentStep;
      const active = index === currentStep;
      return (
        <View key={step.key} style={timelineStyles.row}>
          <View style={timelineStyles.lineCol}>
            <View style={[timelineStyles.dot, done && timelineStyles.dotDone, active && timelineStyles.dotActive]}>
              <Ionicons name={step.icon} size={14} color={done ? '#fff' : theme.colors.textMuted} />
            </View>
            {index < TIMELINE_STEPS.length - 1 && (
              <View style={[timelineStyles.line, done && timelineStyles.lineDone]} />
            )}
          </View>
          <Text style={[timelineStyles.label, done && timelineStyles.labelDone]}>{step.label}</Text>
        </View>
      );
    })}
  </View>
);

const timelineStyles = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  lineCol: { alignItems: 'center', width: 32, marginRight: 12 },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  dotDone: { backgroundColor: theme.colors.secondary },
  dotActive: { backgroundColor: theme.colors.accent, shadowColor: theme.colors.accent, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 },
  line: { width: 2, height: 28, backgroundColor: theme.colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: theme.colors.secondary },
  label: { fontSize: 13, color: theme.colors.textMuted, paddingTop: 6 },
  labelDone: { color: theme.colors.text, fontWeight: '600' },
});

const SectionCard = ({ title, children }) => (
  <View style={sectionStyles.card}>
    {title && <Text style={sectionStyles.title}>{title}</Text>}
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export function OrderDetailsScreen({ navigation, route }) {
  const { orderId, orderNumber } = route?.params || {};

  const orderQuery = useQuery({
    queryKey: ['order-details', orderId, orderNumber],
    queryFn: async () => {
      // Try fetch by orderId first
      if (orderId) {
        try {
          const res = await wixCient.fetchWithAuth(
            `https://www.wixapis.com/stores/v2/orders/${orderId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          const data = await res.json();
          if (data?.order) return data.order;
        } catch (e) {
          console.log('Order fetch by id failed, trying by number:', e.message);
        }
      }

      // Fallback: search by orderNumber
      const res = await wixCient.fetchWithAuth(
        `https://www.wixapis.com/stores/v2/orders/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: {
              filter: orderNumber ? JSON.stringify({ number: { $eq: Number(orderNumber) } }) : undefined,
              paging: { limit: 50 },
            },
          }),
        }
      );
      const data = await res.json();
      const orders = data?.orders || [];

      if (orderNumber) {
        const match = orders.find(o => String(o.number) === String(orderNumber));
        if (match) return match;
      }

      if (orders.length > 0) return orders[0];
      throw new Error('Order not found');
    },
    retry: 1,
  });

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Profile);
    }
  }, [navigation]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (orderQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / Not Found ─────────────────────────────────────────────────────
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.textMuted} />
          <Text style={styles.errorTitle}>Order not found</Text>
          <Text style={styles.errorSubtitle}>
            {orderNumber ? `Order #${orderNumber} could not be loaded.` : 'This order could not be found.'}
          </Text>
          <TouchableOpacity style={styles.backToOrdersBtn} onPress={goBack}>
            <Text style={styles.backToOrdersBtnText}>Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render Order ──────────────────────────────────────────────────────────
  const order = orderQuery.data;
  const fulfillmentStatus = order.fulfillmentStatus || 'NOT_FULFILLED';
  const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: theme.colors.textMuted };
  const timelineStep = fulfillmentToStep(fulfillmentStatus);

  const shippingAddress = order.shippingInfo?.shipmentDetails?.address || order.shippingInfo?.logistics?.shippingDestination?.address;
  const trackingNumber = order.shippingInfo?.shipmentDetails?.trackingNumber;
  const trackingUrl = order.shippingInfo?.shipmentDetails?.trackingUrl;

  const subtotal = Number.parseFloat(order.totals?.subtotal || 0);
  const tax = Number.parseFloat(order.totals?.tax || 0);
  const shipping = Number.parseFloat(order.totals?.shipping || 0);
  const discount = Number.parseFloat(order.totals?.discount || 0);
  const total = Number.parseFloat(order.totals?.total || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.number}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Status + Date */}
        <SectionCard>
          <View style={styles.statusRow}>
            <StatusChip status={fulfillmentStatus} />
            <Text style={styles.paymentBadge}>
              <Text style={{ color: paymentInfo.color }}>● </Text>{paymentInfo.label}
            </Text>
          </View>
          <Text style={styles.dateText}>
            Placed {format(new Date(order.dateCreated), 'MMM dd, yyyy • h:mm a')}
          </Text>
        </SectionCard>

        {/* Delivery Timeline */}
        {fulfillmentStatus !== 'CANCELLED' && (
          <SectionCard title="Delivery Status">
            <Timeline currentStep={timelineStep} />
          </SectionCard>
        )}

        {/* Tracking */}
        {trackingNumber && (
          <SectionCard title="Tracking">
            <Text style={styles.trackingNumber}>Tracking #: {trackingNumber}</Text>
            {trackingUrl && (
              <TouchableOpacity
                style={styles.trackingBtn}
                onPress={() => Linking.openURL(trackingUrl)}
              >
                <Ionicons name="open-outline" size={16} color={theme.colors.textLight} />
                <Text style={styles.trackingBtnText}>Track Shipment</Text>
              </TouchableOpacity>
            )}
          </SectionCard>
        )}

        {/* Items */}
        <SectionCard title={`Items (${order.lineItems?.length || 0})`}>
          {(order.lineItems || []).map((item, index) => (
            <View key={item.id || index} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
              <Image
                source={{ uri: item.mediaItem?.url || 'https://via.placeholder.com/60' }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {order.currency} {(Number.parseFloat(item.totalPrice || item.price || 0)).toFixed(2)}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Order Totals */}
        <SectionCard title="Order Summary">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{order.currency} {subtotal.toFixed(2)}</Text>
          </View>
          {shipping > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{order.currency} {shipping.toFixed(2)}</Text>
            </View>
          )}
          {tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{order.currency} {tax.toFixed(2)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>-{order.currency} {discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{order.currency} {total.toFixed(2)}</Text>
          </View>
        </SectionCard>

        {/* Delivery Address */}
        {shippingAddress && (
          <SectionCard title="Delivery Address">
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={styles.addressText}>
                {[
                  shippingAddress.addressLine,
                  shippingAddress.city,
                  shippingAddress.subdivision,
                  shippingAddress.postalCode,
                  shippingAddress.country,
                ].filter(Boolean).join(', ')}
              </Text>
            </View>
          </SectionCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  backToOrdersBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backToOrdersBtnText: {
    color: theme.colors.textLight,
    fontWeight: '600',
    fontSize: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentBadge: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  trackingNumber: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  trackingBtnText: {
    color: theme.colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
