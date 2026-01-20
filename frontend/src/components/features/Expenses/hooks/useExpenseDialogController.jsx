import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import useHandleFieldChange from "../../../../hooks/useHandleFieldChange";

export const useExpenseDialogController = ({
  open,
  mode,
  expense,
  setExpense,
}) => {
  const [productSearch, setProductSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    [],
  );
  const debouncedSetShopSearch = useMemo(
    () => debounce(setShopSearch, 250),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSetProductSearch.cancel();
      debouncedSetShopSearch.cancel();
    };
  }, [debouncedSetProductSearch, debouncedSetShopSearch]);

  useEffect(() => {
    if (!open) return;
    if (mode === "ADD") {
      setProductSearch("");
      setShopSearch("");
      setSelectedProduct(null);
    }
  }, [open, mode]);

  const handleProductInputChange = useCallback(
    (inputValue) => debouncedSetProductSearch(inputValue),
    [debouncedSetProductSearch],
  );

  const handleShopInputChange = useCallback(
    (inputValue) => debouncedSetShopSearch(inputValue),
    [debouncedSetShopSearch],
  );

  const handleProductSelect = useCallback(
  (opt) => {
    setSelectedProduct(opt);

    if (opt) {
      const unit = opt.measurementUnit || "unit";
      const volume = opt.measures?.[0] ?? 0;

      const variants = Array.isArray(opt.variants) ? opt.variants : [];
      const autoVariant =
        variants.length === 1 ? String(variants[0]?._id ?? variants[0]) : "";

      handleFieldChange("productName", opt.name, {
        brandName: "",
        measurementUnit: unit,
        volume,
        variant: autoVariant,
      });
    } else {
      handleFieldChange("productName", "", {
        brandName: "",
        measurementUnit: "",
        volume: 0,
        variant: "",
      });
    }
  },
  [handleFieldChange]
);

  const handleVariantSelect = useCallback(
    (opt) => {
      handleFieldChange("variant", opt?.value ? String(opt.value) : "");
    },
    [handleFieldChange],
  );

  const handleBrandSelect = useCallback(
    (opt) => handleFieldChange("brandName", opt?.name || opt?.value || ""),
    [handleFieldChange],
  );

  const handleShopSelect = useCallback(
    (shop) =>
      handleFieldChange("shopName", shop?.value || "", {
        locationName: shop?.locationName || "",
      }),
    [handleFieldChange],
  );

  const handleVolumeChange = useCallback(
    (opt) => handleFieldChange("volume", opt ? parseFloat(opt.value) : 0),
    [handleFieldChange],
  );

  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange],
  );

  const handleDiscountToggle = useCallback(
    (e) => {
      const checked = e.target.checked;
      handleFieldChange(
        "hasDiscount",
        checked,
        checked ? {} : { discountValue: 0, discountAmount: 0 },
      );
    },
    [handleFieldChange],
  );

  const handleTransactionType = useCallback(
    (valueOrEvent) => {
      const value = valueOrEvent?.target
        ? valueOrEvent.target.value
        : valueOrEvent;
      const isPurchased = value === "kjøpt";

      handleFieldChange("purchased", isPurchased, {
        registeredDate: isPurchased ? null : expense.registeredDate,
        purchaseDate: isPurchased ? expense.purchaseDate : null,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange],
  );

  const pickerDate = useMemo(() => {
    const v = expense.purchased ? expense.purchaseDate : expense.registeredDate;
    return dayjs(v);
  }, [expense.purchased, expense.purchaseDate, expense.registeredDate]);

  return {
    productSearch,
    shopSearch,
    selectedProduct,
    setSelectedProduct,

    handleProductSelect,
    handleProductInputChange,
    handleShopInputChange,

    handleBrandSelect,
    handleVariantSelect,
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
