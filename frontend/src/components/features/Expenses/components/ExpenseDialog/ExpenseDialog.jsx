import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ExpenseFormFields from "./ExpenseFormFields";

import { useExpenseDialogForm } from "../../hooks/useExpenseDialogForm";
import { useExpenseDialogData } from "../../hooks/useExpenseDialogData";
import { useExpenseDialogOptions } from "../../hooks/useExpenseDialogOptions";
import { useExpenseDialogController } from "../../hooks/useExpenseDialogController";

const ExpenseDialog = ({ open, mode, expenseToEdit, onClose, onSuccess, onError }) => {
  const theme = useTheme();
  const selectStyles = getSelectStyles(theme);

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  if ((isEdit || isDelete) && !expenseToEdit?._id) return null;

  const form = useExpenseDialogForm({ open, mode, expenseToEdit });

  const {
    expense,
    setExpense,
    loading: formLoading,
    handleSaveExpense,
    handleDeleteExpense,
    resetForm,
    isFormValid,
    validationErrors,
    setFieldError,
    clearFieldError,
  } = form;

  const controller = useExpenseDialogController({
    open,
    mode,
    expense,
    setExpense,
  });

  const data = useExpenseDialogData({
    open,
    productSearch: controller.productSearch,
    selectedProduct: controller.selectedProduct,
    shopSearch: controller.shopSearch,
  });

  const { productOptions, brandOptions, shopOptions, variantOptions } =
    useExpenseDialogOptions({
      infiniteData: data.infiniteData,
      brandsForProduct: data.brandsForProduct,
      recentBrands: data.recentBrands,
      selectedProduct: controller.selectedProduct,
      shops: data.shops,

      // ✅ NEW: used to decide fallback behavior
      isLoadingBrandsForProduct: data.isLoadingBrandsForProduct,
    });

  // ----------------------------
  // Selected product init control
  // ----------------------------
  const didInitSelectedProductRef = useRef(false);
  const lastEditIdRef = useRef(null);

  useEffect(() => {
    if (!open) {
      didInitSelectedProductRef.current = false;
      lastEditIdRef.current = null;
      return;
    }
    if (isEdit && expenseToEdit?._id && lastEditIdRef.current !== expenseToEdit._id) {
      didInitSelectedProductRef.current = false;
      lastEditIdRef.current = expenseToEdit._id;
    }
  }, [open, isEdit, expenseToEdit?._id]);

  // ✅ EDIT: initialize selectedProduct even if productOptions doesn't contain it yet
  useEffect(() => {
    if (!open || !isEdit) return;
    if (didInitSelectedProductRef.current) return;

    const name = expenseToEdit?.productName;
    if (!name) return;

    const match =
      productOptions.find((o) => o.name === name || o.value === name) ??
      {
        label: name,
        value: name,
        name,

        // ✅ Use variants/measures from expense row (so Variant select works even without productOptions)
        variants: Array.isArray(expenseToEdit?.variants) ? expenseToEdit.variants : [],
        measures: Array.isArray(expenseToEdit?.measures) ? expenseToEdit.measures : [],

        // ✅ Critical for brands query: provide brand ids if you have them
        // Best: expenseToEdit.brandIds (array) or expenseToEdit.brandId (single)
        brands: Array.isArray(expenseToEdit?.productBrandIds)
  ? expenseToEdit.productBrandIds
  : [],

        category: "",
        measurementUnit: expenseToEdit?.measurementUnit ?? "",
      };

    controller.setSelectedProduct(match);
    didInitSelectedProductRef.current = true;
  }, [
    open,
    isEdit,
    expenseToEdit?.productName,
    expenseToEdit?.measurementUnit,
    expenseToEdit?.variants,
    expenseToEdit?.measures,
    expenseToEdit?.brandId,
    expenseToEdit?.brandIds,
    productOptions,
    controller.setSelectedProduct,
  ]);

  /**
   * Keep expense.variant valid for selected product.
   * (brand should NOT be auto-cleared; we validate on save instead)
   */
  useEffect(() => {
    if (!open) return;

    const variants = controller.selectedProduct?.variants;

    if (!Array.isArray(variants)) return;

    if (variants.length === 0) {
      setExpense((prev) => (prev.variant ? { ...prev, variant: "", variantName: "" } : prev));
      return;
    }

    const allowed = new Set(variants.map((v) => String(v?._id ?? v)).filter(Boolean));

    setExpense((prev) => {
      const current = prev?.variant ? String(prev.variant) : "";
      if (!current) return prev;
      if (!allowed.has(current)) return { ...prev, variant: "", variantName: "" };
      return prev;
    });
  }, [open, controller.selectedProduct, setExpense]);

  const loading =
    formLoading ||
    data.isLoadingProducts ||
    data.isLoadingBrands ||
    data.isLoadingShops;

  const dialogTitle = isDelete
    ? "Bekreft sletting"
    : isEdit
      ? "Rediger utgift"
      : "Legg til ny utgift";

  const confirmLabel = isDelete ? "Slett" : "Lagre";
  const confirmColor = isDelete ? "error" : "primary";

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ✅ Validate brand only on Save
  const isBrandValidForSelectedProduct = () => {
    if (!controller.selectedProduct) return true;

    const brand = String(expense.brandName || "").trim();
    if (!brand) return false;

    const list = Array.isArray(data.brandsForProduct) ? data.brandsForProduct : [];
    if (!list.length) return false; // no known brands for product -> treat as invalid (or relax if you prefer)

    return list.some((b) => String(b?.name || "").toLowerCase() === brand.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isDelete) {
        const ok = await handleDeleteExpense(expenseToEdit._id);
        if (ok) {
          onSuccess?.(expenseToEdit);
          handleClose();
        } else {
          onError?.(expenseToEdit);
        }
        return;
      }

      if (!isFormValid) return;

      // If product selected and brands are still loading, block save with field message
      if (controller.selectedProduct && data.isLoadingBrandsForProduct) {
        setFieldError?.("brandName", "Laster merker… prøv igjen om et øyeblikk.");
        return;
      }

      if (!isBrandValidForSelectedProduct()) {
        setFieldError?.(
          "brandName",
          "Merket matcher ikke produktet. Velg et gyldig merke før du lagrer."
        );
        return;
      } else {
        clearFieldError?.("brandName");
      }

      const saved = await handleSaveExpense();
      if (saved) {
        onSuccess?.(saved);
        handleClose();
      }
    } catch (err) {
      onError?.(err);
    }
  };

  const body = isDelete ? (
    <Typography component="p" sx={{ mt: 2 }}>
      Er du sikker på at du vil slette denne utgiften? Utgifter knyttet til{" "}
      <Typography component="span" fontWeight="bold">
        "{expenseToEdit?.productName?.name || expenseToEdit?.productName}"
      </Typography>{" "}
      vil også bli påvirket.
    </Typography>
  ) : (
    <ExpenseFormFields
      expense={expense}
      setExpense={setExpense}
      selectStyles={selectStyles}
      variantOptions={variantOptions}
      productOptions={productOptions}
      brandOptions={brandOptions}
      shopOptions={shopOptions}
      selectedProduct={controller.selectedProduct}
      hasNextPage={data.hasNextPage}
      fetchNextPage={data.fetchNextPage}
      isLoadingProducts={data.isLoadingProducts}
      isLoadingBrands={data.isLoadingBrands}
      isLoadingShops={data.isLoadingShops}
      controller={controller}
      validationErrors={validationErrors}
      clearFieldError={clearFieldError}
    />
  );

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        {body}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Avbryt
          </Button>

          <Button
            type="submit"
            variant="contained"
            color={confirmColor}
            disabled={loading || (!isDelete && !isFormValid)}
          >
            {loading ? <CircularProgress size={24} /> : confirmLabel}
          </Button>
        </Stack>
      </form>
    </BasicDialog>
  );
};

ExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  expenseToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default ExpenseDialog;