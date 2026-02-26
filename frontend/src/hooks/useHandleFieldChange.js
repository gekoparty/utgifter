import { useCallback, useEffect } from "react";
import {
  calculateDiscountAmount,
  calculateFinalPrice,
  calculatePricePerUnit,
} from "../components/commons/Utils/expenseUtils";

const stripUndefined = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const useHandleFieldChange = (expense, setExpense) => {
  const updateExpenseValues = (prevExpense, overrides = {}) => {
    const cleanOverrides = stripUndefined(overrides);

    const {
      price,
      discountValue,
      discountAmount,
      hasDiscount,
      volume,
      measurementUnit,
    } = {
      ...prevExpense,
      ...cleanOverrides,
    };

    let newDiscountAmount = discountAmount;
    let newDiscountValue = discountValue;

    // Ensure both discount fields are in sync
    if ("discountValue" in cleanOverrides) {
      newDiscountAmount = hasDiscount
        ? calculateDiscountAmount(price, discountValue)
        : 0;
    } else if ("discountAmount" in cleanOverrides && price > 0) {
      newDiscountValue = hasDiscount ? (discountAmount / price) * 100 : 0;
    }

    const finalPrice = calculateFinalPrice(price, newDiscountAmount, hasDiscount);
    const pricePerUnit = calculatePricePerUnit(finalPrice, volume, measurementUnit);

    return {
      ...prevExpense,
      ...cleanOverrides,
      discountAmount: Number(newDiscountAmount.toFixed(2)),
      discountValue: Number(newDiscountValue.toFixed(2)),
      finalPrice,
      pricePerUnit,
    };
  };

  const handleFieldChange = useCallback(
    (field, value, additionalChanges = {}) => {
      setExpense((prevExpense) => {
        const updatedValues = stripUndefined({ [field]: value, ...additionalChanges });
        return updateExpenseValues(prevExpense, updatedValues);
      });
    },
    [setExpense]
  );

  const handleDiscountAmountChange = useCallback(
    (event) => {
      const value = Number(event.target.value) || 0;
      setExpense((prevExpense) =>
        updateExpenseValues(prevExpense, { discountAmount: value })
      );
    },
    [setExpense]
  );

  const handleDiscountValueChange = useCallback(
    (event) => {
      const value = Number(event.target.value) || 0;
      setExpense((prevExpense) =>
        updateExpenseValues(prevExpense, { discountValue: value })
      );
    },
    [setExpense]
  );

  useEffect(() => {
    setExpense((prevExpense) => {
      const updatedExpense = updateExpenseValues(prevExpense);

      if (
        prevExpense.finalPrice !== updatedExpense.finalPrice ||
        prevExpense.discountAmount !== updatedExpense.discountAmount ||
        prevExpense.pricePerUnit !== updatedExpense.pricePerUnit
      ) {
        return updatedExpense;
      }

      return prevExpense;
    });
  }, [
    expense.price,
    expense.discountValue,
    expense.hasDiscount,
    expense.volume,
    expense.measurementUnit,
    setExpense,
  ]);

  return {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  };
};

export default useHandleFieldChange;