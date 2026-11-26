import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { CART_STORAGE_KEY, ROLES } from '../utils/constants';

const CartContext = createContext(null);

function getCartKeyForUser(user) {
  if (!user || user.role !== ROLES.CUSTOMER || !user.id) {
    return null;
  }
  return `${CART_STORAGE_KEY}_user_${user.id}`;
}

function readCartFromStorage(storageKey) {
  if (!storageKey) return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = getCartKeyForUser(user);

  const [cartState, setCartState] = useState(() => ({
    key: storageKey,
    items: readCartFromStorage(storageKey),
  }));

  // Sync in-memory cart whenever the authenticated customer changes
  useEffect(() => {
    setCartState({
      key: storageKey,
      items: readCartFromStorage(storageKey),
    });
  }, [storageKey]);

  // Persist changes only for the active customer's own storage key
  useEffect(() => {
    if (!cartState.key || cartState.key !== storageKey) return;
    try {
      localStorage.setItem(cartState.key, JSON.stringify(cartState.items));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartState, storageKey]);

  const addItem = useCallback(
    (product, quantity = 1) => {
      if (!storageKey) return;
      const qtyToAdd = Math.max(1, Number(quantity) || 1);
      setCartState((prev) => {
        const currentItems = prev.key === storageKey ? prev.items : [];
        const existing = currentItems.find((item) => item.productId === product.id);
        const nextItems = existing
          ? currentItems.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    name: product.name,
                    sku: product.sku,
                    price: Number(product.price),
                    categoryName: product.categoryName,
                    quantity: item.quantity + qtyToAdd,
                  }
                : item
            )
          : [
              ...currentItems,
              {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(product.price),
                categoryName: product.categoryName,
                quantity: qtyToAdd,
              },
            ];
        return { key: storageKey, items: nextItems };
      });
    },
    [storageKey]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => {
      if (!storageKey) return;
      const parsed = Number(quantity);
      setCartState((prev) => {
        const currentItems = prev.key === storageKey ? prev.items : [];
        const nextItems =
          Number.isNaN(parsed) || parsed <= 0
            ? currentItems.filter((item) => item.productId !== productId)
            : currentItems.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: Math.floor(parsed) }
                  : item
              );
        return { key: storageKey, items: nextItems };
      });
    },
    [storageKey]
  );

  const removeItem = useCallback(
    (productId) => {
      if (!storageKey) return;
      setCartState((prev) => ({
        key: storageKey,
        items: (prev.key === storageKey ? prev.items : []).filter(
          (item) => item.productId !== productId
        ),
      }));
    },
    [storageKey]
  );

  const clearCart = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setCartState({ key: storageKey, items: [] });
  }, [storageKey]);

  const items = useMemo(
    () => (cartState.key === storageKey ? cartState.items : []),
    [cartState, storageKey]
  );

  const summary = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const estimatedSubtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    return {
      itemCount,
      estimatedSubtotal,
      estimatedTotal: estimatedSubtotal,
    };
  }, [items]);

  const value = {
    items,
    ...summary,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
