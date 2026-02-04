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
    
    const restoreSession = async () => {
      try {
        const sessionStr = await SecureStore.getItemAsync("wixSession");
        
        if (sessionStr) {
          const storedSession = JSON.parse(sessionStr);
          
          // Check if client ID matches
          if (storedSession.clientId === props.clientId && storedSession.tokens) {
            console.log("Restoring saved session...");
            
            // Check if it's a member token (has refreshToken) or visitor token
            if (storedSession.tokens.refreshToken) {
              console.log("Found member session, restoring...");
              wixCient.auth.setTokens(storedSession.tokens);
              setSessionState(storedSession.tokens);
              setSessionLoading(false);
              return;
            } else {
              console.log("Found visitor session, creating fresh one...");
            }
          } else {
            console.log("Client ID mismatch, clearing old session");
            await SecureStore.deleteItemAsync("wixSession");
          }
        }
        
        // No valid member session, create visitor session
        console.log("Creating new visitor session...");
        await newVisitorSession();
      } catch (error) {
        console.error("Failed to restore session:", error);
        // Try to create visitor session as fallback
        try {
          await newVisitorSession();
        } catch (visitorError) {
          console.error("Failed to create visitor session:", visitorError);
          setSessionError(visitorError);
          setSessionLoading(false);
        }
      }
    };
    
    restoreSession();
      
  }, [newVisitorSession, props.clientId]);

  // Check if user is logged in (has refresh token = member session)
  // This must be before any conditional returns to follow Rules of Hooks
  const isLoggedIn = React.useMemo(() => {
    return !!(session?.accessToken && session?.refreshToken);
  }, [session]);

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
        isLoggedIn,
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
