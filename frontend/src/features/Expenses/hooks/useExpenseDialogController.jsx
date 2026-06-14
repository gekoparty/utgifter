import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { debounce } from "lodash";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";

export const useExpenseDialogController = ({ open, mode, expense, setExpense }) => {
  const [productSearch, setProductSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { handleFieldChange, handleDiscountAmountChange, handleDiscountValueChange } =
    useHandleFieldChange(expense, setExpense);

  const debouncedSetProductSearch = useMemo(() => debounce(setProductSearch, 300), []);
  const debouncedSetShopSearch = useMemo(() => debounce(setShopSearch, 250), []);

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
    [debouncedSetProductSearch]
  );

  const handleShopInputChange = useCallback(
    (inputValue) => debouncedSetShopSearch(inputValue),
    [debouncedSetShopSearch]
  );

 const handleProductSelect = useCallback(
  (opt) => {
    setSelectedProduct(opt);

    if (opt) {
      const unit = opt.measurementUnit || expense.measurementUnit || "unit";
      const currentVolume = Number(expense.volume);
      const volume =
        Number.isFinite(currentVolume) && currentVolume > 0
          ? currentVolume
          : (opt.measures?.[0] ?? 0);

      const variants = Array.isArray(opt.variants) ? opt.variants : [];
      let autoVariantId = "";
      let autoVariantName = "";

      if (variants.length === 1) {
        const v = variants[0];
        autoVariantId = String(typeof v === "string" ? v : (v?._id ?? ""));
        autoVariantName = typeof v === "string" ? "" : String(v?.name ?? "");
      }

      // ✅ IMPORTANT: extract ID safely
      const pid = String(opt.id ?? opt._id ?? opt.value ?? "").trim();

      handleFieldChange("productName", opt.name, {
        productId: pid, // 🔥 THIS WAS MISSING
        measurementUnit: unit,
        volume,
        volumeText: null,
        variant: autoVariantId,
        variantName: autoVariantName,
      });
    } else {
      handleFieldChange("productName", "", {
        productId: "", // 🔥 clear id too
        measurementUnit: "",
        volume: 0,
        variant: "",
        variantName: "",
      });
    }
  },
  [expense.measurementUnit, expense.volume, handleFieldChange]
);

  const handleVariantSelect = useCallback(
    (opt) => {
      handleFieldChange("variant", opt?.value ? String(opt.value) : "", {
        variantName: opt?.label ? String(opt.label) : "",
      });
    },
    [handleFieldChange]
  );

  // ✅ brandName should always store NAME, not id
  const handleBrandSelect = useCallback(
  (opt) =>
    handleFieldChange("brandName", opt?.name || opt?.label || "", {
      brandId: opt?.value ? String(opt.value) : "",  // ✅ store ID
    }),
  [handleFieldChange]
);

 const handleShopSelect = useCallback(
  (shop) =>
    handleFieldChange("shopName", shop?.name || "", {
      shopId: shop?.value || "",     // ✅ store ID
      locationId: shop?.locationId || "",
      locationName: shop?.locationName || "",
    }),
  [handleFieldChange]
);

  const handleVolumeChange = useCallback(
    (opt) => handleFieldChange("volume", opt ? parseFloat(opt.value) : 0),
    [handleFieldChange]
  );

  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date && dayjs(date).isValid() ? dayjs(date).format("YYYY-MM-DD") : null);
    },
    [expense.purchased, handleFieldChange]
  );

  const handleDiscountToggle = useCallback(
    (e) => {
      const checked = e.target.checked;
      handleFieldChange("hasDiscount", checked, checked ? {} : { discountValue: 0, discountAmount: 0 });
    },
    [handleFieldChange]
  );

  const handleTransactionType = useCallback(
    (valueOrEvent) => {
      const value = valueOrEvent?.target ? valueOrEvent.target.value : valueOrEvent;
      const isPurchased = value === "kjøpt";

      handleFieldChange("purchased", isPurchased, {
        registeredDate: isPurchased ? null : expense.registeredDate,
        purchaseDate: isPurchased ? expense.purchaseDate : null,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange]
  );

  const pickerDate = useMemo(() => {
    const v = expense.purchased ? expense.purchaseDate : expense.registeredDate;
    return v ? dayjs(v) : null;
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
