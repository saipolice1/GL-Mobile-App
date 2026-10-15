import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Whether the current device is a tablet (screen width >= 768px).
 * Computed once at module load — safe for portrait-only apps.
 */
export const IS_TABLET = SCREEN_WIDTH >= 768;

/**
 * Whether the current device is a small phone (screen width < 360px).
 * Computed once at module load — safe for portrait-only apps.
 */
export const IS_SMALL_PHONE = SCREEN_WIDTH < 360;

/**
 * Current screen width — computed once at module load.
 */
export const SCREEN_WIDTH_VALUE = SCREEN_WIDTH;

/**
 * Responsive scale — scales a phone-sized value for the current screen.
 * On tablet: multiplies by the given factor (default 1.4).
 * On small phone: scales down to 85% (never below 1).
 * On regular phone: returns the original value.
 *
 * @param {number} value - The base value (designed for phone)
 * @param {number} [factor=1.4] - Scale multiplier for tablet
 * @returns {number} Scaled value
 */
export const rs = (value, factor = 1.4) => {
  if (IS_TABLET) return Math.round(value * factor);
  if (IS_SMALL_PHONE) return Math.max(1, Math.round(value * 0.85));
  return value;
};
