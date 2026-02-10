import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Whether the current device is a tablet (screen width >= 768px).
 * Computed once at module load — safe for portrait-only apps.
 */
export const IS_TABLET = SCREEN_WIDTH >= 768;

/**
 * Current screen width — computed once at module load.
 */
export const SCREEN_WIDTH_VALUE = SCREEN_WIDTH;

/**
 * Responsive scale — scales a phone-sized value for tablet screens.
 * On phone: returns the original value.
 * On tablet: multiplies by the given factor (default 1.4).
 *
 * @param {number} value - The base value (designed for phone)
 * @param {number} [factor=1.4] - Scale multiplier for tablet
 * @returns {number} Scaled value
 */
export const rs = (value, factor = 1.4) =>
  IS_TABLET ? Math.round(value * factor) : value;
