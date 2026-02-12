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

  // Determine content mode based on device type
  const contentMode = isTablet() ? "desktop" : "mobile";

  // JavaScript to inject before page load to set proper viewport
  // For tablets, we use a smaller initial scale to prevent zoomed-in appearance
  const viewportScript = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
      meta.content = 'width=device-width, initial-scale=1.0, shrink-to-fit=yes';
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
