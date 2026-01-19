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

  // Safety: if DELETE/EDIT without a selected expense, do nothing
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
  } = form;

  const controller = useExpenseDialogController({ open, mode, expense, setExpense });

  const data = useExpenseDialogData({
    open,
    productSearch: controller.productSearch,
    selectedProduct: controller.selectedProduct,
    shopSearch: controller.shopSearch,
  });

  const { productOptions, brandOptions, shopOptions, variantOptions } = useExpenseDialogOptions({
    infiniteData: data.infiniteData,
    brandsForProduct: data.brandsForProduct,
    recentBrands: data.recentBrands,
    selectedProduct: controller.selectedProduct,
    shops: data.shops,
  });

  /**
   * ✅ FIX: Only initialize selectedProduct ONCE per open/edit expense.
   * Otherwise it will overwrite the user's selection whenever productOptions changes.
   */
  const didInitSelectedProductRef = useRef(false);
  const lastEditIdRef = useRef(null);

  // Reset init flag when dialog closes OR when editing a different expense id
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

  // EDIT: once productOptions available, set selectedProduct to the real option object (one-time init)
  useEffect(() => {
    if (!open || !isEdit) return;
    if (didInitSelectedProductRef.current) return;

    const name = expenseToEdit?.productName;
    if (!name) return;

    // Wait for options (if we don't have any yet, keep waiting)
    if (!productOptions.length) return;

    const match =
      productOptions.find((o) => o.name === name || o.value === name) ??
      {
        label: name,
        value: name,
        name,

        // unknown until real option arrives
        variants: null,
        measures: null,
        brands: null,

        measurementUnit: expenseToEdit?.measurementUnit ?? "",
      };

    controller.setSelectedProduct(match);

    // ✅ mark as initialized so we don't overwrite user changes later
    didInitSelectedProductRef.current = true;
  }, [
    open,
    isEdit,
    expenseToEdit?.productName,
    expenseToEdit?.measurementUnit,
    productOptions,
    controller.setSelectedProduct,
  ]);

  /**
   * ✅ A) Keep expense.variant valid for the selected product.
   *
   * Rules:
   * - If variants are unknown (null/undefined), do nothing (don't clear user/edit selection).
   * - If product has 0 variants (empty array), clear any selected variant.
   * - If product has variants, clear variant ONLY if it's not in the allowed list.
   */
  useEffect(() => {
    if (!open) return;

    const variants = controller.selectedProduct?.variants;

    // unknown / not loaded yet -> don't touch variant
    if (!Array.isArray(variants)) return;

    // product truly has no variants -> clear any selected one
    if (variants.length === 0) {
      setExpense((prev) => (prev.variant ? { ...prev, variant: "" } : prev));
      return;
    }

    // product has variants -> ensure current value is valid
    const allowed = new Set(variants.map((v) => String(v)));

    setExpense((prev) => {
      const current = prev?.variant ? String(prev.variant) : "";
      if (!current) return prev;
      if (!allowed.has(current)) return { ...prev, variant: "" };
      return prev;
    });
  }, [open, controller.selectedProduct, setExpense]);

  const loading =
    formLoading || data.isLoadingProducts || data.isLoadingBrands || data.isLoadingShops;

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
