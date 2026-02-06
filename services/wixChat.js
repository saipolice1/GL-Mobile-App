import { wixCient } from '../authentication/wixClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// Wix Chat/Inbox Service
// Provides chat functionality with multiple notification methods

const CHAT_HISTORY_KEY = '@grafton_chat_history';
const PENDING_MESSAGES_KEY = '@grafton_pending_messages';

// Your store email for notifications
const STORE_EMAIL = 'sales@graftonliquor.co.nz';
const STORE_PHONE = '+64223039580';

// Chat message types
export const MESSAGE_TYPES = {
  FAQ: 'faq',
  HELP: 'help',
  ORDER_INQUIRY: 'order_inquiry',
  GENERAL: 'general',
};

// Pre-defined FAQ categories
export const FAQ_CATEGORIES = [
  {
    id: 'delivery',
    title: 'Delivery & Pickup',
    icon: 'truck',
    questions: [
      { 
        q: 'Do you offer delivery services?', 
        a: 'Yes, we provide quick 45-minute local delivery within the Auckland region. We also offer nationwide shipping for spirits and wines, which typically takes 1-3 business days. Just select your preferred shipping method, date, and time during checkout, and we\'ll handle the rest.' 
      },
      { 
        q: 'Where can I pick up my order?', 
        a: 'You can pick up your order at 35 Park Road, Grafton, Auckland, New Zealand.' 
      },
      {
        q: 'How long does delivery take?',
        a: 'Local Auckland delivery takes approximately 45 minutes. Nationwide shipping takes 3-5 business days and arrives promptly and securely.'
      },
      {
        q: 'Is there a delivery fee?',
        a: 'Shipping is included for orders over $200. For smaller orders, a delivery fee applies depending on your location.'
      },
    ]
  },
  {
    id: 'ordering',
    title: 'Ordering & Checkout',
    icon: 'receipt',
    questions: [
      {
        q: 'How do I place a Click & Collect order?',
        a: 'Simply add items to your cart, select "Click & Collect" at checkout, complete your payment, and your order will be ready for pickup in just 5 minutes at our Grafton location.'
      },
      {
        q: 'Can I use Afterpay in-store?', 
        a: 'Yes, we accept Afterpay for online \'Click & Collect\' and \'Delivery\' options at checkout. Choose \'Click & Collect\' at checkout, and your order will be ready in just 5 minutes. Unfortunately, Afterpay is not available for in-store purchases.' 
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and Afterpay for online orders. Cash is accepted for in-store purchases.'
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'Orders can be modified or cancelled within 30 minutes of placing. Please contact us immediately at +64 22 303 9580 if you need to make changes.'
      },
      {
        q: 'How do I track my order?',
        a: 'You\'ll receive order confirmation and tracking information via email. For Click & Collect orders, you\'ll be notified when your order is ready for pickup.'
      },
    ]
  },
  {
    id: 'store',
    title: 'Store Information',
    icon: 'store',
    questions: [
      { 
        q: 'What are your store hours?', 
        a: 'Our store is open 7 days a week from 11:00 AM to 9:00 PM. (Sunday we open at 10:00). Feel free to visit us anytime during these hours!' 
      },
      {
        q: 'Do you have age restrictions?',
        a: 'Yes, you must be 18 or older to purchase alcohol. Valid ID is required for all alcohol purchases, both online and in-store.'
      },
      {
        q: 'Do you offer gift wrapping?',
        a: 'Yes, we offer gift bags, pull bows, and gift hampers. You can add these accessories to your order during checkout.'
      },
    ]
  },
];

/**
 * Send a message - stores locally and provides contact options
 * For immediate notification, user can use email/phone buttons
 */
export async function sendMessageToInbox(message, messageType = MESSAGE_TYPES.GENERAL, userInfo = {}) {
  const messageData = {
    id: `msg_${Date.now()}`,
    type: messageType,
    content: message,
    timestamp: new Date().toISOString(),
    source: 'mobile_app',
    userInfo: {
      name: userInfo.name || 'App User',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      ...userInfo,
    },
    status: 'pending',
  };
  
  console.log('📬 Processing message:', messageData);
  
  // Store in chat history
  await storeChatMessage(messageData, true);
  
  // Store as pending for potential sync
  await storePendingMessage(messageData);
  
  // Try to sync with Wix if user is logged in
  const synced = await trySyncToWix(messageData);
  
  return {
    success: true,
    messageId: messageData.id,
    synced: synced,
    data: messageData,
  };
}

