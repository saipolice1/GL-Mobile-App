import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import * as AppleAuthentication from "expo-apple-authentication";
import { useLoginHandler } from "../../authentication/LoginHandler";
import { useWixSession } from "../../authentication/session";
import { loginWithSystemBrowser } from "../../authentication/wixSystemLogin";
import { performAppleSignIn, tryRegisterOnWix, isAppleSignInAvailable } from "../../authentication/appleAuth";
import { wixCient } from "../../authentication/wixClient";
import { SafeAreaView } from "react-native-safe-area-context";
import Routes from "../../routes/routes";
import { theme } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";

/**
 * Check if an error message indicates the user simply cancelled the login flow.
 * These should be silently ignored — not shown as errors.
 */
function isCancelError(msg) {
  if (!msg) return false;
  const lower = typeof msg === 'string' ? msg.toLowerCase() : String(msg).toLowerCase();
  return (
    lower.includes('cancel') ||
    lower.includes('dismiss') ||
    lower.includes('err_canceled') ||
    lower.includes('user denied') ||
    lower.includes('user aborted')
  );
}

export function LoginForm({ navigation, loading, disabled, onWixLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [systemLoginLoading, setSystemLoginLoading] = useState(false);
  const [appleLoginLoading, setAppleLoginLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const { sessionLoading, setSession } = useWixSession();
  const { login } = useLoginHandler();
  const queryClient = useQueryClient();

  // Check if Apple Sign-In is available on this device
  // Always show button on iOS — isAvailableAsync is used to determine full
  // native flow vs graceful fallback. Apple requires the button to always
  // be visible per guideline 4.8.
  useEffect(() => {
    if (Platform.OS === "ios") {
      isAppleSignInAvailable().then((available) => {
        setAppleAvailable(available);
        if (!available) {
          console.warn("Apple Sign-In: isAvailableAsync returned false — button will still render on iOS");
        }
      });
    }
  }, []);

  const loginHandler = async () => {
    setError(false);
    try {
      await login(email, password);
      // Invalidate queries to refresh with new auth
      queryClient.invalidateQueries({ queryKey: ["currentMember"] });
      if (navigation) {
        navigation.navigate(Routes.Home);
      }
    } catch (e) {
      setErrorMessage(e.toString());
      setError(true);
    }
  };

  const handleSystemLogin = async () => {
    setError(false);
    setSystemLoginLoading(true);
    
    try {
      const result = await loginWithSystemBrowser();
      
      if (result.success && result.tokens) {
        console.log("Login successful, updating session...");
        // Update session with new tokens
        await setSession(result.tokens);
        
        // Invalidate queries to refresh with new auth
        queryClient.invalidateQueries({ queryKey: ["currentMember"] });
        queryClient.invalidateQueries({ queryKey: ["my-orders"] });
        
        console.log("Session updated, navigation should refresh");
      } else if (result.error && !isCancelError(result.error)) {
        setErrorMessage(result.error);
        setError(true);
      }
      // If user cancelled, silently ignore — no error shown
    } catch (e) {
      const msg = e?.toString() || "Login failed";
      if (!isCancelError(msg)) {
        console.error("System login error:", e);
        setErrorMessage(msg);
        setError(true);
      }
    } finally {
      setSystemLoginLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(false);
    setAppleLoginLoading(true);
    try {
      const { email, firstName, lastName, password } = await performAppleSignIn();

      // Try to register on Wix (will fail silently if account already exists)
      const regResult = await tryRegisterOnWix(wixCient, email, password, firstName, lastName);

      // If registration succeeded and returned a sessionToken, use it directly
      if (regResult?.data?.sessionToken) {
        console.log("Apple Sign-In: Registration succeeded, using sessionToken for silent login");
        await login(email, password);
      } else {
        // Registration returned FAILURE or null — try login with generated password
        console.log("Apple Sign-In: Registration did not return sessionToken, trying login...");
        try {
          await login(email, password);
        } catch (loginErr) {
          // Login with generated password failed — account exists with different password
          // Fall back to Wix OAuth browser flow which handles existing accounts properly
          console.log("Apple Sign-In: Generated password login failed, falling back to OAuth browser flow...");
          try {
            const result = await loginWithSystemBrowser();
            if (result.success && result.tokens) {
              console.log("Apple Sign-In: OAuth browser login succeeded");
              await setSession(result.tokens);
            } else if (result.cancelled) {
              // User cancelled OAuth — silently ignore
              return;
            } else {
              throw new Error(result.error || "OAuth login failed");
            }
          } catch (oauthErr) {
            const oauthMsg = oauthErr?.toString() || "";
            if (isCancelError(oauthMsg)) return;
            console.warn("Apple Sign-In: OAuth fallback also failed:", oauthMsg);
            throw new Error(
              "Unable to sign in with Apple. Please try signing in with your email and password, or contact support at info@graftonliquor.co.nz."
            );
          }
        }
      }

      // Invalidate queries to refresh with new auth
      queryClient.invalidateQueries({ queryKey: ["currentMember"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });

      if (navigation) {
        navigation.navigate(Routes.Home);
      }
    } catch (e) {
      const msg = e?.toString() || "Apple Sign-In failed";
      // Don't show error if user cancelled
      if (!isCancelError(msg)) {
        setErrorMessage(msg);
        setError(true);
      }
    } finally {
      setAppleLoginLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <View style={styles.logoArea}>
            <Text style={styles.title}>Login</Text>
          </View>
          <View style={styles.inputView}>
        <TextInput
          theme={{ colors: { primary: theme.colors.accent } }}
          style={styles.input}
          value={email}
          mode={"outlined"}
          onChangeText={(text) => {
            setEmail(text);
            setError(false);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          label={"Email"}
          textColor={theme.colors.text}
        />
        <TextInput
          theme={{ colors: { primary: theme.colors.accent } }}
          mode={"outlined"}
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(false);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          label={"Password"}
          textColor={theme.colors.text}
        />
        <TouchableOpacity
          style={styles.loginButton}
          onPress={loginHandler}
          disabled={sessionLoading}
          activeOpacity={0.8}
        >
          {sessionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        {!sessionLoading && (
          <HelperText type="error" visible={error}>
            {errorMessage}
          </HelperText>
        )}
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Apple Sign-In — always visible on iOS per Apple Guideline 4.8 */}
        {Platform.OS === "ios" && (
          <View style={styles.appleSignInContainer}>
            {appleLoginLoading ? (
              <View style={styles.appleLoadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleSystemLogin}
          disabled={disabled || loading || systemLoginLoading || sessionLoading}
          activeOpacity={0.8}
        >
          {(loading || systemLoginLoading) ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <View style={styles.googleButtonContent}>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleG}>GL</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Grafton Liquor</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.secureLoginText}>
          You'll be redirected to our secure Grafton Liquor login (powered by Wix).
        </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  logoArea: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 24,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  inputView: {
    gap: 15,
    width: "100%",
    maxWidth: 500,
    paddingHorizontal: 30,
    alignSelf: "center",
  },
  input: {
    minWidth: "100%",
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  wixLoginButton: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  googleButton: {
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  googleG: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  secureLoginText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  appleSignInContainer: {
    marginTop: 4,
  },
  appleButton: {
    width: "100%",
    height: 50,
    minHeight: 44,
  },
  appleLoadingContainer: {
    height: 50,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
