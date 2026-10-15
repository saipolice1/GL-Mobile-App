import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wixCient } from '../authentication/wixClient';

/**
 * Returns a map of catalogItemId -> total quantity currently in the cart.
 * Shares the ['currentCart'] query with the rest of the app.
 */
export function useCartQuantities() {
  const { data: cart } = useQuery({
    queryKey: ['currentCart'],
    queryFn: async () => {
      try {
        return await wixCient.currentCart.getCurrentCart();
      } catch (error) {
        return null;
      }
    },
  });

  return useMemo(() => {
    const quantities = {};
    for (const item of cart?.lineItems || []) {
      const productId = item.catalogReference?.catalogItemId;
      if (productId) {
        quantities[productId] = (quantities[productId] || 0) + (item.quantity || 0);
      }
    }
    return quantities;
  }, [cart]);
}
