import { useEffect, useState, useMemo } from "react";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

import {
  Box,
  Button,
  Stack,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";
import VirtualizedSelect from "../../../../commons/VirtualizedSelect/VirtualizedSelect";

import useExpenseForm from "../../UseExpense/useExpenseForm";
import useFetchData from "../../../../../hooks/useFetchData";
import useInfiniteProducts from "../../../../../hooks/useInfiniteProducts";
import useHandleFieldChange from "../../../../../hooks/useHandleFieldChange";

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  const theme = useTheme();
  // R19: Removed useMemo for styles (unless expensive, let the compiler handle it)
  const selectStyles = getSelectStyles(theme);

  // --- FORM STATE ---
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- DATA FETCHING ---
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
  } = useFetchData("brands", "/api/brands", (data) =>
    Array.isArray(data.brands) ? data.brands : []
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

  const { data: shops, isLoading: isLoadingShops } = useFetchData(
    "shops",
    "/api/shops",
    async (shopsData) => {
      const shopsArray = Array.isArray(shopsData)
        ? shopsData
        : shopsData?.shops || [];
      // Note: Ideally move this "waterfall" fetching to the backend API
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

  // --- DEBOUNCE (Keep useMemo: Structural Stability Required) ---
  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    []
  );

  useEffect(() => {
    return () => debouncedSetProductSearch.cancel();
  }, [debouncedSetProductSearch]);

  // --- DERIVED DATA ---
  
  // R19: Removed useMemo for simple array checks. 
  // Kept useMemo for heavy array mapping/filtering below.
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeShops = Array.isArray(shops) ? shops : [];

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
  }, [
    selectedProduct,
    productBrands,
    safeBrands,
    isLoadingBrands,
    isLoadingProductBrands,
  ]);

  const isLoadingCombined = isLoadingProducts || isLoadingBrands || isLoadingShops || loading;

  // --- HANDLERS (Simplified: No useCallback needed for R19) ---

  const handleProductSelect = (selectedOption) => {
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
  };

  const handleProductInputChange = (inputValue) => {
    if (inputValue.trim() === "" && productSearch === "") return;
    debouncedSetProductSearch(inputValue);
  };

  const handleBrandSelect = (opt) =>
    handleFieldChange("brandName", opt?.name || "");

  const handleShopSelect = (shop) =>
    handleFieldChange("shopName", shop?.value || "", {
      locationName: shop?.locationName || "",
    });

  const handleDateChange = (date) => {
    const key = expense.purchased ? "purchaseDate" : "registeredDate";
    handleFieldChange(key, date);
  };

  const handleVolumeChange = (opt) =>
    handleFieldChange("volume", opt ? parseFloat(opt.value) : 0);

  const handleDiscountChange = (e) => {
    const checked = e.target.checked;
    const extraFields = checked ? {} : { discountValue: 0, discountAmount: 0 };
    handleFieldChange("hasDiscount", checked, extraFields);
  };

  const handlePurchaseChange = (e) => {
    const isPurchased = e.target.checked;
    handleFieldChange("purchased", isPurchased, {
      registeredDate: isPurchased ? null : expense.registeredDate,
      purchaseDate: isPurchased ? expense.purchaseDate : null,
    });
  };

  const handleRegisterChange = (e) => {
    const isRegistered = e.target.checked;
    handleFieldChange("purchased", !isRegistered, {
      registeredDate: isRegistered ? expense.registeredDate : null,
      purchaseDate: isRegistered ? null : expense.purchaseDate,
    });
  };

  const handleSubmit = async (e) => {
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
  };

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle="Legg til ny utgift"
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* PRODUCT & BRAND */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box flex={1}>
                <VirtualizedSelect
                  isClearable
                  options={productOptions}
                  value={
                    expense.productName
                      ? { label: expense.productName, value: expense.productName }
                      : null
                  }
                  onChange={handleProductSelect}
                  onInputChange={handleProductInputChange}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  isLoading={isLoadingProducts}
                  placeholder="Velg produkt"
                  loadingMessage={() => "Søker etter produkter..."}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </Box>

              <Box flex={1}>
                <VirtualizedSelect
                  isClearable
                  options={brandOptions}
                  value={
                    expense.brandName
                      ? { label: expense.brandName, value: expense.brandName }
                      : null
                  }
                  onChange={handleBrandSelect}
                  placeholder={
                    selectedProduct ? "Velg merke" : "Velg et produkt først"
                  }
                  isLoading={isLoadingBrands || isLoadingProductBrands}
                  loadingMessage={() => "Laster inn merker..."}
                  menuPortalTarget={document.body}
                  isDisabled={!selectedProduct}
                  styles={selectStyles}
                />
              </Box>
            </Stack>

            {/* SHOP & LOCATION */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box flex={1}>
                <VirtualizedSelect
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
              </Box>

              <Box flex={1}>
                <ExpenseField
                  label="Sted"
                  value={expense.locationName}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Stack>

            {/* PRICE & VOLUME */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="flex-start"
            >
              <Box sx={{ flex: 1, width: "100%" }}>
                <ExpenseField
                  label="Pris"
                  type="number"
                  value={expense.price}
                  onChange={(e) =>
                    setExpense((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Kr</InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Box>

              <Box sx={{ flex: 1, width: "100%", minWidth: "200px" }}>
                {expense.measurementUnit &&
                selectedProduct &&
                selectedProduct.measures?.length > 0 ? (
                  <VirtualizedSelect
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
                      handleFieldChange(
                        "volume",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {expense.measurementUnit}
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                )}
              </Box>
            </Stack>

            {/* PRICE PER UNIT */}
            <Box>
              <ExpenseField
                label={`Pris per ${expense.measurementUnit || ""}`}
                value={expense.pricePerUnit || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* QUANTITY & DISCOUNT TOGGLE */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
            >
              <Box flex={1} width="100%">
                <ExpenseField
                  label="Antall"
                  type="number"
                  value={expense.quantity}
                  onChange={(e) =>
                    handleFieldChange("quantity", e.target.value)
                  }
                />
              </Box>

              <Box flex={1} width="100%">
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
              </Box>
            </Stack>

            {/* DISCOUNT FIELDS */}
            {expense.hasDiscount && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Box flex={1}>
                  <ExpenseField
                    label="Rabatt (%)"
                    type="number"
                    value={expense.discountValue}
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
                    value={expense.discountAmount}
                    onChange={handleDiscountAmountChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Kr</InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Stack>
            )}

            {/* FINAL PRICE */}
            <Box>
              <ExpenseField
                label="Sluttpris"
                value={expense.finalPrice || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* STATUS & DATE */}
            <Box>
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
            </Box>

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

        {/* ACTIONS */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 3 }}
        >
          <Button onClick={handleClose}>Avbryt</Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid || isLoadingCombined}
            autoFocus={false}
          >
            {isLoadingCombined ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
        </Stack>
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