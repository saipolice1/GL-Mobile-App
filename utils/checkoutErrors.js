/**
 * Helpers for interpreting errors thrown while creating a Wix checkout.
 */

/**
 * Returns true when the error indicates the Wix visitor session has expired
 * (e.g. EXPIRED_SESSION_CANT_BE_USED), so the caller can refresh the session
 * and retry instead of showing an error.
 */
export function isSessionExpiredError(err) {
  let text = String(err?.message ?? err ?? '');
  try {
    text += ' ' + JSON.stringify(err?.details ?? '');
  } catch {
    // details may not be serialisable; fall back to the message only
  }
  return (
    text.includes('EXPIRED_SESSION_CANT_BE_USED') ||
    text.toLowerCase().includes('session expired')
  );
}

/**
 * Turns a checkout error into a message that is safe to show to the user.
 * Raw API payloads (long, JSON-like or containing request metadata) are
 * replaced with a generic message.
 */
export function friendlyCheckoutError(err) {
  const message = err?.message || err?.response?.data?.message || '';
  const looksLikeRawApiError =
    !message ||
    message.length > 120 ||
    message.includes('{') ||
    message.includes('INVALID_ARGUMENT') ||
    message.includes('requestId');
  if (looksLikeRawApiError) {
    return 'We couldn’t start the checkout. Please check your connection and try again.';
  }
  return `Failed to proceed to checkout:\n${message}`;
}
