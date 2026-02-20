import * as React from "react";
import { useRef } from "react";
import { Platform, Dimensions, Keyboard } from "react-native";
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

  const [loading, setLoading] = React.useState(true);
  const webviewRef = useRef(null);

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
      window.scrollTo(0, 0);

      // Fix keyboard dismiss: when inputs blur, scroll back into view
      document.addEventListener('focusout', function() {
        setTimeout(function() {
          window.scrollTo(0, document.documentElement.scrollTop);
        }, 100);
      });
    })();
    true;
  `;

  // User agent: on iPad, send mobile Safari UA to get mobile layout from Wix
  const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

  const loadWebView = () => (
    <WebView
      style={styles.container}
      setSupportMultipleWindows={false}
      ref={webviewRef}
      contentMode={contentMode}
      source={{ uri: redirectSession?.fullUrl }}
      goBack={() => navigation.navigate(Routes.Cart)}
      onLoad={() => {
        setLoading(false);
        // Dismiss native keyboard tracking issues
        Keyboard.dismiss();
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
