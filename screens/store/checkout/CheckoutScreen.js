import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { Platform, Keyboard, View, KeyboardAvoidingView } from "react-native";
import { WebView } from "react-native-webview";
import { SimpleContainer } from "../../../components/Container/SimpleContainer";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import { styles } from "../../../styles/store/checkout/checkout-screen/styles";
import Routes from "../../../routes/routes";

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

  // Keyboard show/hide: inject scroll nudge (no container resize!)
  useEffect(() => {
    const nudgeScript = `
      (function() {
        function nudge() {
          var y = window.scrollY || document.documentElement.scrollTop || 0;
          document.body.style.webkitTransform = 'translateZ(0)';
          window.scrollTo(0, y + 1);
          window.scrollTo(0, y);
        }
        setTimeout(nudge, 60);
        setTimeout(nudge, 250);
        setTimeout(nudge, 600);
      })();
      true;
    `;

    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const hideSub = Keyboard.addListener(hideEvent, () => {
      webviewRef.current?.injectJavaScript(nudgeScript);
    });

    // Also nudge on keyboard show (iOS) to handle scroll stuck issues
    let showSub;
    if (Platform.OS === "ios") {
      showSub = Keyboard.addListener("keyboardWillShow", () => {
        setTimeout(() => {
          webviewRef.current?.injectJavaScript(nudgeScript);
        }, 200);
      });
    }

    return () => {
      hideSub.remove();
      showSub?.remove();
    };
  }, []);

  // Always use mobile content mode
  const contentMode = "mobile";

  // Viewport script with viewport-fit=cover
  const viewportScript = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    })();
    true;
  `;

  // Post-load script: safe-area padding + reflow nudge on focus transitions
  const postLoadScript = `
(function() {
  if (window.__RN_CHECKOUT_FIXES_INSTALLED__) return true;
  window.__RN_CHECKOUT_FIXES_INSTALLED__ = true;

  var style = document.getElementById('rn-checkout-fixes');
  if (!style) {
    style = document.createElement('style');
    style.id = 'rn-checkout-fixes';
    document.head.appendChild(style);
  }
  style.textContent =
    'html, body { background:#fff !important; overflow-x:hidden !important; }' +
    'body { padding-bottom: calc(env(safe-area-inset-bottom) + 24px) !important; }' +
    'form { padding-top: 8px !important; }' +
    'h1, h2, h3 { margin-top: 8px !important; }';

  function nudge() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.webkitTransform = 'translateZ(0)';
    window.scrollTo(0, y + 1);
    window.scrollTo(0, y);
  }

  document.addEventListener('focusin', function() {
    setTimeout(nudge, 60);
    setTimeout(nudge, 250);
    setTimeout(nudge, 500);
  }, true);

  document.addEventListener('focusout', function() {
    setTimeout(nudge, 60);
    setTimeout(nudge, 250);
    setTimeout(nudge, 600);
  }, true);

  setTimeout(nudge, 300);
  window.scrollTo(0, 0);

  return true;
})();
true;
`;
  const loadWebView = () => (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <WebView
          style={[styles.container, { backgroundColor: '#fff' }]}
          containerStyle={{ backgroundColor: '#fff' }}
          setSupportMultipleWindows={false}
          ref={webviewRef}
          contentMode={contentMode}
          source={{ uri: redirectSession?.fullUrl }}
          onLoadEnd={() => setLoading(false)}
          injectedJavaScriptBeforeContentLoaded={viewportScript}
          injectedJavaScript={postLoadScript}
          scalesPageToFit={Platform.OS !== 'ios'}
          bounces={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          overScrollMode="never"
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          contentInsetAdjustmentBehavior="never"
          keyboardDisplayRequiresUserAction={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
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
