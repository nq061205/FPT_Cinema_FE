export function getPromotion(voucher) {
  return voucher?.promotion ?? voucher ?? null
}

export function isPercentType(promotionType) {
  return String(promotionType ?? '').toUpperCase().includes('PERCENT')
}

export function computeDiscount(promotion, subtotal) {
  if (!promotion?.discountValue) return 0
  return isPercentType(promotion.promotionType)
    ? Math.round((subtotal * Number(promotion.discountValue)) / 100)
    : Number(promotion.discountValue)
}
