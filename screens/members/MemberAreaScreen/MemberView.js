import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Image, TextInput, View, TouchableOpacity, Text as RNText, ActivityIndicator, StyleSheet as RNStyleSheet } from "react-native";
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

const FormInput = ({ labelValue, placeholderText, inputValue, ...rest }) => {
  return (
    <View style={styles.accountInputContainer}>
      <Text style={styles.accountInfoText}>{labelValue}:</Text>
      <TextInput
        style={styles.accountInput}
        placeholder={placeholderText}
        {...rest}
        value={inputValue}
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

// Help & Support Section
const HelpSupport = ({ navigation }) => {
  const supportOptions = [
    {
      icon: 'receipt-outline',
      title: 'View Orders on Website',
      subtitle: 'See full order history & tracking',
      onPress: () => navigation?.navigate(Routes.WebView, {
        url: WIX_PAGES.ORDER_HISTORY,
        title: 'Order History'
      }),
    },
    {
      icon: 'help-circle-outline',
      title: 'FAQ & Help Center',
      subtitle: 'Find answers to common questions',
      onPress: () => navigation?.navigate(Routes.HelpChat),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Chat with Us',
      subtitle: 'Messages go directly to our inbox',
      onPress: () => navigation?.navigate(Routes.WebView, {
        url: WIX_PAGES.CHAT,
        title: 'Chat with Us'
      }),
    },
    {
      icon: 'call-outline',
      title: 'Contact Us',
      subtitle: '+1 (555) 123-4567',
      onPress: null,
    },
    {
      icon: 'mail-outline',
      title: 'Email Support',
      subtitle: 'support@graftonliquor.com',
      onPress: null,
    },
  ];

  return (
    <MemberAccordion title="Help & Support" defaultExpanded={false}>
      {supportOptions.map((option, index) => (
        <TouchableOpacity
          key={option.title}
          style={helpStyles.optionRow}
          onPress={option.onPress}
          disabled={!option.onPress}
          activeOpacity={option.onPress ? 0.7 : 1}
        >
          <View style={helpStyles.optionIcon}>
            <Ionicons name={option.icon} size={24} color={theme.colors.accent} />
          </View>
          <View style={helpStyles.optionContent}>
            <RNText style={helpStyles.optionTitle}>{option.title}</RNText>
            <RNText style={helpStyles.optionSubtitle}>{option.subtitle}</RNText>
          </View>
          {option.onPress && (
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          )}
        </TouchableOpacity>
      ))}
    </MemberAccordion>
  );
};

const helpStyles = RNStyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

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
      updateContact({
        firstName: member?.contact?.firstName,
        lastName: member?.contact?.lastName,
        phone: member?.contact?.phones[0],
      });
      setCurrentMember(member);
    };
    fetchCurrentMember();
  }, []);

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember) return;
      const contact = currentMember?.contact;
      const newPhones = [...(contact?.phones || [])];
      newPhones[0] = phone;
      const updatedContact = {
        ...(contact || {}),
        firstName,
        lastName,
        phones: newPhones,
      };
      const updatedMember = {
        contact: updatedContact,
      };
      return await wixCient.members.updateMember(
        currentMember?._id,
        updatedMember,
      );
    },
    onSuccess: async (response) => {
      const member = {
        member: {
          ...response,
        },
      };
      queryClient.setQueryData(["currentMember"], member);
      setCurrentMember(response);
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

  const { profile, contact } = currentMember || {};

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DismissKeyboardScrollView
        style={styles.contentSection}
        keyboardShouldPersistTaps="never"
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        bouncesZoom={false}
        automaticallyAdjustKeyboardInsets={true}
        scrollEventThrottle={16}
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
                    ? `${contact?.firstName[0]}${contact?.lastName[0]}`
                    : profile?.nickname[0]
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
        <View style={{ marginTop: 8, width: "100%" }}>
          <HelpSupport navigation={navigation} />
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
                updateContact({
                  firstName: contact?.firstName,
                  lastName: contact?.lastName,
                  phone: contact?.phones[0],
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
    </GestureHandlerRootView>
  );
};
