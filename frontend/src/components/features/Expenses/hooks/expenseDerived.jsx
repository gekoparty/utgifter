import {
  calculateDiscountAmount,
  calculateFinalPrice,
  calculatePricePerUnit,
} from "../../../commons/Utils/expenseUtils";

export const computeDerivedExpense = (e) => {
  const price = Number(e.price) || 0;
  const hasDiscount = Boolean(e.hasDiscount);
  const discountValue = Number(e.discountValue) || 0;
  const discountAmount = hasDiscount ? calculateDiscountAmount(price, discountValue) : 0;

  const finalPrice = calculateFinalPrice(price, discountAmount, hasDiscount);
  const pricePerUnit = calculatePricePerUnit(finalPrice, Number(e.volume) || 0, e.measurementUnit);

  return {
    ...e,
    discountValue: Number(discountValue.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice,
    pricePerUnit,
  };
};
