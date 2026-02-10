import * as AppleAuthentication from "expo-apple-authentication";
import * as SecureStore from "expo-secure-store";

const APPLE_CRED_KEY = "apple_auth_creds";

/**
 * Check if Apple Sign-In is available (iOS 13+)
 */
export const isAppleSignInAvailable = async () => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Perform Apple Sign-In and return credentials for Wix registration/login.
 *
 * Apple only provides email and name on the FIRST sign-in.
 * On subsequent sign-ins, we retrieve stored credentials from SecureStore.
 *
 * Returns: { email, firstName, lastName, password, appleUserId }
 */
export const performAppleSignIn = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const appleUserId = credential.user;

  // Apple only provides email and name on FIRST sign-in
  let email = credential.email;
  let firstName = credential.fullName?.givenName || "";
  let lastName = credential.fullName?.familyName || "";

  if (email) {
    // First sign-in — store credentials for future use
    await SecureStore.setItemAsync(
      `${APPLE_CRED_KEY}_${appleUserId}`,
      JSON.stringify({ email, firstName, lastName })
    );
  } else {
    // Subsequent sign-in — retrieve stored credentials
    const stored = await SecureStore.getItemAsync(
      `${APPLE_CRED_KEY}_${appleUserId}`
    );
    if (stored) {
      const data = JSON.parse(stored);
      email = data.email;
      firstName = firstName || data.firstName || "";
      lastName = lastName || data.lastName || "";
    } else {
      throw new Error(
        "Unable to retrieve your Apple ID email. Please sign in with your email and password instead."
      );
    }
  }

  // Generate a deterministic password from the Apple user ID
  // This is consistent across sign-ins for the same Apple user
  const password = `Ap!${appleUserId.substring(0, 20)}Gl#2024`;

  return { email, firstName, lastName, password, appleUserId };
};

/**
 * Try to register the Apple user on Wix.
 * Silently handles the "already exists" case — if the user is already
 * registered, we just fall through and let the login step handle it.
 */
export const tryRegisterOnWix = async (
  wixClient,
  email,
  password,
  firstName,
  lastName
) => {
  try {
    const result = await wixClient.auth.register({
      email,
      password,
      profile: {
        nickname: `${firstName} ${lastName}`.trim() || email.split("@")[0],
      },
    });
    console.log(
      "Apple Sign-In: Wix registration result:",
      result?.loginState
    );
    return result;
  } catch (e) {
    // Ignore — user may already exist on Wix
    console.log(
      "Apple Sign-In: Wix registration (may already exist):",
      e.message
    );
    return null;
  }
};
