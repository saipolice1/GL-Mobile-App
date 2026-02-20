import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { Platform, Dimensions, Keyboard, View, KeyboardAvoidingView } from "react-native";
import { WebView } from "react-native-webview";
import { SimpleContainer } from "../../../components/Container/SimpleContainer";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import { styles } from "../../../styles/store/checkout/checkout-screen/styles";
import Routes from "../../../routes/routes";

// Check if device is a tablet (iPad)
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.max(width, height);
  return Platform.OS === 'ios' && screenSize >= 768;
};

export function CheckoutScreen({ navigation, route }) {
  const { redirectSession, cameFrom } = route?.params || {};
  if (!redirectSession) {
    navigation.navigate(Routes.Cart);
    return null;
  }

  const goBack = () => {
    webviewRef.current.stopLoading();
    if (cameFrom !== "CartView") navigation.replace("CartView");
    navigation.goBack();
    navigation.navigate(cameFrom);
  };

  const [loading, setLoading] = useState(true);
  const [containerHeight, setContainerHeight] = useState(null);
  const webviewRef = useRef(null);

  // Listen for keyboard to force native container re-layout
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSub = Keyboard.addListener(showEvent, (e) => {
      // Let natural keyboard avoidance work
    });
    
    const hideSub = Keyboard.addListener(hideEvent, () => {
      // Force native container to recalculate by briefly changing height
      // This triggers a re-layout cycle
      setContainerHeight('99.9%');
      setTimeout(() => {
        setContainerHeight(null); // Reset to flex
      }, 50);
      
      // Also inject JS to fix web content
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          (function() {
            document.body.style.height = '100%';
            document.documentElement.style.height = '100%';
            void document.body.offsetHeight;
            setTimeout(function() {
              document.body.style.height = 'auto';
              document.body.style.minHeight = '100vh';
              window.scrollTo(0, document.documentElement.scrollTop || document.body.scrollTop);
            }, 50);
          })();
          true;
        `);
      }
    });
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Always use mobile content mode so the Wix checkout renders in single-column mobile layout
  const contentMode = "mobile";

  // JavaScript to inject before page load to ensure proper viewport and layout
  const viewportScript = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    })();
    true;
  `;

  // Post-load script to fix layout issues: ensure body fills viewport and
  // scroll to top so the page is fully visible without manual scrolling
  const postLoadScript = `
    (function() {
      document.body.style.minHeight = '100vh';
      document.body.style.overflow = 'auto';
      document.body.style.webkitOverflowScrolling = 'touch';
      document.documentElement.style.height = '100%';
      
      // Move content up by reducing top padding/margin
      var style = document.createElement('style');
      style.textContent = \`
        body { padding-top: 0 !important; margin-top: 0 !important; }
        main, [data-hook="checkout-page"], #root > div:first-child { 
          padding-top: 0 !important; 
          margin-top: 0 !important; 
        }
        /* Reduce excessive spacing in Wix checkout */
        form { padding-top: 8px !important; }
        h1, h2, h3 { margin-top: 8px !important; }
      \`;
      document.head.appendChild(style);
      window.scrollTo(0, 0);

      // Detect keyboard via visualViewport API and fix height on resize
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
          // When viewport height returns to full, force body layout
          document.body.style.minHeight = window.visualViewport.height + 'px';
          setTimeout(function() {
            document.body.style.minHeight = '100vh';
          }, 300);
        });
      }

      // Fix keyboard dismiss: when inputs blur, trigger reflow
      document.addEventListener('focusout', function() {
        setTimeout(function() {
          document.body.style.height = '100%';
          void document.body.offsetHeight;
          document.body.style.height = 'auto';
          document.body.style.minHeight = '100vh';
          window.scrollTo(0, document.documentElement.scrollTop);
        }, 100);
      });
    })();
    true;
  `;

  // User agent: on iPad, send mobile Safari UA to get mobile layout from Wix
  const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

  // Container style - uses height hack to force re-layout after keyboard dismiss
  const containerStyle = containerHeight 
    ? { height: containerHeight, flex: undefined }
    : { flex: 1 };

  const loadWebView = () => (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={containerStyle}>
        <WebView
          style={styles.container}
          setSupportMultipleWindows={false}
          ref={webviewRef}
          contentMode={contentMode}
          source={{ uri: redirectSession?.fullUrl }}
          goBack={() => navigation.navigate(Routes.Cart)}
          onLoad={() => {
            setLoading(false);
          }}
          injectedJavaScriptBeforeContentLoaded={viewportScript}
          injectedJavaScript={postLoadScript}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          overScrollMode={"never"}
          automaticallyAdjustContentInsets={true}
          automaticallyAdjustsScrollIndicatorInsets={true}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDisplayRequiresUserAction={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          userAgent={mobileUA}
          allowsBackForwardNavigationGestures={false}
          startInLoadingState={false}
        />
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SimpleContainer
      title={"Checkout"}
      navigation={navigation}
      onBackPress={goBack}
      backIcon={true}
      styles={{ backgroundColor: "white" }}
    >
      {loading && <LoadingIndicator />}
      {loadWebView()}
    </SimpleContainer>
  );
}
