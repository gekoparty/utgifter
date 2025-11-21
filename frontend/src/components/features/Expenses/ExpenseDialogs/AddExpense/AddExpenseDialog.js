import React, { useEffect, useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles"

import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";
import WindowedSelect from "react-windowed-select";

import useExpenseForm from "../../UseExpense/useExpenseForm";
import useFetchData from "../../../../../hooks/useFetchData";
import useInfiniteProducts from "../../../../../hooks/useInfiniteProducts";
import useHandleFieldChange from "../../../../../hooks/useHandleFieldChange";

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  /** ------------------------------------------------------
   *  THEME + SELECT STYLES
   * ----------------------------------------------------- */
  const theme = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  /** ------------------------------------------------------
   *  FORM STATE + HOOKS
   * ----------------------------------------------------- */
  const {
    expense,
    handleSaveExpense,
    isFormValid,
    setExpense,
    resetForm,
    loading,
  } = useExpenseForm();

  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  /** ------------------------------------------------------
   *  CLOSE HANDLER
   * ----------------------------------------------------- */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /** ------------------------------------------------------
   *  DATA FETCHING  (Products / Brands / Shops)
   * ----------------------------------------------------- */
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const {
    data: brands,
    isLoading: isLoadingBrands,
    refetch: refetchBrands,
  } = useFetchData(
    "brands",
    "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : [])
  );

  const {
    data: productBrands,
    isLoading: isLoadingProductBrands,
    refetch: refetchProductBrands,
  } = useFetchData(
    ["brands", selectedProduct?.brands],
    selectedProduct
      ? `/api/brands?ids=${selectedProduct.brands.join(",")}`
      : "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : []),
    { enabled: !!selectedProduct }
  );

  useEffect(() => {
    if (open) refetchBrands();
  }, [open, refetchBrands]);

  useEffect(() => {
    if (selectedProduct) refetchProductBrands();
  }, [selectedProduct, refetchProductBrands]);

  /** Shops */
  const { data: shops, isLoading: isLoadingShops } = useFetchData(
    "shops",
    "/api/shops",
    async (shopsData) => {
      const shopsArray = Array.isArray(shopsData)
        ? shopsData
        : shopsData?.shops || [];
      return Promise.all(
        shopsArray.map(async (shop) => {
          const locationResponse = await fetch(`/api/locations/${shop.location}`);
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    },
    { enabled: open }
  );

  /** ------------------------------------------------------
   *  INPUT DEBOUNCE
   * ----------------------------------------------------- */
  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    []
  );

  useEffect(() => {
    return () => debouncedSetProductSearch.cancel();
  }, [debouncedSetProductSearch]);

  /** ------------------------------------------------------
   *  DERIVED OPTIONS
   * ----------------------------------------------------- */
  const safeBrands = useMemo(() => (Array.isArray(brands) ? brands : []), [brands]);
  const safeShops = useMemo(() => (Array.isArray(shops) ? shops : []), [shops]);

  const productOptions = useMemo(() => {
    const allPages = infiniteData?.pages || [];
    return allPages.flatMap((page) =>
      page.products.map((product) => ({
        label: product.name,
        value: product.name,
        name: product.name,
        type: product.type,
        measurementUnit: product.measurementUnit,
        measures: product.measures,
        brands: product.brands,
      }))
    );
  }, [infiniteData]);

  const brandOptions = useMemo(() => {
    const src = selectedProduct ? productBrands : safeBrands;
    if (isLoadingBrands || isLoadingProductBrands) return [];

    if (selectedProduct?.brands?.length && src?.length) {
      const productBrandIds = selectedProduct.brands.map(String);
      return src
        .filter((b) => productBrandIds.includes(String(b._id)))
        .map((b) => ({
          label: b.name,
          value: b._id,
          name: b.name,
        }));
    }

    return src.map((b) => ({
      label: b.name,
      value: b._id,
      name: b.name,
    }));
  }, [selectedProduct, productBrands, safeBrands, isLoadingBrands, isLoadingProductBrands]);

  /** ------------------------------------------------------
   *  HANDLERS
   * ----------------------------------------------------- */
  const handleProductSelect = useCallback(
    (selectedOption) => {
      setSelectedProduct(selectedOption);

      handleFieldChange("brandName", "");

      if (selectedOption) {
        const unit = selectedOption.measurementUnit || "unit";
        const volume = selectedOption.measures?.[0] || 0;

        handleFieldChange("productName", selectedOption.name, {
          type: selectedOption.type,
          measurementUnit: unit,
          volume,
        });
      } else {
        handleFieldChange("productName", "", {
          type: "",
          measurementUnit: "",
          volume: 0,
          brandName: "",
        });
      }
    },
    [handleFieldChange]
  );

  const handleProductInputChange = useCallback(
    (inputValue) => {
      if (inputValue.trim() === "" && productSearch === "") return;
      debouncedSetProductSearch(inputValue);
    },
    [debouncedSetProductSearch, productSearch]
  );

  const handleBrandSelect = useCallback(
    (opt) => handleFieldChange("brandName", opt?.name || ""),
    [handleFieldChange]
  );

  const handleShopSelect = useCallback(
    (shop) =>
      handleFieldChange("shopName", shop?.value || "", {
        locationName: shop?.locationName || "",
      }),
    [handleFieldChange]
  );

  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange]
  );

  const handleVolumeChange = useCallback(
    (opt) =>
      handleFieldChange("volume", opt ? parseFloat(opt.value) : 0),
    [handleFieldChange]
  );

  const handleDiscountChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      handleFieldChange("hasDiscount", checked, {
        discountValue: checked ? expense.discountValue : 0,
        discountAmount: checked ? expense.discountAmount : 0,
      });
    },
    [expense.discountValue, expense.discountAmount, handleFieldChange]
  );

  const handlePurchaseChange = useCallback(
    (e) => {
      const isPurchased = e.target.checked;
      handleFieldChange("purchased", isPurchased, {
        registeredDate: isPurchased ? null : expense.registeredDate,
        purchaseDate: isPurchased ? expense.purchaseDate : null,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange]
  );

  const handleRegisterChange = useCallback(
    (e) => {
      const isRegistered = e.target.checked;
      handleFieldChange("purchased", !isRegistered, {
        registeredDate: isRegistered ? expense.registeredDate : null,
        purchaseDate: isRegistered ? null : expense.purchaseDate,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (isFormValid) {
          const saved = await handleSaveExpense();
          if (saved) {
            onAdd(saved);
            handleClose();
          }
        }
      } catch (err) {
        console.error("Save failed:", err);
      }
    },
    [isFormValid, handleSaveExpense, onAdd, handleClose]
  );

  const isLoadingCombined = useMemo(
    () => isLoadingProducts || isLoadingBrands || isLoadingShops || loading,
    [isLoadingProducts, isLoadingBrands, isLoadingShops, loading]
  );

  /** ------------------------------------------------------
   *  RENDER
   * ----------------------------------------------------- */
  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle="Legg til ny utgift">
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>

            {/* PRODUCT SELECT */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={productOptions}
                value={
                  expense.productName
                    ? { label: expense.productName, value: expense.productName }
                    : null
                }
                onChange={handleProductSelect}
                onInputChange={handleProductInputChange}
                onMenuScrollToBottom={() => hasNextPage && fetchNextPage()}
                isLoading={isLoadingProducts}
                placeholder="Velg produkt"
                loadingMessage={() => "Søker etter produkter..."}
                menuPortalTarget={document.body}
                styles={selectStyles}
              />
            </Grid>

            {/* BRAND SELECT */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={brandOptions}
                value={
                  expense.brandName
                    ? { label: expense.brandName, value: expense.brandName }
                    : null
                }
                onChange={handleBrandSelect}
                placeholder={selectedProduct ? "Velg merke" : "Velg et produkt først"}
                isLoading={isLoadingBrands || isLoadingProductBrands}
                loadingMessage={() => "Laster inn merker..."}
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct}
                styles={selectStyles}
              />
            </Grid>

            {/* SHOP SELECT */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={safeShops.map((shop) => ({
                  label: `${shop.name}, ${shop.locationName}`,
                  value: shop.name,
                  name: shop.name,
                  locationName: shop.locationName,
                }))}
                value={
                  expense.shopName
                    ? { label: expense.shopName, value: expense.shopName }
                    : null
                }
                onChange={handleShopSelect}
                placeholder="Velg butikk"
                menuPortalTarget={document.body}
                styles={selectStyles}
              />
            </Grid>

            {/* LOCATION */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Sted"
                value={expense.locationName}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* PRICE */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Pris"
                type="number"
                value={expense.price}
                onChange={(e) =>
                  setExpense((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value),
                  }))
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
                }}
              />
            </Grid>

            {/* VOLUME SELECT OR FIELD */}
            <Grid item xs={12} md={6}>
              {expense.measurementUnit &&
              selectedProduct &&
              selectedProduct.measures?.length > 0 ? (
                <WindowedSelect
                  isClearable
                  options={selectedProduct.measures.map((m) => ({
                    label: m.toString(),
                    value: m,
                  }))}
                  value={
                    expense.volume
                      ? { label: expense.volume.toString(), value: expense.volume }
                      : null
                  }
                  onChange={handleVolumeChange}
                  placeholder="Velg volum"
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              ) : (
                <ExpenseField
                  label="Volum (manuelt)"
                  type="number"
                  value={expense.volume || ""}
                  onChange={(e) =>
                    handleFieldChange("volume", parseFloat(e.target.value) || 0)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {expense.measurementUnit}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>

            {/* PRICE PER UNIT */}
            <Grid item xs={12}>
              <ExpenseField
                label={`Pris per ${expense.measurementUnit || ""}`}
                value={expense.pricePerUnit || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* QUANTITY */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Antall"
                type="number"
                value={expense.quantity}
                onChange={(e) => handleFieldChange("quantity", e.target.value)}
              />
            </Grid>

            {/* DISCOUNT TOGGLE */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.hasDiscount}
                    onChange={handleDiscountChange}
                    color="primary"
                  />
                }
                label="Rabatt?"
              />
            </Grid>

            {/* DISCOUNT FIELDS */}
            {expense.hasDiscount && (
              <>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (%)"
                    type="number"
                    value={expense.discountValue}
                    onChange={handleDiscountValueChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (kr)"
                    type="number"
                    value={expense.discountAmount}
                    onChange={handleDiscountAmountChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
                    }}
                  />
                </Grid>
              </>
            )}

            {/* FINAL PRICE */}
            <Grid item xs={12}>
              <ExpenseField
                label="Sluttpris"
                value={expense.finalPrice || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* PURCHASED / REGISTERED */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.purchased}
                    onChange={handlePurchaseChange}
                    color="primary"
                  />
                }
                label="Kjøpt"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!expense.purchased}
                    onChange={handleRegisterChange}
                    color="primary"
                  />
                }
                label="Registrert"
              />
            </Grid>

            {/* DATE */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Dato"
                value={
                  dayjs(
                    expense.purchased
                      ? expense.purchaseDate
                      : expense.registeredDate
                  )
                }
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* ACTION BUTTONS */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={handleClose} sx={{ mr: 1 }}>
            Avbryt
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid || isLoadingCombined}
          >
            {isLoadingCombined ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

AddExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddExpenseDialog;



