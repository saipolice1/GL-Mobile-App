import {
  makeRedirectUri,
} from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import { WebView } from "react-native-webview";
import validator from "validator";
import { useWixSession } from "./session";
import { wixCient } from "./wixClient";

const LoginHandlerContext = React.createContext(null);

export function useLoginHandler() {
  return React.useContext(LoginHandlerContext);
}

export function LoginHandler(props) {
  const { session, setSessionLoading } = useWixSession();
  const [loginState, setLoginState] = React.useState(null);

  const silentLogin = React.useCallback(
    async (sessionToken) => {
      try {
        // Wix requires HTTPS redirect URIs - use Expo's auth proxy
        const redirectUri = "https://auth.expo.io/@saipolice/grafton-liquor";
        const data = wixCient.auth.generateOAuthData(redirectUri);
        console.log("Silent login redirect URI:", redirectUri);
        console.log("Client ID:", process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "(empty)");
        
        let authUrl;
        try {
          const authResult = await wixCient.auth.getAuthUrl(data, {
            prompt: "none",
            sessionToken,
          });
          authUrl = authResult.authUrl;
          console.log("Silent login auth URL generated successfully");
        } catch (authError) {
          console.error("Silent login getAuthUrl failed:", JSON.stringify(authError, null, 2));
          setSessionLoading(false);
          return Promise.reject(
            "OAuth setup failed. Redirect URI: " + redirectUri + " Error: " + (authError?.message || JSON.stringify(authError)),
          );
        }
        
        const result = await fetch(authUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Silent login fetch status:", result.status);
        if (result.status === 400 || result.status === 403) {
          const body = await result.text();
          console.error("Silent login fetch failed body:", body);
          setSessionLoading(false);
          return Promise.reject(
            "Redirect URI not whitelisted. Add: " + redirectUri,
          );
        }

        setLoginState({
          url: authUrl,
          data,
        });
      } catch (error) {
        console.error("Silent login error:", error);
        setSessionLoading(false);
        return Promise.reject(
          "Login failed: " + (error?.message || error?.toString() || "Unknown error"),
        );
      }
    },
    [wixCient.auth, setSessionLoading],
  );

  const login = React.useCallback(
    async (email, password) => {
      setSessionLoading(true);
      if (!validator.isEmail(email)) {
        setSessionLoading(false);
        return Promise.reject("Invalid email address!");
      }
      const result = await wixCient.auth.login({
        email,
        password,
      });
      if (!result?.data?.sessionToken) {
        setSessionLoading(false);
        if (result?.loginState === "FAILURE") {
          return Promise.reject("Email address or password is incorrect!");
        }
        return Promise.reject("An error occurred!");
      }
      await silentLogin(result.data.sessionToken);
    },
    [wixCient.auth, setSessionLoading],
  );

  React.useEffect(() => {
    const subscription = Linking.addEventListener("url", async (event) => {
      const url = new URL(event.url);
      const wixMemberLoggedIn = url.searchParams.get("wixMemberLoggedIn");
      const requiresSilentLogin =
        wixMemberLoggedIn === "true" &&
        session?.refreshToken?.role !== "member" &&
        session?.refreshToken?.sessionToken;
      if (requiresSilentLogin) {
        silentLogin(session.refreshToken.sessionToken);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <LoginHandlerContext.Provider value={{ login }}>
      <LoginHandlerInvisibleWebview
        loginState={loginState}
        setLoginState={setLoginState}
      />
      {props.children}
    </LoginHandlerContext.Provider>
  );
}

function LoginHandlerInvisibleWebview(props) {
  const { setSession } = useWixSession();

  if (!props.loginState) {
    return null;
  } else {
    return (
      <WebView
        source={{ uri: props.loginState.url }}
        originWhitelist={[
          "https://*",
          "http://*",
          "exp://*",
          "graftonliquor://*",
          "wixmobileheadless://*",
        ]}
        containerStyle={{ display: "none" }}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.startsWith(Linking.createURL("/oauth/wix/callback"))
          ) {
            const { code, state } = wixCient.auth.parseFromUrl(
              request.url,
              props.loginState.data,
            );
            wixCient.auth
              .getMemberTokens(code, state, props.loginState.data)
              .then((tokens) => {
                setSession(tokens);
                props.setLoginState(null);
              });
            return false;
          }
          return true;
        }}
      />
    );
  }
}

export function useLoginByWixManagedPages() {
  const redirectUri = makeRedirectUri({
    scheme: "graftonliquor",
    path: "oauth/wix/callback",
    preferLocalhost: false,
  });

  const { setSession, setSessionLoading } = useWixSession();
  const [error, setError] = React.useState(null);

  const openBrowser = React.useCallback(async () => {
    setSessionLoading(true);
    setError(null);

    try {
      const oauthData = wixCient.auth.generateOAuthData(redirectUri);

      const { authUrl } = await wixCient.auth.getAuthUrl(oauthData, {
        prompt: "login",
      });

      const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (res.type !== "success" || !res.url) {
        throw new Error("Login cancelled");
      }

      const { code, state, error, errorDescription } =
        wixCient.auth.parseFromUrl(res.url, oauthData);

      if (error) throw new Error(errorDescription || error);

      const tokens = await wixCient.auth.getMemberTokens(code, state, oauthData);
      setSession(tokens);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSessionLoading(false);
    }
  }, [redirectUri, setSession, setSessionLoading]);

  return { openBrowser, error };
}
