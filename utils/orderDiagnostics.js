// Helpers for reading Wix order objects safely and diagnosing order fetch failures.

function nameFromContact(contact) {
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(' ').trim() || null;
}

export function getCustomerName(order) {
  const contacts = [
    order?.billingInfo?.contactDetails,
    order?.shippingInfo?.logistics?.shippingDestination?.contactDetails,
    order?.buyerInfo,
  ];

  for (const contact of contacts) {
    const name = nameFromContact(contact);
    if (name) return name;
  }

  return null;
}

export function getOrderNumber(order, fallback) {
  return order?.number ?? fallback ?? null;
}

export function getPriceRows(order) {
  const summary = order?.priceSummary;

  return [
    { label: 'Subtotal', value: summary?.subtotal?.formattedAmount },
    { label: 'Sales Tax', value: summary?.tax?.formattedAmount },
    { label: 'Total', value: summary?.total?.formattedAmount, isTotal: true },
  ].filter((row) => Boolean(row.value));
}

export function buildOrderDiagnostics(order, orderId) {
  return {
    orderId: orderId ?? null,
    hasBillingInfo: Boolean(order?.billingInfo),
    hasShippingInfo: Boolean(order?.shippingInfo),
    hasPriceSummary: Boolean(order?.priceSummary),
  };
}

export function isWixPermissionError(error) {
  return (
    error?.details?.applicationError?.code === 'READ_ORDER_FORBIDDEN' ||
    error?.message?.toLowerCase().includes('permission denied') ||
    error?.message?.toLowerCase().includes('forbidden') ||
    false
  );
}
