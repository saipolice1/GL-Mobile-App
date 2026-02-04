import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Image, TextInput, View, TouchableOpacity, Text as RNText, ActivityIndicator, StyleSheet as RNStyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Avatar,
  Divider,
  IconButton,
  Menu,
  Text,
} from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../../styles/theme";
import { useMemberHandler } from "../../../authentication/MemberHandler";
import { useWixSession } from "../../../authentication/session";
import { wixCient } from "../../../authentication/wixClient";
import { DismissKeyboardScrollView } from "../../../components/DismissKeyboardHOC/DismissKeyboardScrollView";
import { ErrorView } from "../../../components/ErrorView/ErrorView";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import { styles } from "../../../styles/members/styles";
import { usePrice } from "../../store/price";
import Routes from "../../../routes/routes";
import { WIX_PAGES } from "../../webview/WebViewScreen";

// Custom Accordion for MemberView
const MemberAccordion = ({ title, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <View style={memberAccordionStyles.container}>
      <TouchableOpacity 
        style={memberAccordionStyles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <RNText style={memberAccordionStyles.title}>{title}</RNText>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.colors.text} 
        />
      </TouchableOpacity>
      {expanded && (
        <View style={memberAccordionStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const memberAccordionStyles = RNStyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

const FormInput = ({ labelValue, placeholderText, inputValue, onChangeText, ...rest }) => {
  const [localValue, setLocalValue] = React.useState(inputValue || "");
  
  React.useEffect(() => {
    setLocalValue(inputValue || "");
  }, [inputValue]);
  
  const handleChangeText = (text) => {
    setLocalValue(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };
  
  return (
    <View style={styles.accountInputContainer}>
      <Text style={styles.accountInfoText}>{labelValue}:</Text>
      <TextInput
        style={styles.accountInput}
        placeholder={placeholderText}
        placeholderTextColor={theme.colors.textMuted}
        value={localValue}
        onChangeText={handleChangeText}
        {...rest}
      />
    </View>
  );
};

const MemberForm = () => {
  const { firstName, lastName, phone, updateContact } = useMemberHandler();
  const queryClient = useQueryClient();

  const member = queryClient.getQueryData(["currentMember"])?.member;
  return (
    <View style={styles.accountInfo}>
      <Text style={styles.accountInfoTitle}>Account</Text>
      <Text style={styles.accountInfoSubtitle}>
        Update your personal information.
      </Text>
      <Text style={styles.accountInfoText}>Login Email:</Text>
      <Text style={styles.accountInfoText}>
        {member?.loginEmail || "No email found"}
      </Text>
      <Text style={styles.accountInfoSmallText}>
        Your Login email can't be changed.
      </Text>
      <FormInput
        inputValue={firstName}
        labelValue={"First Name"}
        placeholderText={"First Name"}
        onChangeText={(text) =>
          updateContact({ firstName: text, lastName, phone })
        }
      />
      <FormInput
        inputValue={lastName}
        labelValue={"Last Name"}
        placeholderText={"Last Name"}
        onChangeText={(text) =>
          updateContact({ lastName: text, firstName, phone })
        }
      />
      <FormInput
        inputValue={phone}
        labelValue={"Phone"}
        placeholderText={"Phone"}
        onChangeText={(text) =>
          updateContact({ phone: text, firstName, lastName })
        }
        keyboardType={"phone-pad"}
      />
    </View>
  );
};

const BackInStockSubscriptions = () => {
  const { session } = useWixSession();
  const queryClient = useQueryClient();

  const subscriptionsQuery = useQuery({
    queryKey: ["back-in-stock-subscriptions", session],
    queryFn: async () => {
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
              },
            },
          }),
        },
      );
      return res.json();
    },
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

  if (subscriptionsQuery.isLoading) {
    return (
      <MemberAccordion title="Back in Stock Notifications" defaultExpanded={false}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </MemberAccordion>
    );
  }

  if (subscriptionsQuery.isError) {
    return (
      <MemberAccordion title="Back in Stock Notifications" defaultExpanded={false}>
        <RNText style={{ color: theme.colors.error }}>Failed to load subscriptions</RNText>
      </MemberAccordion>
    );
  }

  const subscriptions = subscriptionsQuery.data?.dataItems || [];

  return (
    <MemberAccordion title="Back in Stock Notifications" defaultExpanded={false}>
      {subscriptions.length > 0 ? (
        subscriptions.map((item) => (
          <View key={item._id} style={notificationStyles.itemContainer}>
            <View style={notificationStyles.itemInfo}>
              <RNText style={notificationStyles.productName} numberOfLines={2}>
                {item.data?.productName || "Unknown Product"}
              </RNText>
              <RNText style={notificationStyles.subscriptionDate}>
                Subscribed: {item.data?.createdDate ? format(new Date(item.data.createdDate), "MMM dd, yyyy") : "N/A"}
              </RNText>
            </View>
            <TouchableOpacity
              onPress={() => removeSubscriptionMutation.mutate(item._id)}
              disabled={removeSubscriptionMutation.isPending}
              style={notificationStyles.removeButton}
            >
              {removeSubscriptionMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <RNText style={{ color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
          You haven't subscribed to any back in stock notifications yet.
        </RNText>
      )}
      <RNText style={notificationStyles.helpText}>
        When an out-of-stock product you've subscribed to becomes available, you'll receive a push notification.
      </RNText>
    </MemberAccordion>
  );
};

const notificationStyles = RNStyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  removeButton: {
    padding: 8,
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

const Orders = () => {
  const { session } = useWixSession();

  const myOrdersQuery = useQuery({
    queryKey: ["my-orders", session],
    queryFn: async () => {
      const res = await wixCient.fetchWithAuth(
        `https://www.wixapis.com/stores/v2/orders/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: {},
          }),
        },
      );
      return res.json();
    },
  });

  if (myOrdersQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (myOrdersQuery.isError) {
    return <ErrorView message={myOrdersQuery.error.message} />;
  }

  return (
    <MemberAccordion title="My Orders" defaultExpanded={false}>
      {myOrdersQuery.data.orders.map((order) => {
        return (
          <View key={order.id} style={{ marginBottom: 16 }}>
            <RNText style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>
              Order #{order.number}
            </RNText>
            <RNText style={{ color: theme.colors.textSecondary, marginBottom: 4 }}>
              Date: {format(new Date(order.dateCreated), "MMM dd, yyyy")}
            </RNText>
            <RNText style={{ color: theme.colors.textSecondary, marginBottom: 4 }}>
              Status: {
                {
                  FULFILLED: "Fulfilled",
                  NOT_FULFILLED: "Not Fulfilled",
                  PARTIALLY_FULFILLED: "Partially Fulfilled",
                  CANCELLED: "Cancelled",
                }[order.fulfillmentStatus]
              }
            </RNText>
            <RNText style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
              Payment: {
                {
                  PAID: "Paid",
                  NOT_PAID: "Not Paid",
                  PARTIALLY_PAID: "Partially Paid",
                  REFUNDED: "Refunded",
                }[order.paymentStatus]
              }
            </RNText>
            
            {/* Order Items */}
            <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 12, marginVertical: 8 }}>
              <RNText style={{ fontWeight: '600', marginBottom: 8, color: theme.colors.text }}>Items:</RNText>
              {order.lineItems.map((item, index) => (
                <View key={item.id + index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Image
                    source={{ uri: item.mediaItem?.url ?? 'https://via.placeholder.com/50' }}
                    style={{ width: 50, height: 50, borderRadius: 4 }}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <RNText style={{ color: theme.colors.text, fontWeight: '500' }} numberOfLines={1}>
                      {item.name}
                    </RNText>
                    <RNText style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                      Qty: {item.quantity}
                    </RNText>
                  </View>
                </View>
              ))}
            </View>
            
            <RNText style={{ fontSize: 16, fontWeight: '700', color: theme.colors.accent, marginTop: 4 }}>
              Total: {usePrice({
                amount: Number.parseFloat(order.totals.total),
                currencyCode: order.currency,
              })}
            </RNText>
            <Divider style={{ marginTop: 16 }} />
          </View>
        );
      })}
      {!myOrdersQuery.data.orders.length && (
        <RNText style={{ color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
          You have no orders yet.
        </RNText>
      )}
    </MemberAccordion>
  );
};

export const MemberView = ({ navigation }) => {
  const queryClient = useQueryClient();
  const { newVisitorSession } = useWixSession();
  const { firstName, lastName, phone, updateContact } = useMemberHandler();
  const [visibleMenu, setVisibleMenu] = useState(false);
  const getCurrentMemberRes = useQuery({
    queryKey: ["currentMember"],
    queryFn: () => wixCient.members.getCurrentMember({ fieldSet: "FULL" }),
  });
  const [currentMember, setCurrentMember] = useState(null);

  useEffect(() => {
    const fetchCurrentMember = async () => {
      const { member } = await wixCient.members.getCurrentMember({
        fieldSet: "FULL",
      });

      // Wix may return 'contact' or 'contactInfo'
      const contact = member?.contactInfo || member?.contact;
      
      // Handle phones as either array of strings or array of objects
      const phoneValue = Array.isArray(contact?.phones) 
        ? (typeof contact.phones[0] === 'string' ? contact.phones[0] : contact.phones[0]?.phone)
        : "";

      updateContact({
        firstName: contact?.firstName || "",
        lastName: contact?.lastName || "",
        phone: phoneValue || "",
      });

      setCurrentMember(member);
    };
    fetchCurrentMember();
  }, []);

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember) {
        return;
      }

      // Wix expects 'contact' with phones as array of strings
      const existingContact = currentMember?.contact || currentMember?.contactInfo || {};
      
      const updatedMember = {
        contact: {
          firstName,
          lastName,
          phones: phone ? [phone] : [],
        },
      };

      const result = await wixCient.members.updateMember(
        currentMember._id,
        updatedMember,
      );
      
      return result;
    },
    onSuccess: (updatedMember) => {
      // Wix returns 'contact' not 'contactInfo' in the response
      const contact = updatedMember?.contactInfo || updatedMember?.contact;
      
      // updatedMember is the member object
      queryClient.setQueryData(["currentMember"], { member: updatedMember });
      setCurrentMember(updatedMember);

      // Handle phones as either array of strings or array of objects
      const phoneValue = Array.isArray(contact?.phones) 
        ? (typeof contact.phones[0] === 'string' ? contact.phones[0] : contact.phones[0]?.phone)
        : "";

      updateContact({
        firstName: contact?.firstName || "",
        lastName: contact?.lastName || "",
        phone: phoneValue || "",
      });
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });

  if (getCurrentMemberRes.isError) {
    return <ErrorView message={getCurrentMemberRes.error.message} />;
  }

  if (getCurrentMemberRes.isLoading || !currentMember) {
    return <LoadingIndicator />;
  }

  if (updateMemberMutation.isPending) {
    return <LoadingIndicator loadingMessage={"Updating your info..."} />;
  }

  const { profile } = currentMember || {};
  // Wix may return 'contact' or 'contactInfo'
  const contact = currentMember?.contactInfo || currentMember?.contact;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <DismissKeyboardScrollView
          style={styles.contentSection}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          bouncesZoom={false}
          automaticallyAdjustKeyboardInsets={true}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
        <View style={styles.memberHeader} />
        <View style={styles.memberSection}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {profile?.photo?.url ? (
              <Avatar.Image
                size={100}
                theme={{ colors: { primary: "#403f2b" } }}
                source={{
                  uri: profile?.photo?.url,
                }}
              />
            ) : (
              <Avatar.Text
                size={100}
                label={
                  contact?.firstName && contact?.lastName
                    ? `${contact.firstName[0]}${contact.lastName[0]}`
                    : profile?.nickname?.[0] || '?'
                }
              />
            )}
            <Menu
              visible={visibleMenu}
              onDismiss={() => setVisibleMenu(false)}
              anchor={
                <IconButton
                  icon={"dots-vertical"}
                  iconColor={"#403f2b"}
                  size={30}
                  onPress={() => setVisibleMenu(!visibleMenu)}
                  style={{ backgroundColor: "#fdfbef" }}
                />
              }
              contentStyle={{
                backgroundColor: "#fdfbef",
                padding: 10,
                marginTop: 40,
              }}
              theme={{ colors: { text: "#403f2b" } }}
            >
              <Menu.Item
                leadingIcon="logout"
                onPress={async () => {
                  await newVisitorSession();
                }}
                title="Signout"
              />
            </Menu>
          </View>
          <Text
            style={{
              fontSize: 20,
              marginTop: 20,
              color: "#403f2b",
            }}
          >
            {contact?.firstName && contact?.lastName
              ? `${contact?.firstName} ${contact?.lastName}`
              : profile?.nickname}
          </Text>
        </View>
        <View style={{ marginTop: 20, width: "100%" }}>
          <Orders />
        </View>
        <View style={{ marginTop: 0, width: "100%" }}>
          <BackInStockSubscriptions />
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberDetailsTitle}>My Account</Text>
          <Text style={styles.memberDetailsSubTitle}>
            View and edit your personal info below.
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
              width: "100%",
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                // Handle phones as either array of strings or array of objects
                const phoneValue = Array.isArray(contact?.phones) 
                  ? (typeof contact.phones[0] === 'string' ? contact.phones[0] : contact.phones[0]?.phone)
                  : "";
                updateContact({
                  firstName: contact?.firstName || "",
                  lastName: contact?.lastName || "",
                  phone: phoneValue || "",
                });
              }}
              style={[styles.memberActionButton, {
                borderWidth: 1.5,
                borderColor: theme.colors.text,
                backgroundColor: 'transparent',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              activeOpacity={0.8}
            >
              <RNText style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                Discard
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                updateMemberMutation.mutate();
              }}
              style={[styles.memberActionButton, {
                backgroundColor: theme.colors.accent,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              activeOpacity={0.8}
            >
              {updateMemberMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <RNText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Update Info
                </RNText>
              )}
            </TouchableOpacity>
          </View>
          <MemberForm />
        </View>
      </DismissKeyboardScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};
