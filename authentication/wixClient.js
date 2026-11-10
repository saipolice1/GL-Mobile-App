import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { members } from "@wix/members";
import { currentCart, checkout, orders } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { applyTobaccoFilter } from "../utils/restrictedProducts";

const clientId = process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "";

export const wixCient = createClient({
  auth: OAuthStrategy({
    clientId,
  }),
  modules: {
    products,
    collections,
    members,
    currentCart,
    checkout,
    redirects,
    orders,
  },
});

// Hide tobacco products everywhere (Google Play policy) — see utils/restrictedProducts.js
applyTobaccoFilter(wixCient);
