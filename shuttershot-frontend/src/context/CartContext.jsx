import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getDeliveryRules } from '../services/api'
import { MAX_PER_ITEM } from '../utils/shop'

const CART_STORAGE_KEY = 'shuttershot_cart'

const CartContext = createContext(null)

// The cart remembers only product ids and quantities. Names, prices and stock are
// always fetched fresh, so a stale cart can never show or charge an old price.
function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => Number.isInteger(item?.productId) && Number.isInteger(item?.quantity) && item.quantity > 0)
      .map((item) => ({ productId: item.productId, quantity: Math.min(item.quantity, MAX_PER_ITEM) }))
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)
  const [open, setOpen] = useState(false)
  const [rules, setRules] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be blocked (private windows); the cart then lasts until the tab closes.
    }
  }, [items])

  // Keep several open tabs showing the same cart.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === CART_STORAGE_KEY) setItems(readStoredCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    getDeliveryRules()
      .then(setRules)
      .catch(() => {})
  }, [])

  const add = useCallback((productId, quantity = 1, limit = MAX_PER_ITEM) => {
    setItems((prev) => {
      const cap = Math.max(0, Math.min(limit, MAX_PER_ITEM))
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.min(item.quantity + quantity, cap) } : item,
        )
      }
      return cap > 0 ? [...prev, { productId, quantity: Math.min(quantity, cap) }] : prev
    })
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.productId !== productId)
        : prev.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.min(quantity, MAX_PER_ITEM) } : item,
          ),
    )
  }, [])

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setOpen(true), [])
  const closeCart = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      quantityOf: (productId) => items.find((item) => item.productId === productId)?.quantity || 0,
      add,
      setQuantity,
      remove,
      clear,
      open,
      openCart,
      closeCart,
      rules,
    }),
    [items, add, setQuantity, remove, clear, open, openCart, closeCart, rules],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
