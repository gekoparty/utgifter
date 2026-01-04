import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import useHandleFieldChange from "../../../../hooks/useHandleFieldChange";

export const useExpenseDialogController = ({ open, mode, expense, setExpense }) => {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  // Debounced product search (stable)
  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    []
  );
  useEffect(() => () => debouncedSetProductSearch.cancel(), [debouncedSetProductSearch]);

  // ✅ Only reset controller state for ADD to avoid EDIT flicker
  useEffect(() => {
    if (!open) return;
    if (mode === "ADD") {
      setProductSearch("");
      setSelectedProduct(null);
    }
  }, [open, mode]);

  const handleProductInputChange = (inputValue) => {
    debouncedSetProductSearch(inputValue);
  };

  const handleProductSelect = (opt) => {
    setSelectedProduct(opt);

    if (opt) {
      const unit = opt.measurementUnit || "unit";
      const volume = opt.measures?.[0] || 0;

      // ✅ single update via handleFieldChange (keeps derived fields correct)
      handleFieldChange("productName", opt.name, {
        brandName: "",
        type: opt.type || "",
        measurementUnit: unit,
        volume,
      });
    } else {
      handleFieldChange("productName", "", {
        brandName: "",
        type: "",
        measurementUnit: "",
        volume: 0,
      });
    }
  };

  const handleBrandSelect = (opt) =>
    handleFieldChange("brandName", opt?.name || opt?.value || "");

  const handleShopSelect = (shop) =>
    handleFieldChange("shopName", shop?.value || "", {
      locationName: shop?.locationName || "",
    });

  const handleVolumeChange = (opt) =>
    handleFieldChange("volume", opt ? parseFloat(opt.value) : 0);

  const handleDateChange = (date) => {
    const key = expense.purchased ? "purchaseDate" : "registeredDate";
    handleFieldChange(key, date);
  };

  const handleDiscountToggle = (e) => {
    const checked = e.target.checked;
    // ✅ if toggling off, reset discount fields too
    handleFieldChange("hasDiscount", checked, checked ? {} : { discountValue: 0, discountAmount: 0 });
  };

  const handleTransactionType = (valueOrEvent) => {
    const value = valueOrEvent?.target ? valueOrEvent.target.value : valueOrEvent;
    const isPurchased = value === "kjøpt";

    handleFieldChange("purchased", isPurchased, {
      registeredDate: isPurchased ? null : expense.registeredDate,
      purchaseDate: isPurchased ? expense.purchaseDate : null,
    });
  };

  const pickerDate = useMemo(() => {
    const v = expense.purchased ? expense.purchaseDate : expense.registeredDate;
    return dayjs(v);
  }, [expense.purchased, expense.purchaseDate, expense.registeredDate]);

  return {
    productSearch,
    selectedProduct,
    setSelectedProduct,
    handleProductSelect,
    handleProductInputChange,
    handleBrandSelect,
    handleShopSelect,
    handleDateChange,
    handleVolumeChange,
    handleDiscountToggle,
    handleTransactionType,
    handleDiscountAmountChange,
    handleDiscountValueChange,
    handleFieldChange,
    pickerDate,
  };
};
