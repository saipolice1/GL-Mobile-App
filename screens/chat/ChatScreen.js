import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { theme } from '../../styles/theme';
import { 
  FAQ_CATEGORIES, 
  openEmailContact,
  openPhoneContact,
  openWhatsAppContact,
} from '../../services/wixChat';

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
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Animated.View 
          style={{
            transform: [{
              rotate: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }}
        >
          <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
        </Animated.View>
      </View>
      <Animated.View 
        style={[
          styles.faqAnswerContainer,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            }),
            opacity: animatedHeight,
          }
        ]}
      >
        {typeof answer === 'string' ? (
          <Text style={styles.faqAnswer}>{answer}</Text>
        ) : (
          answer
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Chat WebView Modal Component
const ChatModal = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.chatModalContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>Chat with Us</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* WebView */}
        <View style={styles.webViewContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Connecting to chat...</Text>
            </View>
          )}
          <WebView
            source={{ uri: 'https://graftonliquor.co.nz/chat' }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export const ChatScreen = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleToggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleToggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleOpenChat = () => {
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
  };

  const openGoogleMaps = () => {
    const url = 'https://maps.app.goo.gl/5XX4R71WAmDz5oqu6';
    Linking.openURL(url).catch((err) => console.error('Could not open map', err));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Need Help?</Text>
        <Text style={styles.headerSubtitle}>Find answers or chat with our team</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* FAQ Section - Moved to top */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>Find quick answers to common questions</Text>
          
          {FAQ_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryContainer}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => handleToggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name={category.icon} 
                  size={24} 
                  color={theme.colors.accent} 
                />
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Animated.View 
                  style={{
                    transform: [{
                      rotate: expandedCategory === category.id ? '180deg' : '0deg'
                    }]
                  }}
                >
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </Animated.View>
              </TouchableOpacity>
              
              {expandedCategory === category.id && (
                <View style={styles.faqList}>
                  {category.questions.map((faq, index) => {
                    const isPickupQuestion = faq.q.toLowerCase().includes('pick up');
                    return (
                      <FAQItem
                        key={`${category.id}_${index}`}
                        question={faq.q}
                        answer={
                          isPickupQuestion ? (
                            <View>
                              <Text style={styles.faqAnswer}>
                                You can pick up your order at:{' '}
                              </Text>
                              <TouchableOpacity 
                                onPress={openGoogleMaps}
                                style={styles.addressContainer}
                                activeOpacity={0.7}
                              >
                                <View style={styles.addressContent}>
                                  <MaterialCommunityIcons 
                                    name="map-marker" 
                                    size={16} 
                                    color={theme.colors.accent} 
                                    style={styles.mapIcon}
                                  />
                                  <Text style={styles.addressText}>
                                    35 Park Road, Grafton, Auckland, New Zealand
                                  </Text>
                                  <Ionicons 
                                    name="external-link" 
                                    size={14} 
                                    color={theme.colors.accent} 
                                    style={styles.linkIcon}
                                  />
                                </View>
                                <Text style={styles.tapHint}>Tap to open in Maps</Text>
                              </TouchableOpacity>
                            </View>
                          ) : faq.a
                        }
                        isExpanded={expandedFAQ === `${category.id}_${index}`}
                        onToggle={() => handleToggleFAQ(`${category.id}_${index}`)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Chat with Us Section - Moved after FAQ */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={handleOpenChat}
            activeOpacity={0.8}
          >
            <View style={styles.chatButtonContent}>
              <View style={styles.chatButtonIcon}>
                <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.chatButtonText}>
                <Text style={styles.chatButtonTitle}>Chat with us</Text>
                <Text style={styles.chatButtonSubtitle}>Get instant help from our team</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Other Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other ways to reach us</Text>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => openPhoneContact()}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={24} color={theme.colors.accent} />
            <View style={styles.contactButtonText}>
              <Text style={styles.contactButtonTitle}>Call us</Text>
              <Text style={styles.contactButtonSubtitle}>+64 22 303 9580</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => openEmailContact('Support Request')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={24} color={theme.colors.accent} />
            <View style={styles.contactButtonText}>
              <Text style={styles.contactButtonTitle}>Email us</Text>
              <Text style={styles.contactButtonSubtitle}>sales@graftonliquor.co.nz</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Chat Modal */}
      <ChatModal 
        visible={showChatModal}
        onClose={handleCloseChat}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  
  // Chat Button
  chatButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatButtonText: {
    flex: 1,
  },
  chatButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Contact Buttons
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  contactButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  contactButtonSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  // FAQ Styles
  categoryContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswer: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  
  // Address styling for clickable pickup location
  addressContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent + '20', // 20% opacity
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapIcon: {
    marginRight: 6,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.accent,
    flex: 1,
    lineHeight: 18,
  },
  linkIcon: {
    marginLeft: 6,
  },
  tapHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Chat Modal Styles
  chatModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
});