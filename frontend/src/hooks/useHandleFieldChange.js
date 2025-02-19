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
        let updatedExpense = {
          ...prevExpense,
          [field]: value,
          ...additionalChanges,
        };

        // Handle price, discount, and final price calculations
        if (["price", "discountValue", "discountAmount"].includes(field)) {
          let discountAmount = updatedExpense.hasDiscount
            ? calculateDiscountAmount(updatedExpense.price, updatedExpense.discountValue)
            : 0;

            let finalPrice = calculateFinalPrice(
              updatedExpense.price,
              discountAmount,
              updatedExpense.hasDiscount
            );


          if (field === "discountAmount" && updatedExpense.price > 0) {
            updatedExpense.discountValue = parseFloat(
              ((value / updatedExpense.price) * 100).toFixed(2)
            );
          }

          updatedExpense.discountAmount = parseFloat(discountAmount.toFixed(2));
          updatedExpense.finalPrice = finalPrice;
        }

        // Handle volume changes
        if (field === "volume") {
          updatedExpense.volume = parseFloat(value) || 0;
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
      const value = parseFloat(event.target.value) || 0;
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
          discountValue: parseFloat(discountValue.toFixed(2)),
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
      const value = parseFloat(event.target.value) || 0;
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
          discountAmount: parseFloat(discountAmount.toFixed(2)),
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
    const discountAmount = expense.hasDiscount
      ? calculateDiscountAmount(expense.price, expense.discountValue)
      : 0;
  
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
  
    if (
      expense.finalPrice !== finalPrice ||
      expense.discountAmount !== discountAmount ||
      expense.pricePerUnit !== pricePerUnit
    ) {
      setExpense((prevExpense) => ({
        ...prevExpense,
        finalPrice: finalPrice,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        pricePerUnit: pricePerUnit,
      }));
    }
 }, [
  expense.price,
  expense.discountValue,
  expense.hasDiscount,
  expense.volume,
  expense.measurementUnit,
  expense.finalPrice,
  expense.discountAmount,
  expense.pricePerUnit,
  setExpense
]);

  return {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  };
};

export default useHandleFieldChange;
