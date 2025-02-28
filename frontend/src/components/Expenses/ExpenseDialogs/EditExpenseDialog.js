import React, { useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { debounce } from "lodash";
import WindowedSelect from "react-windowed-select";
import { useQueryClient } from "@tanstack/react-query";
import useExpenseForm from "../useExpenseForm";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData";
import useInfiniteProducts from "../../../hooks/useInfiniteProducts";
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";

const selectStyles = { menuPortal: (base) => ({ ...base, zIndex: 9999 }) };

const EditExpenseDialog = ({
  open,
  onClose,
  selectedExpense,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  /* =====================================================
     Expense Form Hooks & State Initialization
  ====================================================== */
  const {
    expense,
    setExpense,
    loading,
    handleSaveExpense,
    resetForm,
    isFormValid,
  } = useExpenseForm(selectedExpense, selectedExpense?._id, onClose);

  const queryClient = useQueryClient();
  const { handleFieldChange } = useHandleFieldChange(expense, setExpense);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initialize form state when dialog opens
  useEffect(() => {
    if (open) {
      if (selectedExpense) setExpense(selectedExpense);
      setSelectedProduct(
        selectedExpense?.productName
          ? { label: selectedExpense.productName, ...selectedExpense }
          : null
      );
    }
  }, [open, selectedExpense, setExpense]);

  /* =====================================================
     Date Handling
  ====================================================== */
  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange]
  );

  /* =====================================================
     Product Search & Options
  ====================================================== */
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const productOptions = useMemo(
    () =>
      infiniteData?.pages.flatMap((page) =>
        page.products.map((p) => ({
          label: p.name,
          value: p.name,
          ...p,
        }))
      ) || [],
    [infiniteData]
  );

  // Debounce product search input to minimize API calls
  const debouncedSearch = useMemo(
    () => debounce((value) => setProductSearch(value), 250),
    []
  );

  /* =====================================================
     Brand Options Computation
  ====================================================== */
  const { data: brandOptions, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands",
    (data) => data.brands || [],
    { enabled: open }
  );

  const computedBrandOptions = useMemo(() => {
    if (!selectedProduct?.brands?.length) return [];
    return (brandOptions || [])
      .filter((brand) => selectedProduct.brands.includes(brand._id))
      .map((brand) => ({ label: brand.name, value: brand.name }));
  }, [selectedProduct, brandOptions]);

  /* =====================================================
     Shop Options Computation
  ====================================================== */
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

  
  const safeShops = useMemo(() => (Array.isArray(shops) ? shops : []), [shops]);

  const shopOptions = useMemo(
    () =>
      safeShops.map((shop) => ({
        label: `${shop.name}${shop.locationName ? `, ${shop.locationName}` : ""}`,
        value: shop.name,
        locationName: shop.locationName || "",
      })),
    [safeShops]
  );

  const selectedShopOption = useMemo(
    () =>
      shopOptions.find((option) => option.value === expense.shopName) || null,
    [expense.shopName, shopOptions]
  );

  /* =====================================================
     Event Handlers
  ====================================================== */
  // Handle product selection.
  const handleProductSelect = useCallback(
    (option) => {
      setSelectedProduct(option);
      setExpense((prev) => ({
        ...prev,
        productName: option?.label || "",
        brandName: "",
        type: option?.type || "",
        measurementUnit: option?.measurementUnit || "",
        volume: option?.measures?.[0] || 0,
      }));
    },
    [setExpense]
  );

  // Handle brand selection inline in the select onChange callback

  // Handle shop selection inline in the select onChange callback

  // Handle discount changes
  const handleDiscountChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      handleFieldChange("hasDiscount", checked);
      if (!checked) {
        handleFieldChange("discountValue", 0);
        handleFieldChange("discountAmount", 0);
      }
    },
    [handleFieldChange]
  );

  const handleDiscountValueChange = useCallback(
    (e) => {
      const value = parseFloat(e.target.value);
      handleFieldChange("discountValue", value);
      handleFieldChange("discountAmount", (expense.price * (value / 100)).toFixed(2));
    },
    [expense.price, handleFieldChange]
  );

  const handleDiscountAmountChange = useCallback(
    (e) => {
      const amount = parseFloat(e.target.value);
      handleFieldChange("discountAmount", amount);
      handleFieldChange("discountValue", ((amount / expense.price) * 100).toFixed(2));
    },
    [expense.price, handleFieldChange]
  );

  // Handle transaction type (purchased vs. registered)
  const handleTransactionType = useCallback(
    (e) => {
      const isPurchased = e.target.value === "purchased";
      setExpense((prev) => ({
        ...prev,
        purchased: isPurchased,
        registeredDate: isPurchased ? null : prev.registeredDate,
        purchaseDate: isPurchased ? prev.purchaseDate : null,
      }));
    },
    [setExpense]
  );

  // Close handler with query reset
  const handleClose = useCallback(() => {
    queryClient.resetQueries(["products", "brands", "shops"]);
    resetForm();
    onClose();
  }, [queryClient, resetForm, onClose]);

  /* =====================================================
     Overall Loading State & Early Return
  ====================================================== */
  const isLoadingCombined = useMemo(
    () => isLoadingProducts || isLoadingBrands || isLoadingShops,
    [isLoadingProducts, isLoadingBrands, isLoadingShops]
  );

  if (!open) return null;

  if (isLoadingCombined) {
    return (
      <BasicDialog open={open} onClose={handleClose} dialogTitle="Rediger utgift">
        <Box sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
          <p>Laster skjemadata...</p>
        </Box>
      </BasicDialog>
    );
  }

  /* =====================================================
     Render Markup
  ====================================================== */
  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle="Rediger utgift">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          isFormValid &&
            handleSaveExpense()
              .then(onUpdateSuccess)
              .catch(onUpdateFailure)
              .finally(handleClose);
        }}
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* ===== Produktvalg ===== */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={productOptions}
                value={selectedProduct}
                onChange={handleProductSelect}
                onInputChange={debouncedSearch}
                onMenuScrollToBottom={() => hasNextPage && fetchNextPage()}
                placeholder="Velg produkt"
                menuPortalTarget={document.body}
                styles={selectStyles}
                isLoading={isLoadingProducts}
              />
            </Grid>

            {/* ===== Merkevalg ===== */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={computedBrandOptions}
                value={{ label: expense.brandName, value: expense.brandName }}
                onChange={(option) =>
                  handleFieldChange("brandName", option?.value || "")
                }
                placeholder="Velg merke"
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct}
                styles={selectStyles}
                isLoading={isLoadingBrands}
              />
            </Grid>

            {/* ===== Butikkvalg ===== */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={shopOptions}
                value={selectedShopOption}
                onChange={(option) => {
                  handleFieldChange("shopName", option?.value || "");
                  handleFieldChange("locationName", option?.locationName || "");
                }}
                placeholder="Velg butikk"
                menuPortalTarget={document.body}
                styles={selectStyles}
                isLoading={isLoadingShops}
              />
            </Grid>

            {/* ===== Sted ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Sted"
                value={expense.locationName || ""}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* ===== Pris ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Pris"
                type="number"
                value={expense.price}
                onChange={(e) =>
                  handleFieldChange("price", parseFloat(e.target.value))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* ===== Volum/antall ===== */}
            <Grid item xs={12} md={6}>
              {expense.measurementUnit &&
              selectedProduct &&
              selectedProduct.measures?.length ? (
                <WindowedSelect
                  isClearable
                  options={selectedProduct.measures.map((measure) => ({
                    label: measure.toString(),
                    value: measure,
                  }))}
                  value={
                    expense.volume != null
                      ? {
                          label: expense.volume.toString(),
                          value: expense.volume,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setExpense((prev) => ({
                      ...prev,
                      volume: option ? parseFloat(option.label) : 0,
                    }))
                  }
                  placeholder="Velg volum"
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              ) : (
                <ExpenseField
                  label="Volum/antall (manuelt)"
                  type="number"
                  value={expense.volume != null ? expense.volume.toString() : ""}
                  onChange={(e) =>
                    setExpense((prev) => ({
                      ...prev,
                      volume: parseFloat(e.target.value),
                    }))
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

            {/* ===== Pris per enhet ===== */}
            <Grid item xs={12}>
              <ExpenseField
                label={`Pris per ${expense.measurementUnit || "enhet"}`}
                value={expense.pricePerUnit}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ===== Rabatt ===== */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.hasDiscount || false}
                    onChange={handleDiscountChange}
                    color="primary"
                  />
                }
                label="Rabatt?"
              />
            </Grid>

            {/* ===== Discount Fields ===== */}
            {expense.hasDiscount && (
              <>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (%)"
                    type="number"
                    value={expense.discountValue || ""}
                    onChange={handleDiscountValueChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">%</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (kr)"
                    type="number"
                    value={expense.discountAmount || ""}
                    onChange={handleDiscountAmountChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Kr</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            {/* ===== Sluttpris ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Sluttpris"
                type="number"
                value={expense.finalPrice || ""}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* ===== Type ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Type"
                value={expense.type || ""}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ===== Transaksjonstype ===== */}
            <Grid item xs={12}>
              <RadioGroup
                row
                value={expense.purchased ? "kjøpt" : "registrert"}
                onChange={handleTransactionType}
              >
                <FormControlLabel
                 value="kjøpt"
                 control={<Radio />}
                 label="Kjøpt"
                />
                <FormControlLabel
                  value="registrert"
                  control={<Radio />}
                  label="Registrert"
                />
              </RadioGroup>
            </Grid>

            {/* ===== Dato ===== */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Dato"
                value={dayjs(
                  expense.purchased
                    ? expense.purchaseDate
                    : expense.registeredDate
                )}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>

       {/* ===== Handlingsknapper ===== */}
        <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleClose}>
          Avbryt
          </Button>
          <Button variant="contained" type="submit" disabled={loading || !isFormValid}>
            {loading ? <CircularProgress size={24} /> : "Lagre endringer"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

EditExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedExpense: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditExpenseDialog;
