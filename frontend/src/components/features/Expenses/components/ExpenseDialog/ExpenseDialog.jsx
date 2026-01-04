import React, { useEffect } from "react";
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

  // controller (handlers + selectedProduct/search)
  const controller = useExpenseDialogController({ open, mode, expense, setExpense });

  // data for selects
  const data = useExpenseDialogData({
    open,
    productSearch: controller.productSearch,
  });

  const { productOptions, brandOptions, shopOptions } = useExpenseDialogOptions({
    infiniteData: data.infiniteData,
    brands: data.brands,
    selectedProduct: controller.selectedProduct,
    shops: data.shops,
  });

  // EDIT: once productOptions available, set selectedProduct to the real option object
  useEffect(() => {
    if (!open || !isEdit) return;
    const name = expenseToEdit?.productName;
    if (!name) return;
    if (!productOptions.length) return;

    const match =
      productOptions.find((o) => o.name === name) ??
      { label: name, value: name, name };

    controller.setSelectedProduct(match);
  }, [
    open,
    isEdit,
    expenseToEdit?.productName,
    productOptions,
    controller.setSelectedProduct,
  ]);

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
