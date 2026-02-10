import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { wixCient } from "./wixClient";

const WIX_SESSION_KEY = "wixSession";
// Use custom scheme - this was working before
const REDIRECT_URI = "graftonliquor://oauth-callback";

/**
 * Initialize auth session - call once at app startup
 * This must be called at the top level before rendering
 */
export function initializeAuthSession() {
  WebBrowser.maybeCompleteAuthSession();
}

/**
 * Start the OAuth login flow using WebBrowser
 * @returns {Promise<{success: boolean, tokens?: any, error?: string}>}
 */
export async function loginWithSystemBrowser() {
  try {
    console.log("Starting Wix OAuth login flow...");
    console.log("Using redirect URI:", REDIRECT_URI);
    console.log("Client ID:", process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "(empty)");

    // 1) Generate oauthData and authUrl - pass redirectUri twice (original pattern)
    const oauthData = wixCient.auth.generateOAuthData(
      REDIRECT_URI,
      REDIRECT_URI
    );
    console.log("OAuth data generated, requesting auth URL...");
    
    let authUrl;
    try {
      const authResult = await wixCient.auth.getAuthUrl(oauthData);
      authUrl = authResult.authUrl;
      console.log("Auth URL generated successfully");
    } catch (authError) {
      console.error("getAuthUrl failed:", JSON.stringify(authError, null, 2));
      return { success: false, error: "OAuth setup failed: " + (authError?.message || JSON.stringify(authError)) };
    }

    // 2) Use WebBrowser.openAuthSessionAsync 
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI
    );

    console.log("WebBrowser result:", result);

    if (result.type === "cancel" || result.type === "dismiss") {
      console.log("User cancelled login");
      return { success: false, error: "Login cancelled" };
    }

    if (result.type !== "success" || !result.url) {
      console.error("Authentication failed:", result);
      return { success: false, error: "Authentication failed" };
    }

    // Parse the redirect URL to get code and state
    console.log("Parsing redirect URL:", result.url);
    const parsed = wixCient.auth.parseFromUrl(result.url, oauthData);
    
    if (!parsed.code || !parsed.state) {
      console.error("Missing code or state in redirect URL");
      return { success: false, error: "Authentication failed - missing parameters" };
    }

    console.log("Exchanging code for tokens...");
    const tokens = await wixCient.auth.getMemberTokens(
      parsed.code,
      parsed.state,
      oauthData
    );

    console.log("Tokens received successfully");

    wixCient.auth.setTokens(tokens);
    await SecureStore.setItemAsync(
      WIX_SESSION_KEY,
      JSON.stringify({ tokens, clientId: process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "" })
    );

    return { success: true, tokens };
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: error?.message || "Unknown error occurred" };
  }
}

/**
 * Restore tokens from secure storage on app startup
 * @returns {Promise<{tokens: any, clientId: string} | null>}
 */
export async function restoreTokens() {
  try {
    const wixSession = await SecureStore.getItemAsync(WIX_SESSION_KEY);
    
    if (!wixSession) {
      console.log("No stored session found");
      return null;
    }

    const { tokens, clientId } = JSON.parse(wixSession);
    const currentClientId = process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "";

    // Verify client ID matches
    if (clientId !== currentClientId) {
      console.warn("Client ID mismatch, clearing stored session");
      await clearTokens();
      return null;
    }

    console.log("Restored tokens from secure storage");
    return { tokens, clientId };
  } catch (error) {
    console.error("Error restoring tokens:", error);
    return null;
  }
}

/**
 * Clear stored tokens (logout)
 */
export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(WIX_SESSION_KEY);
    console.log("Tokens cleared from secure storage");
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}

/**
 * Check if user is currently logged in with member tokens
 * @returns {boolean}
 */
export function isLoggedIn() {
  try {
    const tokens = wixCient.auth.getTokens();
    // Member tokens have accessToken and refreshToken
    return !!(tokens?.accessToken && tokens?.refreshToken);
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
}

/**
 * Logout user and generate new visitor session
 * @param {Function} newVisitorSession - Function to generate new visitor session
 */
export async function logout(newVisitorSession) {
  try {
    console.log("Logging out user...");
    await clearTokens();
    
    // Generate new visitor session
    if (newVisitorSession) {
      await newVisitorSession();
    }
    
    console.log("Logout successful");
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
}
