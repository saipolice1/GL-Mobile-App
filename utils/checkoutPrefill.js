/**
 * Helpers for prefilling the Wix checkout with the member's saved details.
 */

/**
 * Parse a free-form NZ address string (e.g. "12, Queen Street, Auckland, 1010")
 * into Wix address fields.
 */
export function parseNzAddress(address) {
  if (!address || typeof address !== 'string') return {};

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return {};

  const first = parts[0];
  let addressLine1 = first;
  let usedParts = 1;

  // A leading bare street number ("12" or "12A") belongs with the street name.
  if (/^\d+[a-zA-Z]?$/.test(first) && parts.length > 1) {
    addressLine1 = `${first} ${parts[1]}`;
    usedParts = 2;
  }

  const result = { addressLine1 };

  const postalCode = parts.find((part) => /^\d{4}$/.test(part));
  if (postalCode) {
    result.postalCode = postalCode;
    const cityIndex = parts.indexOf(postalCode) - 1;
    if (cityIndex >= usedParts) {
      result.city = parts[cityIndex];
    }
  }

  return result;
}

/**
 * Build Wix contact details, including only the fields that have a value.
 */
export function buildContactDetails({ firstName, lastName, phone } = {}) {
  const details = {};
  if (firstName) details.firstName = firstName;
  if (lastName) details.lastName = lastName;
  if (phone) details.phone = phone;
  return details;
}

/**
 * Build the checkout prefill payload (shipping address + contact details).
 */
export function buildCheckoutPrefill({ savedAddress, contact } = {}) {
  const address = {
    country: 'NZ',
    ...parseNzAddress(savedAddress),
  };
  const contactDetails = buildContactDetails(contact);

  const shippingAddress = { address };
  if (Object.keys(contactDetails).length > 0) {
    shippingAddress.contactDetails = contactDetails;
  }

  return { shippingAddress };
}