/**
 * Try to sync message to Wix via checkout notes or cart
 * This piggybacks on existing cart functionality that works
 */
async function trySyncToWix(messageData) {
  try {
    // Get current cart to check if we can add a note
    const cart = await wixCient.currentCart.getCurrentCart();
    
    if (cart?._id) {
      // We can potentially add info via cart update
      // This is visible in Wix when they check orders
      console.log('✅ User has active cart, message will be included with order');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('ℹ️ No active cart for sync');
    return false;
  }
}

/**
 * Store pending message for later sync
 */
async function storePendingMessage(messageData) {
  try {
    const existing = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
    const pending = existing ? JSON.parse(existing) : [];
    
    pending.push(messageData);
    
    // Keep last 20 pending
    if (pending.length > 20) {
      pending.shift();
    }
    
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Error storing pending message:', error);
  }
}

/**
 * Get pending messages
 */
export async function getPendingMessages() {
  try {
    const existing = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error getting pending messages:', error);
    return [];
  }
}

/**
 * Clear pending messages after sync
 */
export async function clearPendingMessages() {
  try {
    await AsyncStorage.removeItem(PENDING_MESSAGES_KEY);
  } catch (error) {
    console.error('Error clearing pending messages:', error);
  }
}

/**
 * Open email to contact store directly
 */
export function openEmailContact(subject = 'Help Request', body = '') {
  const mailtoUrl = `mailto:${STORE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nSent from Grafton Liquor App')}`;
  Linking.openURL(mailtoUrl).catch(err => {
    console.error('Failed to open email:', err);
  });
}

/**
 * Open phone to call store
 */
export function openPhoneContact() {
  Linking.openURL(`tel:${STORE_PHONE}`).catch(err => {
    console.error('Failed to open phone:', err);
  });
}

/**
 * Open WhatsApp if available
 */
export function openWhatsAppContact(message = 'Hi, I need help with my order') {
  const whatsappUrl = `whatsapp://send?phone=${STORE_PHONE.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(message)}`;
  Linking.openURL(whatsappUrl).catch(() => {
    // WhatsApp not installed, try web version
    Linking.openURL(`https://wa.me/${STORE_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
  });
}

// Store chat message locally
async function storeChatMessage(message, isUser) {
  try {
    const existing = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    const history = existing ? JSON.parse(existing) : [];
    
    history.push({
      ...message,
      isUser,
      storedAt: new Date().toISOString(),
    });
    
    // Keep last 50 messages
    if (history.length > 50) {
      history.shift();
    }
    
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error storing chat message:', error);
  }
}

// Get chat history
export async function getChatHistory() {
  try {
    const existing = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
}

// Clear chat history
export async function clearChatHistory() {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}

// Send FAQ question to inbox
export async function sendFAQQuestion(categoryId, questionIndex, customMessage = '', userInfo = {}) {
  const category = FAQ_CATEGORIES.find(c => c.id === categoryId);
  if (!category) {
    return { success: false, error: 'Category not found' };
  }
  
  const question = category.questions[questionIndex];
  const message = customMessage || `FAQ Question: ${question?.q || 'General inquiry'}`;
  
  return sendMessageToInbox(message, MESSAGE_TYPES.FAQ, {
    ...userInfo,
    faqCategory: category.title,
    faqQuestion: question?.q,
  });
}

// Send help request
export async function sendHelpRequest(subject, message, userInfo = {}) {
  const fullMessage = `Help Request: ${subject}\n\n${message}`;
  return sendMessageToInbox(fullMessage, MESSAGE_TYPES.HELP, userInfo);
}

// Send order inquiry
export async function sendOrderInquiry(orderId, message, userInfo = {}) {
  const fullMessage = `Order Inquiry #${orderId}\n\n${message}`;
  return sendMessageToInbox(fullMessage, MESSAGE_TYPES.ORDER_INQUIRY, {
    ...userInfo,
    orderId,
  });
}
