import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wixCient } from '../../authentication/wixClient';
import { useWixSession } from '../../authentication/session';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

export const NotificationsModal = ({ visible, onClose }) => {
  const { session, isLoggedIn } = useWixSession();
  const queryClient = useQueryClient();

  const subscriptionsQuery = useQuery({
    queryKey: ["back-in-stock-subscriptions", session],
    queryFn: async () => {
      try {
        const { member } = await wixCient.members.getCurrentMember();
        const memberId = member?._id;

        if (!memberId) {
          return { dataItems: [] };
        }

        const res = await wixCient.fetchWithAuth(
          `https://www.wixapis.com/wix-data/v2/items/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dataCollectionId: "BackInStockSubscriptions",
              query: {
                filter: {
                  notified: false,
                  memberId,
                },
              },
            }),
          },
        );
        return res.json();
      } catch (error) {
        console.log('⚠️ Notifications fetch failed:', error?.message);
        // Return empty rather than throwing — prevents error UI for session issues
        return { dataItems: [] };
      }
    },
    enabled: visible && isLoggedIn,
    retry: false,
  });

  const removeSubscriptionMutation = useMutation({
    mutationFn: async (itemId) => {
      const res = await wixCient.fetchWithAuth(
        `https://www.wixapis.com/wix-data/v2/items/${itemId}?dataCollectionId=BackInStockSubscriptions`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["back-in-stock-subscriptions"]);
    },
  });

  const subscriptions = subscriptionsQuery.data?.dataItems || [];

  const renderSubscriptionItem = ({ item }) => (
    <View style={styles.subscriptionItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.data?.productName || "Unknown Product"}
        </Text>
        <Text style={styles.subscriptionDate}>
          Subscribed: {item._createdDate ? format(new Date(item._createdDate), "MMM dd, yyyy") : "N/A"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeSubscriptionMutation.mutate(item._id)}
        disabled={removeSubscriptionMutation.isPending}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        {removeSubscriptionMutation.isPending ? (
          <ActivityIndicator size="small" color={theme.colors.error} />
        ) : (
          <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color={theme.colors.accent} />
              <Text style={styles.headerTitle}>Stock Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {!isLoggedIn ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="log-in-outline" size={64} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Sign in required</Text>
                <Text style={styles.emptySubtitle}>
                  Sign in to view and manage your stock notifications
                </Text>
              </View>
            ) : subscriptionsQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : subscriptionsQuery.isError ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
                <Text style={styles.emptyTitle}>Failed to load</Text>
                <Text style={styles.emptySubtitle}>Please try again later</Text>
              </View>
            ) : subscriptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  Subscribe to out-of-stock products to get notified when they're back
                </Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={theme.colors.accent} />
                  <Text style={styles.infoText}>
                    You'll receive a push notification when these products are back in stock
                  </Text>
                </View>
                
                <FlatList
                  data={subscriptions}
                  renderItem={renderSubscriptionItem}
                  keyExtractor={(item, index) => item._id?.toString() || `notification-${index}`}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.85,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  listContainer: {
    paddingBottom: 16,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subscriptionDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: theme.colors.error + '15',
    borderRadius: 8,
  },
});

export default NotificationsModal;
