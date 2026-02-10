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
        const data = wixCient.auth.generateOAuthData(
          Linking.createURL("/oauth/wix/callback"),
        );
        console.log("Silent login redirect URI:", Linking.createURL("/oauth/wix/callback"));
        const { authUrl } = await wixCient.auth.getAuthUrl(data, {
          prompt: "none",
          sessionToken,
        });
        const result = await fetch(authUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (result.status === 400 || result.status === 403) {
          setSessionLoading(false);
          return Promise.reject(
            "Invalid redirect URI. Please add this URI to your Wix OAuth App: " +
            Linking.createURL("/oauth/wix/callback"),
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
