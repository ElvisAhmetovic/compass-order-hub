
export const notifyOrdersUpdated = () => {
  // Dispatch custom event to notify components about order updates
  window.dispatchEvent(new CustomEvent('ordersUpdated'));
};

/**
 * @deprecated This function is dead code from the pre-Supabase era.
 * Orders are now persisted in Supabase. Do not use.
 */
export const updateOrderInStorage = (_updatedOrder: any) => {
  console.warn('updateOrderInStorage is deprecated. Orders are managed via Supabase.');
  notifyOrdersUpdated();
  return true;
};
