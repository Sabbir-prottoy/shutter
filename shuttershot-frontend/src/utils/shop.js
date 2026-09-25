// Helpers shared by every screen of the Accessories Marketplace.

const priceFormatter = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 })

// Whole taka with the Bangladeshi digit grouping, e.g. ৳1,15,000.
export function formatBdt(amount) {
  return `৳${priceFormatter.format(amount)}`
}

// Keys match the backend's ProductCategory enum, lowercased.
export const SHOP_CATEGORIES = [
  { key: 'essentials', label: 'Camera essentials & care', tint: '#c15a3a' },
  { key: 'lighting', label: 'Lighting & filters', tint: '#c99133' },
  { key: 'lenses', label: 'Lenses & optics', tint: '#4f7fbf' },
  { key: 'support', label: 'Support & stabilisation', tint: '#6fa38a' },
  { key: 'storage', label: 'Storage, protection & control', tint: '#8a7f6f' },
  { key: 'audio_video', label: 'Audio & video', tint: '#c46a86' },
  { key: 'software', label: 'Software & business', tint: '#8874c9' },
  { key: 'everyday', label: 'Everyday carry', tint: '#3f9aa0' },
]

export const CATEGORY_BY_KEY = Object.fromEntries(SHOP_CATEGORIES.map((category) => [category.key, category]))

export const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
  { value: 'newest', label: 'Newest first' },
]

// The most of one item a single order may contain (the backend enforces the same).
export const MAX_PER_ITEM = 20

// Same rule as the backend's OrderService.deliveryFee - used only to show an estimate
// before the order is placed; the server's figure is the one charged.
export function estimateDeliveryFee(rules, { anyPhysical, district, subtotal }) {
  if (!rules || !anyPhysical || subtotal >= rules.freeDeliveryFrom) return 0
  return district && district.toLowerCase() === 'dhaka' ? rules.insideDhaka : rules.outsideDhaka
}

export const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export const ORDER_STATUS_STYLES = {
  PLACED: 'bg-accent/15 text-accent',
  CONFIRMED: 'bg-free/20 text-free',
  SHIPPED: 'bg-[#e4ecf8] text-[#3f6aa6]',
  DELIVERED: 'bg-free/30 text-free',
  CANCELLED: 'bg-booked/20 text-booked',
}
