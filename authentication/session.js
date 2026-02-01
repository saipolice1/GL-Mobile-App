import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { ActivityIndicator } from "react-native-paper";
import "react-native-url-polyfill/auto";
import { wixCient } from "./wixClient";

/**
 * @type {React.Context<{
 *  session: import("@wix/sdk").Tokens,
 * setSession: (session: import("@wix/sdk").Tokens) => Promise<void>,
 * newVisitorSession: () => Promise<void> }>}
 */
const WixSessionContext = React.createContext(undefined);

export function WixSessionProvider(props) {
  const [session, setSessionState] = React.useState(null);
  const [sessionLoading, setSessionLoading] = React.useState(true);
  const [sessionError, setSessionError] = React.useState(null);

  const setSession = React.useCallback(
    async (tokens) => {
      try {
        wixCient.auth.setTokens(tokens);
        await SecureStore.setItemAsync(
          "wixSession",
          JSON.stringify({ tokens, clientId: props.clientId }),
        );
        setSessionState(tokens);
        setSessionLoading(false);
        setSessionError(null);
      } catch (error) {
        console.error("Error setting session:", error);
        setSessionError(error);
        setSessionLoading(false);
      }
    },
    [props.clientId],
  );

  const newVisitorSession = React.useCallback(async () => {
    try {
      setSessionState(null);
      setSessionLoading(true);
      console.log("Generating visitor tokens...");
      const tokens = await wixCient.auth.generateVisitorTokens();
      console.log("Visitor tokens generated successfully");
      await setSession(tokens);
    } catch (error) {
      console.error("Failed to generate visitor tokens:", error);
      setSessionError(error);
      setSessionLoading(false);
    }
  }, [wixCient.auth, setSession]);

  React.useEffect(() => {
    setSessionLoading(true);
    
    // Add a timeout to prevent infinite loading if Wix auth fails
    const timeoutId = setTimeout(() => {
      if (!session) {
        console.warn("Wix session initialization timeout - proceeding without authentication");
        setSessionLoading(false);
      }
    }, 5000); // 5 second timeout

    SecureStore.getItemAsync("wixSession")
      .then((wixSession) => {
        clearTimeout(timeoutId);
        if (!wixSession) {
          return newVisitorSession();
        } else {
          const { tokens, clientId } = JSON.parse(wixSession);
          if (clientId !== props.clientId) {
            return newVisitorSession();
          } else {
            return setSession(tokens);
          }
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error("WixSessionProvider error:", error);
        // Fallback: try to create a visitor session
        newVisitorSession().catch((err) => {
          console.error("Failed to create visitor session:", err);
          setSessionLoading(false);
        });
      });
      
    return () => clearTimeout(timeoutId);
  }, [props.clientId, newVisitorSession, setSession]);

  if (!session && sessionLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Fallback: if there's an error or no session after timeout, show children anyway
  // This allows the app to function in a limited capacity while Wix auth is unavailable
  if (!session && sessionError) {
    console.warn("Wix session failed to initialize, proceeding without authentication");
  }

  return (
    <WixSessionContext.Provider
      value={{
        session,
        setSession,
        sessionLoading,
        setSessionLoading,
        newVisitorSession,
      }}
    >
      {props.children}
    </WixSessionContext.Provider>
  );
}

export function useWixSession() {
  const context = React.useContext(WixSessionContext);
  if (context === undefined) {
    throw new Error("useWixSession must be used within a WixSessionProvider");
  }
  return context;
}
