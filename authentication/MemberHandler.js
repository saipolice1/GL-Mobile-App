import * as React from "react";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import AsyncStorage from '@react-native-async-storage/async-storage';

const MemberHandlerContext = React.createContext(null);
const CONTACT_STORAGE_PREFIX = '@member_contact_';

export function useMemberHandler() {
  const context = React.useContext(MemberHandlerContext);
  // Return safe defaults if context is null (not wrapped in provider)
  if (!context) {
    return {
      firstName: "",
      lastName: "",
      phone: "",
      loginEmail: "",
      currentMember: null,
      currentMemberId: null,
      updateContact: () => {},
      clearContact: () => {},
      loadContactForMember: () => {},
    };
  }
  return context;
}

export function MemberHandler(props) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [currentMember, setCurrentMember] = React.useState(null);
  const [currentMemberId, setCurrentMemberId] = React.useState(null);

  // Load contact details for a specific member ID
  const loadContactForMember = React.useCallback(async (memberId) => {
    if (!memberId) {
      console.log('MemberHandler: No member ID provided');
      return;
    }
    
    setCurrentMemberId(memberId);
    
    try {
      const storageKey = `${CONTACT_STORAGE_PREFIX}${memberId}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const contact = JSON.parse(stored);
        console.log('MemberHandler: Loaded contact for member', memberId, ':', contact);
        setFirstName(contact.firstName || "");
        setLastName(contact.lastName || "");
        setPhone(contact.phone || "");
        setLoginEmail(contact.loginEmail || "");
        return contact;
      } else {
        console.log('MemberHandler: No stored contact for member', memberId);
        // Don't clear - keep existing values if any
      }
    } catch (error) {
      console.error('Error loading contact details:', error);
    }
    return null;
  }, []);

  const saveContactDetails = async (contact, memberId) => {
    const id = memberId || currentMemberId;
    if (!id) {
      console.warn('MemberHandler: Cannot save - no member ID');
      return;
    }
    
    try {
      const storageKey = `${CONTACT_STORAGE_PREFIX}${id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(contact));
      console.log('MemberHandler: Saved contact for member', id, ':', contact);
    } catch (error) {
      console.error('Error saving contact details:', error);
    }
  };

  const updateContact = React.useCallback((contact, memberId) => {
    const updated = {
      firstName: contact.firstName !== undefined ? contact.firstName : firstName,
      lastName: contact.lastName !== undefined ? contact.lastName : lastName,
      phone: contact.phone !== undefined ? contact.phone : phone,
      loginEmail: contact.loginEmail !== undefined ? contact.loginEmail : loginEmail,
    };
    
    if (contact.firstName !== undefined) setFirstName(contact.firstName);
    if (contact.lastName !== undefined) setLastName(contact.lastName);
    if (contact.phone !== undefined) setPhone(contact.phone);
    if (contact.loginEmail !== undefined) setLoginEmail(contact.loginEmail);
    
    // Persist to AsyncStorage with member ID
    saveContactDetails(updated, memberId);
  }, [firstName, lastName, phone, loginEmail, currentMemberId]);

  const clearContact = React.useCallback(async () => {
    // Only clear the in-memory state, NOT the AsyncStorage
    // This allows the contact to be restored when the same user logs back in
    setFirstName("");
    setLastName("");
    setPhone("");
    setLoginEmail("");
    setCurrentMemberId(null);
    console.log('MemberHandler: Cleared in-memory contact (storage preserved)');
  }, []);

  return (
    <MemberHandlerContext.Provider
      value={{ updateContact, clearContact, loadContactForMember, currentMember, currentMemberId, firstName, lastName, phone, loginEmail }}
    >
      {props.children}
    </MemberHandlerContext.Provider>
  );
}
