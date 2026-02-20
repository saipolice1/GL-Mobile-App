import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { Platform, Dimensions, Keyboard, View } from "react-native";
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
  const webviewRef = useRef(null);

  // Listen for keyboard hide to force WebView re-layout
  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const sub = Keyboard.addListener(hideEvent, () => {
      // Inject JS to force the page to recalculate its layout
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          (function() {
            // Force body to recalculate height
            document.body.style.height = '100%';
            document.documentElement.style.height = '100%';
            // Trigger reflow
            void document.body.offsetHeight;
            // Scroll to maintain position
            window.scrollTo(0, document.documentElement.scrollTop || document.body.scrollTop);
            // Reset to auto so content can expand
            setTimeout(function() {
              document.body.style.height = 'auto';
              document.documentElement.style.height = 'auto';
              document.body.style.minHeight = '100vh';
            }, 50);
          })();
          true;
        `);
      }
    });
    return () => sub.remove();
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

  const loadWebView = () => (
    <View style={{ flex: 1 }}>
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
