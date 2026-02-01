import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { 
  FAQ_CATEGORIES, 
  sendMessageToInbox, 
  sendHelpRequest,
  MESSAGE_TYPES,
  openEmailContact,
  openPhoneContact,
  openWhatsAppContact,
} from '../../services/wixChat';
import Routes from '../../routes/routes';
import { WIX_PAGES } from '../webview/WebViewScreen';

const { width, height } = Dimensions.get('window');

// FAQ Item Component
const FAQItem = ({ question, answer, isExpanded, onToggle }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  return (
    <TouchableOpacity 
      style={styles.faqItem} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={theme.colors.textMuted} 
        />
      </View>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
};

// FAQ Category Card
const FAQCategoryCard = ({ category, onPress }) => {
  const getIcon = () => {
    switch (category.icon) {
      case 'truck': return 'truck-delivery';
      case 'receipt': return 'receipt';
      case 'bottle-wine': return 'bottle-wine';
      case 'account-circle': return 'account-circle';
      default: return 'help-circle';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconContainer}>
        <MaterialCommunityIcons name={getIcon()} size={28} color={theme.colors.accent} />
      </View>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
};

// Chat Message Bubble
const MessageBubble = ({ message, isUser }) => (
  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.supportBubble]}>
    <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message}</Text>
    <Text style={styles.messageTime}>
      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
);

export const HelpChatScreen = ({ navigation, route }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Hi! 👋 How can we help you today?', isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef(null);

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setExpandedFAQ(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setExpandedFAQ(null);
  };

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);
    
    // Add user message
    setChatMessages(prev => [...prev, { 
      id: Date.now(), 
      text: userMessage, 
      isUser: true 
    }]);
    
    // Send to Wix Inbox
    const result = await sendMessageToInbox(userMessage, MESSAGE_TYPES.HELP);
    
    // Add response message
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: result.success 
          ? 'Thanks for your message! Our team will respond shortly. You\'ll receive a notification when we reply.'
          : 'Sorry, there was an issue sending your message. Please try again.',
        isUser: false 
      }]);
      setIsSending(false);
    }, 1000);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Chat View
  if (showChat) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowChat(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chat with Us</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Usually replies in 1 hour</Text>
            </View>
          </View>
        </View>
        
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
            ))}
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() && !isSending ? '#FFF' : theme.colors.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // FAQ Category Detail View
  if (selectedCategory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory.title}</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedCategory.questions.map((item, index) => (
            <FAQItem
              key={index}
              question={item.q}
              answer={item.a}
              isExpanded={expandedFAQ === index}
              onToggle={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
            />
          ))}
          
          <View style={styles.stillNeedHelp}>
            <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
            <Text style={styles.stillNeedHelpText}>
              Can't find what you're looking for? Send us a message!
            </Text>
            <TouchableOpacity 
              style={styles.chatButton} 
              onPress={() => navigation.navigate(Routes.WebView, {
                url: WIX_PAGES.CHAT,
                title: 'Chat with Us'
              })}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={styles.chatButtonText}>Start a Chat</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main FAQ Categories View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <Text style={styles.sectionSubtitle}>
          Find quick answers to common questions
        </Text>
        
        {FAQ_CATEGORIES.map((category) => (
          <FAQCategoryCard
            key={category.id}
            category={category}
            onPress={() => handleCategoryPress(category)}
          />
        ))}
        
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need more help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to assist you
          </Text>
          
          {/* Primary Option: Open Wix Chat in WebView - Messages go to Wix Inbox! */}
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={() => navigation.navigate(Routes.WebView, {
              url: WIX_PAGES.CHAT,
              title: 'Chat with Us'
            })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
            <Text style={styles.chatButtonText}>Chat with Us</Text>
          </TouchableOpacity>
          <Text style={styles.chatHint}>Messages appear in Wix Inbox</Text>
          
          {/* Direct Contact Options */}
          <View style={styles.directContactSection}>
            <Text style={styles.directContactLabel}>Or contact us directly:</Text>
            
            <TouchableOpacity 
              style={styles.directContactButton}
              onPress={() => openEmailContact('Help Request from App', '')}
            >
              <View style={styles.directContactIcon}>
                <Ionicons name="mail" size={22} color={theme.colors.accent} />
              </View>
              <View style={styles.directContactInfo}>
                <Text style={styles.directContactTitle}>Email Us</Text>
                <Text style={styles.directContactSubtitle}>support@graftonliquor.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.directContactButton}
              onPress={openPhoneContact}
            >
              <View style={styles.directContactIcon}>
                <Ionicons name="call" size={22} color={theme.colors.accent} />
              </View>
              <View style={styles.directContactInfo}>
                <Text style={styles.directContactTitle}>Call Us</Text>
                <Text style={styles.directContactSubtitle}>Mon-Sat, 9am-9pm</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.directContactButton}
              onPress={() => openWhatsAppContact('Hi! I need help with my Grafton Liquor order.')}
            >
              <View style={[styles.directContactIcon, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              </View>
              <View style={styles.directContactInfo}>
                <Text style={styles.directContactTitle}>WhatsApp</Text>
                <Text style={styles.directContactSubtitle}>Quick response</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerTitleContainer: {
    flex: 1,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  stillNeedHelp: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  stillNeedHelpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  stillNeedHelpText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactSection: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  emailButtonText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  // Direct contact styles
  directContactSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  directContactLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  directContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  directContactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  directContactInfo: {
    flex: 1,
  },
  directContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  directContactSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: theme.colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  messageTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
});

export default HelpChatScreen;
