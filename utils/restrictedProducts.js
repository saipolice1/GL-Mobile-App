// Google Play suspended the Android app (Nov 2026) for facilitating tobacco sales, and
// Apple's App Store guideline 1.4.3 has the same rule — so tobacco products are hidden
// everywhere in the app on both platforms. (Still sold on the website.)
export const HIDE_TOBACCO = true;

// Wix "Smokes" collection
export const TOBACCO_COLLECTION_IDS = ["d0ce6e24-8ee8-98d5-b580-f7c61d90664b"];
export const TOBACCO_COLLECTION_SLUGS = ["smokes-1"];

// Product IDs seen in a tobacco collection this session. Lets us filter locally
// stored lists (e.g. favorites) that don't keep collectionIds.
const restrictedIds = new Set();

export function isRestrictedProduct(product) {
  if (!HIDE_TOBACCO || !product) return false;
  const id = product._id || product.id;
  if (product.collectionIds?.some((c) => TOBACCO_COLLECTION_IDS.includes(c))) {
    if (id) restrictedIds.add(id);
    return true;
  }
  return !!id && restrictedIds.has(id);
}

export function isRestrictedCollection(collection) {
  if (!HIDE_TOBACCO || !collection) return false;
  return (
    TOBACCO_COLLECTION_IDS.includes(collection._id) ||
    TOBACCO_COLLECTION_SLUGS.includes(collection.slug)
  );
}

export function filterProducts(list) {
  return HIDE_TOBACCO && Array.isArray(list) ? list.filter((p) => !isRestrictedProduct(p)) : list;
}

export function filterCollections(list) {
  return HIDE_TOBACCO && Array.isArray(list) ? list.filter((c) => !isRestrictedCollection(c)) : list;
}

// Wraps a Wix query result so `items` is filtered. `rawLength` keeps the unfiltered
// page size so pagination loops (`items.length < pageSize`) don't stop early.
function wrapResult(result, filterFn) {
  if (!result) return result;
  return new Proxy(result, {
    get(target, prop) {
      if (prop === "items") return filterFn(target.items);
      if (prop === "rawLength") return target.items?.length ?? 0;
      if (prop === "next") return async () => wrapResult(await target.next(), filterFn);
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// Wraps a Wix query builder: chained calls stay wrapped and find() is filtered.
function wrapBuilder(builder, filterFn) {
  return new Proxy(builder, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (typeof value !== "function") return value;
      if (prop === "find") return async (...args) => wrapResult(await value.apply(target, args), filterFn);
      return (...args) => {
        const out = value.apply(target, args);
        return out && typeof out.find === "function" ? wrapBuilder(out, filterFn) : out;
      };
    },
  });
}

// Patch the Wix client so every product/collection query drops tobacco items.
export function applyTobaccoFilter(client) {
  if (!HIDE_TOBACCO) return client;
  const { products, collections } = client;

  const queryProducts = products.queryProducts.bind(products);
  products.queryProducts = (...args) => wrapBuilder(queryProducts(...args), filterProducts);

  const getProduct = products.getProduct.bind(products);
  products.getProduct = async (...args) => {
    const res = await getProduct(...args);
    if (isRestrictedProduct(res?.product ?? res)) throw new Error("Product unavailable");
    return res;
  };

  const queryCollections = collections.queryCollections.bind(collections);
  collections.queryCollections = (...args) => wrapBuilder(queryCollections(...args), filterCollections);

  return client;
}

// In-app WebViews (chat, account, checkout) load the Wix website, which still sells
// tobacco. Block its store-browsing pages so the app never links out to them.
const STORE_BROWSING_PATH = /^\/(category|product-page|shop|search|store\/?$|smokes)/i;

export function isBlockedWebUrl(url) {
  if (!HIDE_TOBACCO || !url) return false;
  const m = String(url).match(/^https?:\/\/(?:www\.)?graftonliquor\.co\.nz(\/[^?#]*)?/i);
  if (!m) return false;
  const path = (m[1] || "/").replace(/\/{2,}/g, "/");
  return STORE_BROWSING_PATH.test(path);
}
