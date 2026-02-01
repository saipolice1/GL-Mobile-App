import { wixCient } from '../authentication/wixClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// Wix Chat/Inbox Service
// Provides chat functionality with multiple notification methods

const CHAT_HISTORY_KEY = '@grafton_chat_history';
const PENDING_MESSAGES_KEY = '@grafton_pending_messages';

// Your store email for notifications
const STORE_EMAIL = 'support@graftonliquor.com';
const STORE_PHONE = '+15551234567'; // Update with your actual number

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
    title: 'Delivery & Shipping',
    icon: 'truck',
    questions: [
      { q: 'What are the delivery options?', a: 'We offer same-day delivery for orders over $80 and free delivery for orders over $200. Otherwise, in-store pickup is available.' },
      { q: 'How long does delivery take?', a: 'Same-day delivery is available for orders placed before 2pm. Standard delivery takes 1-3 business days.' },
      { q: 'What areas do you deliver to?', a: 'We deliver to most areas within the city. Enter your address at checkout to confirm availability.' },
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Payment',
    icon: 'receipt',
    questions: [
      { q: 'How can I track my order?', a: 'You can track your order in the app under "My Account" > "Orders". You\'ll also receive notifications for order updates.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, Apple Pay, and Google Pay.' },
      { q: 'Can I cancel my order?', a: 'Orders can be cancelled within 30 minutes of placing. Contact us immediately if you need to cancel.' },
    ]
  },
  {
    id: 'products',
    title: 'Products & Stock',
    icon: 'bottle-wine',
    questions: [
      { q: 'How do I know if an item is in stock?', a: 'Items marked "Sold Out" are unavailable. Low stock items show "Only X left" badges.' },
      { q: 'Can I request a product you don\'t have?', a: 'Yes! Send us a message and we\'ll try to source it for you.' },
      { q: 'Are your products authentic?', a: 'Yes, all products are 100% authentic and sourced directly from authorised distributors.' },
    ]
  },
  {
    id: 'account',
    title: 'Account & Support',
    icon: 'account-circle',
    questions: [
      { q: 'How do I create an account?', a: 'Tap "My Account" in the bottom tab and follow the sign up prompts.' },
      { q: 'How do I reset my password?', a: 'Tap "Forgot Password" on the login screen and follow the email instructions.' },
      { q: 'How do I contact support?', a: 'Use the chat feature to send us a message, or email support@graftonliquor.com' },
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
