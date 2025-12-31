// src/components/.../ProductDialog.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import ProductForm from "./commons/ProductForm";
import useProductDialog from "../UseProduct/useProductDialog";
import useInfiniteBrands from "../../../../hooks/useInfiniteBrands";
import { getSelectStyles } from "../../../../theme/selectStyles";

const ProductDialog = ({
  open,
  mode,
  productToEdit,
  onClose,
  onSuccess,
  onError,
}) => {
  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  const theme = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  const {
    product,
    setProduct,
    loading,
    handleSaveProduct,
    handleDeleteProduct,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
  } = useProductDialog(productToEdit);

  // Brand select UI state
  const [brandSearch, setBrandSearch] = useState("");

  // Infinite brands
  const {
    data,
    isLoading: isLoadingBrands,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteBrands(brandSearch);

  const brandOptions = useMemo(() => {
    const pages = data?.pages ?? [];
    return pages.flatMap((p) => p.brands ?? []);
  }, [data]);

  // When opening, reset
  useEffect(() => {
    if (!open) return;
    resetFormAndErrors();
    setBrandSearch("");
  }, [open, productToEdit?._id, resetFormAndErrors]);

  const handleBrandChange = useCallback(
    (selectedOptions) => {
      const arr = selectedOptions ?? [];

      setProduct((prev) => ({
        ...prev,
        brandNames: arr.map((b) => b.value),
      }));

      setBrandSearch("");
      resetValidationErrors();
      resetServerError();
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  const handleBrandCreate = useCallback(
    (inputValue) => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      setProduct((prev) => ({
        ...prev,
        brandNames: [...(prev.brandNames ?? []), trimmed],
      }));

      setBrandSearch("");
      resetValidationErrors();
      resetServerError();
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  const handleInputChange = useCallback((inputValue, meta) => {
    if (meta?.action === "input-change") setBrandSearch(inputValue);
  }, []);

  const handleMenuScrollToBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClose = useCallback(() => {
    resetFormAndErrors();
    onClose();
  }, [resetFormAndErrors, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isDelete) {
        const ok = await handleDeleteProduct(productToEdit);
        if (ok) {
          onSuccess?.(productToEdit);
          handleClose();
        } else {
          onError?.();
        }
        return;
      }

      if (!isFormValid()) return;

      const saved = await handleSaveProduct();
      if (saved) {
        onSuccess?.(saved);
        handleClose();
      } else {
        onError?.();
      }
    } catch {
      onError?.();
    }
  };

  const dialogTitle = isDelete
    ? "Bekreft sletting"
    : isEdit
    ? "Rediger produkt"
    : "Nytt produkt";

  const confirmLabel = isDelete ? "Slett" : "Lagre";
  const confirmColor = isDelete ? "error" : "primary";

  const showBusy = loading || isLoadingBrands;

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {!isDelete && (
            <ProductForm
              product={product}
              brandOptions={brandOptions}
              selectStyles={selectStyles}
              loading={loading || isLoadingBrands || isFetchingNextPage}
              validationError={validationError}
              displayError={displayError}
              inputValue={brandSearch}
              onInputChange={handleInputChange}
              onMenuScrollToBottom={handleMenuScrollToBottom}
              onBrandChange={handleBrandChange}
              onBrandCreate={handleBrandCreate}
              onNameChange={(name) => {
                setProduct((p) => ({ ...p, name }));
                resetValidationErrors();
                resetServerError();
              }}
              onProductTypeChange={(opt) => {
                setProduct((p) => ({ ...p, type: opt?.value ?? "" }));
                resetValidationErrors();
                resetServerError();
              }}
              onMeasurementUnitChange={(opt) => {
                setProduct((p) => ({
                  ...p,
                  measurementUnit: opt?.value ?? "",
                }));
                resetValidationErrors();
                resetServerError();
              }}
              onMeasuresChange={(opts) => {
                setProduct((p) => ({
                  ...p,
                  measures: (opts ?? []).map((o) => o.value),
                }));
                resetValidationErrors();
                resetServerError();
              }}
              onMeasureCreate={(val) => {
                const trimmed = val.trim();
                if (!trimmed) return;
                setProduct((p) => ({
                  ...p,
                  measures: [...(p.measures ?? []), trimmed],
                }));
                resetValidationErrors();
                resetServerError();
              }}
            />
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={loading}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={confirmColor}
              disabled={showBusy || (isDelete ? false : !isFormValid())}
            >
              {showBusy ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                confirmLabel
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

ProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  productToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default ProductDialog;
