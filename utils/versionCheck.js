/**
 * versionCheck.js
 *
 * Fetches minimum required app version from the Wix backend and compares
 * it against the currently running version.
 *
 * Endpoint: https://www.graftonliquor.co.nz/_functions/getAppConfig
 * Expected JSON: { minimumVersion: "1.0.16", iosUrl: "...", androidUrl: "..." }
 */

const CONFIG_URL = 'https://www.graftonliquor.co.nz/_functions/getAppConfig';

/**
 * Compare two semver strings (major.minor.patch).
 * Returns true if `current` is strictly below `minimum`.
 */
export function isVersionBelowMinimum(current, minimum) {
  if (!current || !minimum) return false;
  const parse = (v) => String(v).split('.').map(Number);
  const [cMaj, cMin, cPatch] = parse(current);
  const [mMaj, mMin, mPatch] = parse(minimum);
  if (cMaj !== mMaj) return cMaj < mMaj;
  if (cMin !== mMin) return cMin < mMin;
  return cPatch < mPatch;
}

/**
 * Fetch app config from the backend.
 * Returns null on any network/parse error so the app doesn't block users
 * if the endpoint is temporarily unreachable.
 *
 * @returns {Promise<{ minimumVersion: string, iosUrl: string, androidUrl: string } | null>}
 */
export async function fetchAppConfig() {
  try {
    const res = await fetch(CONFIG_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch {
    // Network error or endpoint not yet deployed — fail open (don't block users)
    return null;
  }
}
