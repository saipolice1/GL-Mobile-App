import * as React from "react";
import { useRef } from "react";
import { Platform, Dimensions } from "react-native";
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

  // JavaScript to inject before page load to force mobile viewport
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

  const loadWebView = () => (
    <WebView
      style={styles.container}
      setSupportMultipleWindows={false}
      ref={webviewRef}
      contentMode={contentMode}
      source={{ uri: redirectSession?.fullUrl }}
      goBack={() => navigation.navigate(Routes.Cart)}
      onLoad={() => setLoading(false)}
      injectedJavaScriptBeforeContentLoaded={viewportScript}
      scalesPageToFit={true}
      bounces={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      overScrollMode={"never"}
      automaticallyAdjustContentInsets={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    />
  );

  return (
    <>
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
    </>
  );
}
