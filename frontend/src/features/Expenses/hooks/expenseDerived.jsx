import {
  calculateDiscountAmount,
  calculateFinalPrice,
  calculatePricePerUnit,
} from "../../../components/commons/Utils/expenseUtils";

export const computeDerivedExpense = (e) => {
  const price = Number(e.price) || 0;
  const hasDiscount = Boolean(e.hasDiscount);
  const discountValue = Number(e.discountValue) || 0;
  const discountSource = hasDiscount
    ? e.discountSource || (Number(e.discountAmount) > 0 ? "amount" : "percent")
    : "";
  const rawDiscountAmount = Number(e.discountAmount) || 0;
  const discountAmount =
    hasDiscount && discountSource === "amount"
      ? rawDiscountAmount
      : hasDiscount
        ? calculateDiscountAmount(price, discountValue)
        : 0;
  const syncedDiscountValue =
    hasDiscount && discountSource === "amount" && price > 0
      ? (discountAmount / price) * 100
      : discountValue;

  const finalPrice = calculateFinalPrice(price, discountAmount, hasDiscount);
  const pricePerUnit = calculatePricePerUnit(finalPrice, Number(e.volume) || 0, e.measurementUnit);

  return {
    ...e,
    discountSource,
    discountValue: Number(syncedDiscountValue.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice,
    pricePerUnit,
  };
};
