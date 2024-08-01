import { useCallback, useEffect } from "react";
import {
  calculateDiscountAmount,
  calculateFinalPrice,
  calculatePricePerUnit,
} from "../components/commons/Utils/expenseUtils";

const useHandleFieldChange = (expense, setExpense) => {
  const handleFieldChange = useCallback(
    (field, value, additionalChanges = {}) => {
      setExpense((prevExpense) => {
        const updatedExpense = {
          ...prevExpense,
          [field]: value,
          ...additionalChanges,
        };

        // Handle price, discount, and final price calculations
        if (["price", "discountValue", "discountAmount"].includes(field)) {
          const discountAmount = updatedExpense.hasDiscount
            ? calculateDiscountAmount(updatedExpense.price, updatedExpense.discountValue)
            : 0;

          const finalPrice = calculateFinalPrice(
            updatedExpense.price,
            discountAmount,
            updatedExpense.hasDiscount
          );

          if (field === "discountAmount" && updatedExpense.price > 0) {
            updatedExpense.discountValue = ((value / updatedExpense.price) * 100).toFixed(2);
          }

          updatedExpense.discountAmount = discountAmount.toFixed(2);
          updatedExpense.finalPrice = finalPrice;
        }

        // Handle volume changes
        if (field === "volume") {
          updatedExpense.volume = parseFloat(value);
        }

        // Calculate price per unit based on measurement unit
        if (["finalPrice", "volume", "measurementUnit"].includes(field)) {
          updatedExpense.pricePerUnit = calculatePricePerUnit(
            updatedExpense.finalPrice,
            updatedExpense.volume,
            updatedExpense.measurementUnit
          );
        }

        return updatedExpense;
      });
    },
    [setExpense]
  );

  const handleDiscountAmountChange = useCallback(
    (event) => {
      const value = parseFloat(event.target.value) || 0; // Use 0 if value is NaN
      setExpense((prevExpense) => {
        const discountValue = prevExpense.price > 0 ? (value / prevExpense.price) * 100 : 0;

        const finalPrice = calculateFinalPrice(
          prevExpense.price,
          value,
          prevExpense.hasDiscount
        );

        return {
          ...prevExpense,
          discountAmount: value,
          discountValue: discountValue.toFixed(2),
          finalPrice: finalPrice,
          pricePerUnit: calculatePricePerUnit(
            finalPrice,
            prevExpense.volume,
            prevExpense.measurementUnit
          ),
        };
      });
    },
    [setExpense]
  );

  const handleDiscountValueChange = useCallback(
    (event) => {
      const value = parseFloat(event.target.value) || 0; // Use 0 if value is NaN
      setExpense((prevExpense) => {
        const discountAmount = calculateDiscountAmount(prevExpense.price, value);

        const finalPrice = calculateFinalPrice(
          prevExpense.price,
          discountAmount,
          prevExpense.hasDiscount
        );

        return {
          ...prevExpense,
          discountValue: value,
          discountAmount: discountAmount.toFixed(2),
          finalPrice: finalPrice,
          pricePerUnit: calculatePricePerUnit(
            finalPrice,
            prevExpense.volume,
            prevExpense.measurementUnit
          ),
        };
      });
    },
    [setExpense]
  );

  useEffect(() => {
    const discountAmount = calculateDiscountAmount(
      expense.price,
      expense.discountValue
    );
    const finalPrice = calculateFinalPrice(
      expense.price,
      discountAmount,
      expense.hasDiscount
    );
    const pricePerUnit = calculatePricePerUnit(
      finalPrice,
      expense.volume,
      expense.measurementUnit
    );

    setExpense((prevExpense) => ({
      ...prevExpense,
      finalPrice: finalPrice,
      discountAmount: discountAmount.toFixed(2),
      pricePerUnit: pricePerUnit,
    }));
  }, [
    expense.price,
    expense.discountValue,
    expense.hasDiscount,
    expense.volume,
    expense.measurementUnit,
    setExpense
  ]);

  return {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  };
};

export default useHandleFieldChange;