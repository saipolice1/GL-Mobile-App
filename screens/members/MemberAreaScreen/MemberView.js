import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Image, TextInput, View, TouchableOpacity, Text as RNText, ActivityIndicator, StyleSheet as RNStyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
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

const MemberForm = ({ member }) => {
  const { firstName, lastName, phone, loginEmail, updateContact, currentMemberId } = useMemberHandler();

  return (
    <View style={styles.accountInfo}>
      <Text style={styles.accountInfoTitle}>Account</Text>
      <Text style={styles.accountInfoSubtitle}>
        Update your personal information.
      </Text>
      <Text style={styles.accountInfoText}>Login Email:</Text>
      <Text style={styles.accountInfoText}>
        {loginEmail || member?.loginEmail || member?.profile?.nickname || "No email found"}
      </Text>
      <Text style={styles.accountInfoSmallText}>
        Your Login email can't be changed.
      </Text>
      <FormInput
        inputValue={firstName}
        labelValue={"First Name"}
        placeholderText={"First Name"}
        onChangeText={(text) =>
          updateContact({ firstName: text, lastName, phone }, currentMemberId)
        }
      />
      <FormInput
        inputValue={lastName}
        labelValue={"Last Name"}
        placeholderText={"Last Name"}
        onChangeText={(text) =>
          updateContact({ lastName: text, firstName, phone }, currentMemberId)
        }
      />
      <FormInput
        inputValue={phone}
        labelValue={"Phone"}
        placeholderText={"Phone"}
        onChangeText={(text) =>
          updateContact({ phone: text, firstName, lastName }, currentMemberId)
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

export const MemberView = ({ navigation }) => {
  const queryClient = useQueryClient();
  const { newVisitorSession, session } = useWixSession();
  const { firstName, lastName, phone, updateContact, clearContact, loadContactForMember } = useMemberHandler();
  const [visibleMenu, setVisibleMenu] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current member on mount and when session changes
  // NOTE: getCurrentMember() only returns identity info (ID, profile, nickname)
  // Contact details come from: 1) Contacts API (using contactId), 2) AsyncStorage (keyed by member ID)
  useEffect(() => {
    const fetchCurrentMember = async () => {
      if (!session?.refreshToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { member } = await wixCient.members.getCurrentMember({
          fieldSet: 'FULL',
        });

        console.log('=== MemberView: Fetched member data from Wix ===');
        console.log('Member ID:', member._id);
        console.log('Contact ID:', member.contactId);
        console.log('Profile:', JSON.stringify(member.profile, null, 2));
        
        // Try to fetch contact using contactId from Contacts API
        let wixFirstName = member.profile?.nickname || '';
        let wixLastName = '';
        let wixPhone = '';
        
        if (member.contactId) {
          try {
            console.log('Fetching contact details for contactId:', member.contactId);
            const contactResponse = await wixCient.contacts.getContact(member.contactId);
            console.log('=== RAW CONTACT FROM WIX ===');
            console.log(JSON.stringify(contactResponse, null, 2));
            console.log('============================');
            
            if (contactResponse?.contact) {
              const c = contactResponse.contact;
              wixFirstName = c.info?.name?.first || wixFirstName;
              wixLastName = c.info?.name?.last || '';
              wixPhone = c.info?.phones?.[0]?.phone || '';
            }
          } catch (contactErr) {
            console.error('=== ERROR FETCHING CONTACT FROM WIX ===');
            console.error('Error type:', contactErr?.constructor?.name);
            console.error('Error message:', contactErr?.message);
            console.error('Error details:', JSON.stringify(contactErr?.details || contactErr, null, 2));
            console.error('=======================================');
            // If it's a 403, permissions aren't enabled in Wix Headless settings
          }
        } else {
          console.log('No contactId on member - cannot fetch contact details');
        }
        
        // Load stored contact as fallback
        const storedContact = await loadContactForMember(member._id);
        console.log('Loaded stored contact for member:', storedContact);
        
        const enrichedMember = {
          ...member,
          // Prefer Wix Contacts API data, then stored data, then profile nickname
          contact: {
            firstName: wixFirstName || storedContact?.firstName || '',
            lastName: wixLastName || storedContact?.lastName || '',
            phones: wixPhone ? [wixPhone] : (storedContact?.phone ? [storedContact.phone] : []),
          },
        };

        console.log('✅ Member loaded - contact data:');
        console.log('   From Wix Contacts:', { firstName: wixFirstName, lastName: wixLastName, phone: wixPhone });
        console.log('   From stored:', storedContact);
        console.log('   Final:', enrichedMember.contact);

        setCurrentMember(enrichedMember);
        setError(null);
      } catch (err) {
        console.error('Error fetching member:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentMember();
  }, [session?.refreshToken, loadContactForMember]);

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember) {
        return;
      }

      console.log('MemberView: Updating member with:', { firstName, lastName, phone });
      
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
      
      console.log('MemberView: Update result:', JSON.stringify(result, null, 2));
      return result;
    },
    onSuccess: (result) => {
      console.log('MemberView: Update successful');
      
      // The update response contains the full member with contact data
      // Update local state from the response
      if (result) {
        setCurrentMember(result);
        
        const contact = result.contact;
        // Pass member ID to ensure contact is saved to correct storage key
        // Also save loginEmail from the response
        updateContact({
          firstName: contact?.firstName || "",
          lastName: contact?.lastName || "",
          phone: contact?.phones?.[0] || "",
          loginEmail: result.loginEmail || "",
        }, result._id);
        
        console.log('✅ Updated from response - firstName:', contact?.firstName, 'lastName:', contact?.lastName, 'phone:', contact?.phones?.[0], 'email:', result.loginEmail);
      }
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. All your data, order history, and saved information will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              // Attempt to delete via Wix Members API
              await wixCient.fetchWithAuth(
                `https://www.wixapis.com/members/v1/members/${currentMember._id}`,
                { method: "DELETE" }
              );
              console.log("Account deleted via Wix API");
            } catch (e) {
              console.log("Delete API call result:", e?.message || e);
              // Even if the API call fails, we proceed with local cleanup
              // The user can contact support if server-side deletion didn't complete
            }

            // Clear all local data and log out
            await clearContact();
            await newVisitorSession();

            // Invalidate all cached queries
            queryClient.invalidateQueries();

            Alert.alert(
              "Account Deleted",
              "Your account has been deleted and you have been signed out. If you experience any issues, please contact support at info@graftonliquor.co.nz.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  if (error) {
    return <ErrorView message={error} />;
  }

  if (isLoading || !currentMember) {
    return <LoadingIndicator />;
  }

  if (updateMemberMutation.isPending) {
    return <LoadingIndicator loadingMessage={"Updating your info..."} />;
  }

  const { profile, contact } = currentMember || {};

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
                  setVisibleMenu(false);
                  await clearContact();
                  await newVisitorSession();
                }}
                title="Signout"
              />
              <Menu.Item
                leadingIcon="delete-outline"
                onPress={() => {
                  setVisibleMenu(false);
                  handleDeleteAccount();
                }}
                title="Delete Account"
                titleStyle={{ color: '#EF4444' }}
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
                  firstName: contact?.firstName || "",
                  lastName: contact?.lastName || "",
                  phone: contact?.phones?.[0] || "",
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
          <MemberForm member={currentMember} />
        </View>
      </DismissKeyboardScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};
