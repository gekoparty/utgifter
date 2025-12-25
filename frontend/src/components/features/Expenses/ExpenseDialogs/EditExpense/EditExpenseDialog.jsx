import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Stack,
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
import VirtualizedSelect from "../../../../commons/VirtualizedSelect/VirtualizedSelect";
import useExpenseForm from "../../UseExpense/useExpenseForm";
import useHandleFieldChange from "../../../../../hooks/useHandleFieldChange";
import useFetchData from "../../../../../hooks/useFetchData";
import useInfiniteProducts from "../../../../../hooks/useInfiniteProducts";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

const EditExpenseDialog = ({
  open,
  onClose,
  selectedExpense,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  // R19 OPT: Removed useMemo for simple style computation
  const theme = useTheme();
  const selectStyles = getSelectStyles(theme);

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

  const { handleFieldChange } = useHandleFieldChange(expense, setExpense);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initialize form state when dialog opens
  useEffect(() => {
    if (open && selectedExpense) {
      setExpense(selectedExpense);
      setSelectedProduct(
        selectedExpense?.productName
          ? { label: selectedExpense.productName, ...selectedExpense }
          : null
      );
    }
  }, [open, selectedExpense, setExpense]);

  /* =====================================================
      Date Handling (R19 OPT: Removed useCallback)
  ====================================================== */
  const handleDateChange = (date) => {
    const key = expense.purchased ? "purchaseDate" : "registeredDate";
    handleFieldChange(key, date);
  };

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

  // Debounce product search input to minimize API calls (Retained useMemo for stability)
  const debouncedSearch = useMemo(
    () => debounce((value) => setProductSearch(value), 250),
    []
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);


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
          const locationResponse = await fetch(
            `/api/locations/${shop.location}`
          );
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    },
    { enabled: open }
  );

  // R19 OPT: Removed useMemo for simple array safety check
  const safeShops = Array.isArray(shops) ? shops : [];

  const shopOptions = useMemo(
    () =>
      safeShops.map((shop) => ({
        label: `${shop.name}${
          shop.locationName ? `, ${shop.locationName}` : ""
        }`,
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
      Event Handlers (R19 OPT: Removed all remaining useCallbacks)
  ====================================================== */
  
  // R19 OPT: Removed useCallback
  const handleProductSelect = (option) => {
    setSelectedProduct(option);
    setExpense((prev) => ({
      ...prev,
      productName: option?.label || "",
      brandName: "",
      type: option?.type || "",
      measurementUnit: option?.measurementUnit || "",
      volume: option?.measures?.[0] || 0,
    }));
  };

  // R19 OPT: Removed useCallback
  const handleDiscountChange = (e) => {
    const checked = e.target.checked;
    handleFieldChange("hasDiscount", checked);
    if (!checked) {
      handleFieldChange("discountValue", 0);
      handleFieldChange("discountAmount", 0);
    }
  };

  // R19 OPT: Removed useCallback
  const handleDiscountValueChange = (e) => {
    const value = parseFloat(e.target.value);
    handleFieldChange("discountValue", value);
    // Recalculate discount amount based on new percentage
    const price = expense.price || 0;
    const newAmount = (price * (value / 100)).toFixed(2);
    handleFieldChange("discountAmount", parseFloat(newAmount));
  };

  // R19 OPT: Removed useCallback
  const handleDiscountAmountChange = (e) => {
    const amount = parseFloat(e.target.value);
    handleFieldChange("discountAmount", amount);
    // Recalculate discount percentage based on new amount
    const price = expense.price || 0;
    const newValue = price > 0 ? ((amount / price) * 100).toFixed(2) : 0;
    handleFieldChange("discountValue", parseFloat(newValue));
  };

  // R19 OPT: Removed useCallback
  const handleTransactionType = (e) => {
    const isPurchased = e.target.value === "kjøpt"; // Use actual value from RadioGroup
    setExpense((prev) => ({
      ...prev,
      purchased: isPurchased,
      // Only one of these should be active at a time.
      registeredDate: isPurchased ? null : prev.registeredDate,
      purchaseDate: isPurchased ? prev.purchaseDate : null,
    }));
  };

  // R19 OPT: Removed useCallback
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* =====================================================
      Overall Loading State & Early Return
  ====================================================== */
  // R19 OPT: Removed useMemo for simple boolean computation
  const isLoadingInitial = isLoadingBrands || isLoadingShops;

  if (!open) return null;

  if (isLoadingInitial) {
    return (
      <BasicDialog
        open={open}
        onClose={handleClose}
        dialogTitle="Rediger utgift"
      >
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
          if (isFormValid) {
            handleSaveExpense()
              .then(onUpdateSuccess)
              .catch(onUpdateFailure)
              .finally(handleClose);
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* ===== Produktvalg & Merkevalg ===== */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box flex={1}>
                <VirtualizedSelect
                  isClearable
                  options={productOptions}
                  value={selectedProduct}
                  onChange={handleProductSelect}
                  onInputChange={debouncedSearch}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  placeholder="Velg produkt"
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  isLoading={isLoadingProducts}
                />
              </Box>

              <Box flex={1}>
                <VirtualizedSelect
                  isClearable
                  options={computedBrandOptions}
                  value={
                    expense.brandName
                      ? { label: expense.brandName, value: expense.brandName }
                      : null
                  }
                  onChange={(option) =>
                    // Inline simple field change
                    handleFieldChange("brandName", option?.value || "")
                  }
                  placeholder="Velg merke"
                  menuPortalTarget={document.body}
                  isDisabled={!selectedProduct}
                  styles={selectStyles}
                  isLoading={isLoadingBrands}
                />
              </Box>
            </Stack>

            {/* ===== Butikkvalg & Sted ===== */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box flex={1}>
                <VirtualizedSelect
                  isClearable
                  options={shopOptions}
                  value={selectedShopOption}
                  onChange={(option) => {
                    // Inline multiple field changes
                    handleFieldChange("shopName", option?.value || "");
                    handleFieldChange("locationName", option?.locationName || "");
                  }}
                  placeholder="Velg butikk"
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                  isLoading={isLoadingShops}
                />
              </Box>

              <Box flex={1}>
                <ExpenseField
                  label="Sted"
                  value={expense.locationName || ""}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Stack>

            {/* ===== Pris & Volum/antall ===== */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box flex={1}>
                <ExpenseField
                  label="Pris"
                  type="number"
                  value={expense.price}
                  onChange={(e) =>
                    // Inline simple field change
                    handleFieldChange("price", parseFloat(e.target.value) || 0)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Kr</InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box flex={1}>
                {expense.measurementUnit &&
                selectedProduct &&
                selectedProduct.measures?.length ? (
                  <VirtualizedSelect
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
                      // Inline simple volume update
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
                    value={
                      expense.volume != null ? expense.volume.toString() : ""
                    }
                    onChange={(e) =>
                      // Inline simple volume update
                      setExpense((prev) => ({
                        ...prev,
                        volume: parseFloat(e.target.value) || 0,
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
              </Box>
            </Stack>

            {/* ===== Pris per enhet ===== */}
            <Box>
              <ExpenseField
                label={`Pris per ${expense.measurementUnit || "enhet"}`}
                value={expense.pricePerUnit}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* ===== Rabatt Toggle ===== */}
            <Box>
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
            </Box>

            {/* ===== Discount Fields (Percentage & Amount) ===== */}
            {expense.hasDiscount && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box flex={1}>
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
                </Box>
                <Box flex={1}>
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
                </Box>
              </Stack>
            )}

            {/* ===== Sluttpris & Type ===== */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box flex={1}>
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
              </Box>

              <Box flex={1}>
                <ExpenseField
                  label="Type"
                  value={expense.type || ""}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Stack>

            {/* ===== Transaksjonstype (RadioGroup) ===== */}
            <Box>
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
            </Box>

            {/* ===== Dato ===== */}
            <Box>
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
            </Box>
          </Stack>
        </Box>

        {/* ===== Handlingsknapper ===== */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 3 }}
        >
          <Button variant="contained" onClick={handleClose}>
            Avbryt
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !isFormValid}
          >
            {loading ? <CircularProgress size={24} /> : "Lagre endringer"}
          </Button>
        </Stack>
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