export const calculateDiscountAmount = (price = 0, discountValue = 0) => {
  const p = Number(price) || 0;
  const dv = Number(discountValue) || 0;
  return dv > 0 ? (p * dv) / 100 : 0;
};

export const calculateFinalPrice = (price = 0, discountAmount = 0, hasDiscount = false) => {
  const p = Number(price) || 0;
  const da = Number(discountAmount) || 0;
  const result = hasDiscount ? p - da : p;
  return Number(result.toFixed(2));
};

export const calculatePricePerUnit = (finalPrice = 0, volume = 1, measurementUnit) => {
  const fp = Number(finalPrice) || 0;
  const v = Number(volume) || 0;

  if (v > 0 && fp > 0) {
    // "stk" is still per-piece, but math is the same
    return Number((fp / v).toFixed(2));
  }
  return 0;
};
