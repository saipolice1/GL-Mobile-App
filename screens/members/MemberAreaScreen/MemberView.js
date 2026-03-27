import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from "react";
import { Image, Linking, TextInput, View, TouchableOpacity, Text as RNText, ActivityIndicator, StyleSheet as RNStyleSheet, KeyboardAvoidingView, Platform, Alert, Modal } from "react-native";
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
import { useNotifications } from "../../../context/NotificationContext";
import { registerPushTokenWithWix } from "../../../services/notifications";
import { OTA_VERSION } from "../../../constants/otaVersion";

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

const STATUS_LABELS = {
  FULFILLED: 'Delivered',
  NOT_FULFILLED: 'Order Placed',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  CANCELLED: 'Cancelled',
};
const STATUS_COLORS = {
  FULFILLED: '#10B981',
  NOT_FULFILLED: '#F59E0B',
  PARTIALLY_FULFILLED: '#3B82F6',
  CANCELLED: '#EF4444',
};

const Orders = ({ navigation }) => {
  const { session } = useWixSession();
  const queryClient = useQueryClient();
  const [reordering, setReordering] = useState(null);

  const handleReorder = async (order) => {
    try {
      setReordering(order.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const lineItems = order.lineItems
        .filter(item => item.catalogReference?.catalogItemId)
        .map(item => ({
          catalogReference: {
            catalogItemId: item.catalogReference.catalogItemId,
            appId: item.catalogReference.appId || "215238eb-22a5-4c36-9e7b-e7c08025e04e",
          },
          quantity: item.quantity,
        }));
      if (lineItems.length === 0) {
        Alert.alert('Cannot Reorder', 'No reorderable items found.');
        return;
      }
      await wixCient.currentCart.addToCurrentCart({ lineItems });
      queryClient.invalidateQueries({ queryKey: ['currentCart'] });
      Alert.alert('Added to Cart', `${lineItems.length} item${lineItems.length !== 1 ? 's' : ''} added to your cart.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add items to cart. Please try again.');
    } finally {
      setReordering(null);
    }
  };

  const myOrdersQuery = useQuery({
    queryKey: ["my-orders", session],
    queryFn: async () => {
      const res = await wixCient.fetchWithAuth(
        `https://www.wixapis.com/stores/v2/orders/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: {} }),
        },
      );
      return res.json();
    },
  });

  if (myOrdersQuery.isLoading) return <LoadingIndicator />;
  if (myOrdersQuery.isError) return <ErrorView message={myOrdersQuery.error.message} />;

  const orders = myOrdersQuery.data?.orders || [];

  return (
    <MemberAccordion title="My Orders" defaultExpanded={false}>
      {orders.map((order) => {
        const statusColor = STATUS_COLORS[order.fulfillmentStatus] || theme.colors.textMuted;
        const statusLabel = STATUS_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus;
        const isReordering = reordering === order.id;
        return (
          <View key={order.id} style={{ marginBottom: 12 }}>
            <View style={{ backgroundColor: theme.colors.background, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, padding: 14 }}>
              {/* Row 1: Order # + Status */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <RNText style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>Order #{order.number}</RNText>
                <RNText style={{ fontSize: 12, fontWeight: '600', color: statusColor }}>{statusLabel}</RNText>
              </View>
              {/* Row 2: Date */}
              <RNText style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 10 }}>
                {format(new Date(order.dateCreated), "MMM dd, yyyy")}
              </RNText>
              {/* First item thumbnail + name */}
              {order.lineItems?.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Image
                    source={{ uri: order.lineItems[0].mediaItem?.url ?? 'https://via.placeholder.com/40' }}
                    style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: theme.colors.border }}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <RNText style={{ color: theme.colors.text, fontWeight: '500', fontSize: 13 }} numberOfLines={1}>
                      {order.lineItems[0].name}
                    </RNText>
                    {order.lineItems.length > 1 && (
                      <RNText style={{ color: theme.colors.textMuted, fontSize: 12 }}>+{order.lineItems.length - 1} more item{order.lineItems.length > 2 ? 's' : ''}</RNText>
                    )}
                  </View>
                  <RNText style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
                    {order.currency} {Number.parseFloat(order.totals?.total || 0).toFixed(2)}
                  </RNText>
                </View>
              )}
              {/* Actions: View Details + Reorder */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(Routes.OrderDetails, { orderId: order.id, orderNumber: order.number })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }}
                  activeOpacity={0.7}
                >
                  <RNText style={{ fontSize: 13, color: theme.colors.accent, marginRight: 2 }}>View details</RNText>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReorder(order)}
                  disabled={isReordering}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8, backgroundColor: theme.colors.secondary, opacity: isReordering ? 0.6 : 1 }}
                  activeOpacity={0.7}
                >
                  {isReordering
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <RNText style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>Reorder</RNText>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
      {!orders.length && (
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
  const { expoPushToken } = useNotifications();
  const [visibleMenu, setVisibleMenu] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const addressDebounceRef = useRef(null);

  // Load profile photo and addresses from storage when member loads
  useEffect(() => {
    if (!currentMember?._id) return;
    const id = currentMember._id;
    AsyncStorage.getItem(`@profile_photo_${id}`).then(uri => {
      if (uri) setProfilePhoto(uri);
    });
    AsyncStorage.getItem(`@saved_addresses_${id}`).then(raw => {
      if (raw) setAddresses(JSON.parse(raw));
    });
  }, [currentMember?._id]);

  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      await AsyncStorage.setItem(`@profile_photo_${currentMember._id}`, uri);
      setProfilePhoto(uri);
    }
  };

  const saveAddress = async () => {
    if (!newAddressText.trim()) return;
    const updated = [...addresses, newAddressText.trim()];
    await AsyncStorage.setItem(`@saved_addresses_${currentMember._id}`, JSON.stringify(updated));
    setAddresses(updated);
    setNewAddressText('');
    setAddressSuggestions([]);
    setShowAddressInput(false);
  };

  const removeAddress = async (index) => {
    const updated = addresses.filter((_, i) => i !== index);
    await AsyncStorage.setItem(`@saved_addresses_${currentMember._id}`, JSON.stringify(updated));
    setAddresses(updated);
  };

  const handleAddressTextChange = (text) => {
    setNewAddressText(text);
    setAddressSuggestions([]);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (text.length < 3) { setIsLoadingSuggestions(false); return; }
    setIsLoadingSuggestions(true);
    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&countrycodes=nz&limit=5`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'GraftonLiquorApp/1.0' } }
        );
        const data = await res.json();
        setAddressSuggestions(data.map(item => item.display_name));
      } catch (_) {
        setAddressSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);
  };

  // Fetch current member on mount and when session changes
  // Contact details come from: 1) Members API (getCurrentMember with FULL fieldsets), 2) AsyncStorage fallback
  useEffect(() => {
    const fetchCurrentMember = async () => {
      if (!session?.refreshToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { member } = await wixCient.members.getCurrentMember({
          fieldsets: ['FULL'],
        });

        console.log('=== MemberView: Fetched member data from Wix ===');
        console.log('Member ID:', member._id);
        console.log('Profile:', JSON.stringify(member.profile, null, 2));
        console.log('Contact from Members API:', JSON.stringify(member.contact, null, 2));
        
        // Extract contact details from Members API response
        // member.contact may have firstName, lastName, phones directly
        const memberContact = member.contact || {};
        let wixFirstName = memberContact.firstName || member.profile?.nickname || '';
        let wixLastName = memberContact.lastName || '';
        // phones can be array of strings or array of objects with .phone property
        let wixPhone = '';
        if (memberContact.phones && memberContact.phones.length > 0) {
          const firstPhone = memberContact.phones[0];
          wixPhone = typeof firstPhone === 'string' ? firstPhone : (firstPhone?.phone || '');
        }
        
        // Load stored contact as fallback
        const storedContact = await loadContactForMember(member._id);
        console.log('Loaded stored contact for member:', storedContact);
        
        const enrichedMember = {
          ...member,
          // Prefer Members API contact data, then stored data, then profile nickname
          contact: {
            firstName: wixFirstName || storedContact?.firstName || '',
            lastName: wixLastName || storedContact?.lastName || '',
            phones: wixPhone ? [wixPhone] : (storedContact?.phone ? [storedContact.phone] : []),
          },
        };

        console.log('✅ Member loaded - contact data:');
        console.log('   From Members API:', { firstName: wixFirstName, lastName: wixLastName, phone: wixPhone });
        console.log('   From stored:', storedContact);
        console.log('   Final:', enrichedMember.contact);

        setCurrentMember(enrichedMember);
        
        // Register push token with Wix for order notifications
        if (member._id && expoPushToken) {
          registerPushTokenWithWix(member._id, expoPushToken);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching member:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentMember();
  }, [session?.refreshToken, loadContactForMember, expoPushToken]);

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
    // Step 1: Initial confirmation via Alert
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. All your data, order history, and saved information will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            // Step 2: Show modal for typing DELETE
            setDeleteConfirmText('');
            setShowDeleteModal(true);
          },
        },
      ]
    );
  };

  const executeAccountDeletion = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Cancelled', 'You did not type "DELETE". Your account was not deleted.');
      return;
    }

    setIsDeleting(true);
    try {
      console.warn('[DeleteAccount] Initiating account deletion via members.deleteMyMember()');
      // Use the SDK deleteMyMember — calls DELETE /members/v1/members/my
      await wixCient.members.deleteMyMember();
      console.warn('[DeleteAccount] ✅ Account deleted successfully via Wix Members API');

      setShowDeleteModal(false);

      // Only on success: clear local data and log out
      await clearContact();
      queryClient.invalidateQueries();
      await newVisitorSession();

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted and you have been signed out.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      // Deletion failed — do NOT claim success, do NOT log out
      setShowDeleteModal(false);
      console.warn('[DeleteAccount] ❌ Deletion failed');
      console.warn('[DeleteAccount] Error type:', e?.constructor?.name);
      console.warn('[DeleteAccount] Error message:', e?.message);
      console.warn('[DeleteAccount] Error details:', JSON.stringify(e?.details || e, null, 2));
      console.warn('[DeleteAccount] HTTP status:', e?.httpStatus || e?.response?.status || 'unknown');

      const userMessage = e?.message?.includes('403') || e?.httpStatus === 403
        ? 'Permission denied. Please contact support at info@graftonliquor.co.nz to delete your account.'
        : `Failed to delete account: ${e?.message || 'Unknown error'}. Please try again or contact support at info@graftonliquor.co.nz.`;

      Alert.alert('Deletion Failed', userMessage, [{ text: 'OK' }]);
    } finally {
      setIsDeleting(false);
    }
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
            <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.8} style={{ position: 'relative' }}>
              {profilePhoto || profile?.photo?.url ? (
                <Avatar.Image
                  size={100}
                  theme={{ colors: { primary: "#403f2b" } }}
                  source={{ uri: profilePhoto || profile?.photo?.url }}
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
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.secondary, borderRadius: 12, padding: 5, borderWidth: 2, borderColor: theme.colors.background }}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
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
          <Orders navigation={navigation} />

          {/* Find Us */}
          <MemberAccordion title="Find Us">
            <View style={{ gap: 10 }}>
              <View>
                <RNText style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>Grafton Liquor</RNText>
                <RNText style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 3 }}>35 Park Road, Grafton, Auckland 1023, New Zealand</RNText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL('https://maps.google.com/?q=35+Park+Road+Grafton+Auckland+1023+New+Zealand');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: theme.colors.secondary, alignSelf: 'flex-start' }}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={15} color="#fff" />
                <RNText style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Get Directions</RNText>
              </TouchableOpacity>
            </View>
          </MemberAccordion>

          {/* Notification Settings */}
          <MemberAccordion title="Notifications">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
              <View style={{ flex: 1 }}>
                <RNText style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>Push Notifications</RNText>
                <RNText style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                  {expoPushToken ? 'Enabled — you\'ll receive order updates & deals' : 'Disabled — tap to enable in Settings'}
                </RNText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openSettings();
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: expoPushToken ? theme.colors.accent : theme.colors.secondary, marginLeft: 12 }}
                activeOpacity={0.8}
              >
                <RNText style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                  {expoPushToken ? 'Manage' : 'Enable'}
                </RNText>
              </TouchableOpacity>
            </View>
          </MemberAccordion>

          {/* Saved Addresses */}
          <MemberAccordion title="Saved Addresses">
            {addresses.map((addr, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                <RNText style={{ flex: 1, fontSize: 14, color: theme.colors.text }}>{addr}</RNText>
                <TouchableOpacity onPress={() => removeAddress(i)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {showAddressInput ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                <View>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: theme.colors.text }}
                    placeholder="e.g. 123 Main St, Auckland"
                    placeholderTextColor={theme.colors.textMuted}
                    value={newAddressText}
                    onChangeText={handleAddressTextChange}
                    autoFocus
                    autoCorrect={false}
                  />
                  {isLoadingSuggestions && (
                    <View style={{ position: 'absolute', right: 10, top: 11 }}>
                      <ActivityIndicator size="small" color={theme.colors.accent} />
                    </View>
                  )}
                  {addressSuggestions.length > 0 && (
                    <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, marginTop: 4, backgroundColor: theme.colors.surface, maxHeight: 200, overflow: 'hidden' }}>
                      {addressSuggestions.map((suggestion, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setNewAddressText(suggestion);
                            setAddressSuggestions([]);
                          }}
                          style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: idx < addressSuggestions.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="location-outline" size={14} color={theme.colors.accent} />
                          <RNText style={{ fontSize: 13, color: theme.colors.text, flex: 1 }} numberOfLines={2}>{suggestion}</RNText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => { setShowAddressInput(false); setNewAddressText(''); setAddressSuggestions([]); }}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <RNText style={{ fontSize: 14, color: theme.colors.text }}>Cancel</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveAddress}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: theme.colors.secondary, alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <RNText style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>Save</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowAddressInput(true)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: addresses.length > 0 ? 12 : 0, gap: 6 }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent} />
                <RNText style={{ fontSize: 14, color: theme.colors.accent, fontWeight: '500' }}>Add address</RNText>
              </TouchableOpacity>
            )}
          </MemberAccordion>
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <RNText style={{ textAlign: 'center', color: theme.colors.textMuted, fontSize: 11, paddingVertical: 16 }}>
          v{OTA_VERSION}
        </RNText>
      </DismissKeyboardScrollView>
      </KeyboardAvoidingView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!isDeleting) setShowDeleteModal(false); }}
      >
        <View style={deleteModalStyles.overlay}>
          <View style={deleteModalStyles.container}>
            <RNText style={deleteModalStyles.title}>Confirm Account Deletion</RNText>
            <RNText style={deleteModalStyles.description}>
              Type <RNText style={{ fontWeight: 'bold' }}>DELETE</RNText> below to permanently delete your account.
            </RNText>
            <TextInput
              style={deleteModalStyles.input}
              placeholder='Type "DELETE"'
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
            />
            <View style={deleteModalStyles.buttonRow}>
              <TouchableOpacity
                style={deleteModalStyles.cancelButton}
                onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <RNText style={deleteModalStyles.cancelButtonText}>Cancel</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  deleteModalStyles.deleteButton,
                  deleteConfirmText.trim().toUpperCase() !== 'DELETE' && { opacity: 0.5 },
                ]}
                onPress={executeAccountDeletion}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <RNText style={deleteModalStyles.deleteButtonText}>Delete My Account</RNText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const deleteModalStyles = RNStyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#403f2b',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#403f2b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#403f2b',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
