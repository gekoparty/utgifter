export const calculateDiscountAmount = (price = 0, discountValue = 0) => {
  return discountValue > 0 ? (price * discountValue) / 100 : 0;
};

export const calculateFinalPrice = (price = 0, discountAmount = 0, hasDiscount = false) => {
  if (hasDiscount) {
    return (price - discountAmount).toFixed(2);
  }
  return price.toFixed(2);
};

export const calculatePricePerUnit = (finalPrice = 0, volume = 1, measurementUnit) => {
  if (volume > 0 && finalPrice > 0) {
    if (measurementUnit === "stk") {
      return (finalPrice / volume).toFixed(2); // Calculate price per piece
    }
    return (finalPrice / volume).toFixed(2); // Calculate price per unit (kg, L, etc.)
  }
  return 0;
};
