// src/components/.../ProductDialog.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import BasicDialog from "../../../components/commons/BasicDialog/BasicDialog";
import ProductForm from "./commons/ProductForm";
import useProductDialog from "../UseProduct/useProductDialog";
import useInfiniteBrands from "../../../hooks/useInfiniteBrands";
import useCustomHttp from "../../../hooks/useHttp";
import { getSelectStyles } from "../../../styles/theme/selectStyles";

const QUERY_KEY = ["products", "paginated"];

const getVariantActionMessage = (error) => {
  const message = String(error?.message ?? "").trim();
  if (message === "duplicate") {
    return "Denne varianten finnes allerede på dette produktet.";
  }
  if (message === "variant_in_use") {
    return "Varianten brukes i utgifter. Endre navnet i stedet for å slette den.";
  }
  return message || "Kunne ikke oppdatere varianten.";
};

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
  const queryClient = useQueryClient();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);
  const { sendRequest: sendVariantRequest, loading: isSavingVariant } =
    useCustomHttp("/api/variants", { auto: false });

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

  // ✅ Variants options (from /api/variants)
  const [variantOptions, setVariantOptions] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantActionError, setVariantActionError] = useState("");
  const [busyVariantId, setBusyVariantId] = useState("");

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

  // When opening, reset + load variants
  useEffect(() => {
    if (!open) return;

    resetFormAndErrors();
    setBrandSearch("");
    setVariantActionError("");
    setBusyVariantId("");

    // ✅ EDIT: use the product's populated variants as options (names!)
    if (mode === "EDIT") {
      const opts = Array.isArray(productToEdit?.variants)
        ? productToEdit.variants
            .map((v) => {
              // populated doc: {_id,name}
              if (v && typeof v === "object") {
                return {
                  label: String(v.name ?? ""),
                  value: String(v._id ?? ""),
                };
              }
              // if it's an id string, we can't show name without fetching - ignore
              return null;
            })
            .filter(Boolean)
        : [];

      setVariantOptions(opts);
      setIsLoadingVariants(false);
      return;
    }

    // ✅ ADD: you can start with empty options (creatable will still work)
    setVariantOptions([]);
    setIsLoadingVariants(false);
  }, [open, mode, productToEdit?._id, resetFormAndErrors]);

   const clearProductErrorsIfAny = useCallback(() => {
    if (validationError) resetValidationErrors();
    if (displayError) resetServerError();
  }, [validationError, displayError, resetValidationErrors, resetServerError]);

  const handleBrandChange = useCallback(
  (selectedOptions) => {
    setProduct((prev) => ({
      ...prev,
      brandSelections: selectedOptions ?? [],
    }));

    setBrandSearch("");
    clearProductErrorsIfAny();
  },
  [setProduct, clearProductErrorsIfAny],
);

  const handleBrandCreate = useCallback(
  (inputValue) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newOption = {
      label: trimmed,
      value: trimmed,
    };

    setProduct((prev) => ({
      ...prev,
      brandSelections: [...(prev.brandSelections ?? []), newOption],
    }));

    setBrandSearch("");
    clearProductErrorsIfAny();
  },
  [setProduct, clearProductErrorsIfAny],
);

  // ✅ Variants: store ids in product.variants
  const handleVariantsChange = useCallback(
    (selectedOptions) => {
      const arr = selectedOptions ?? [];

      const seen = new Set();
      const uniq = [];
      for (const o of arr) {
        const v = String(o?.value ?? "").trim();
        if (!v) continue;
        const key = v.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(v);
      }

      setProduct((prev) => ({ ...prev, variants: uniq }));
      clearProductErrorsIfAny();
    },
    [setProduct, clearProductErrorsIfAny],
  );

  const handleVariantCreate = useCallback(
    (inputValue) => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      // prevent duplicates (case-insensitive)
      const alreadySelected = (product?.variants ?? []).some(
        (v) => String(v).trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (alreadySelected) return;

      clearProductErrorsIfAny();

      setVariantOptions((prev) => {
        const exists = prev.some(
          (o) => String(o.value).trim().toLowerCase() === trimmed.toLowerCase(),
        );
        return exists ? prev : [...prev, { label: trimmed, value: trimmed }]; // <-- placeholder name
      });

      setProduct((prev) => ({
        ...prev,
        variants: [...(prev.variants ?? []), trimmed], // <-- store name until submit
      }));
    },
    [product?.variants, clearProductErrorsIfAny, setProduct],
  );

  const refreshProductLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [queryClient]);

  const handleVariantRename = useCallback(
    async (variantId, name) => {
      const id = String(variantId ?? "").trim();
      const nextName = String(name ?? "").trim();
      if (!id || !nextName) return false;

      setVariantActionError("");
      setBusyVariantId(id);

      const { data, error } = await sendVariantRequest(
        `/api/variants/${id}`,
        "PUT",
        { name: nextName },
      );

      setBusyVariantId("");

      if (error) {
        setVariantActionError(getVariantActionMessage(error));
        return false;
      }

      const updated = data?.variant;
      const label = String(updated?.name ?? nextName);
      const value = String(updated?._id ?? id);

      setVariantOptions((prev) =>
        (prev ?? []).map((option) =>
          String(option.value) === id ? { ...option, label, value } : option,
        ),
      );

      refreshProductLists();
      return true;
    },
    [refreshProductLists, sendVariantRequest],
  );

  const handleVariantDelete = useCallback(
    async (variantId) => {
      const id = String(variantId ?? "").trim();
      if (!id) return false;

      setVariantActionError("");
      setBusyVariantId(id);

      const { error } = await sendVariantRequest(`/api/variants/${id}`, "DELETE");

      setBusyVariantId("");

      if (error) {
        setVariantActionError(getVariantActionMessage(error));
        return false;
      }

      setVariantOptions((prev) =>
        (prev ?? []).filter((option) => String(option.value) !== id),
      );
      setProduct((prev) => ({
        ...prev,
        variants: (prev.variants ?? []).filter((value) => String(value) !== id),
      }));

      refreshProductLists();
      return true;
    },
    [refreshProductLists, sendVariantRequest, setProduct],
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

  const showBusy =
    loading || isLoadingBrands || isLoadingVariants || isSavingVariant;

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle={dialogTitle}
      maxWidth={isDelete ? "sm" : "md"}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {isDelete && (
            <Typography>
              Er du sikker på at du vil slette{" "}
              <strong>
                {productToEdit?.name?.trim()
                  ? `"${productToEdit.name}"`
                  : "dette produktet"}
              </strong>
              ?
            </Typography>
          )}

          {!isDelete && (
            <ProductForm
              product={product}
              showVariantManager={isEdit}
              variantActionError={variantActionError}
              busyVariantId={busyVariantId}
              brandOptions={brandOptions}
              variantOptions={variantOptions} // ✅ NEW
              selectStyles={selectStyles}
              loading={
                loading ||
                isLoadingBrands ||
                isFetchingNextPage ||
                isLoadingVariants ||
                isSavingVariant
              }
              validationError={validationError}
              displayError={displayError}
              inputValue={brandSearch}
              onInputChange={handleInputChange}
              onMenuScrollToBottom={handleMenuScrollToBottom}
              onBrandChange={handleBrandChange}
              onBrandCreate={handleBrandCreate}
              onNameChange={(name) => {
                setProduct((p) => ({ ...p, name }));
                clearProductErrorsIfAny();
              }}
              onVariantsChange={handleVariantsChange}
              onVariantRename={handleVariantRename}
              onVariantDelete={handleVariantDelete}
              onVariantCreate={handleVariantCreate} // ✅ creates variant doc
              onProductCategoryChange={(opt) => {
                setProduct((p) => ({ ...p, category: opt?.value ?? "" }));
                clearProductErrorsIfAny();
              }}
              onMeasurementUnitChange={(opt) => {
                setProduct((p) => ({
                  ...p,
                  measurementUnit: opt?.value ?? "",
                }));
                clearProductErrorsIfAny();
              }}
              onMeasuresChange={(opts) => {
                setProduct((p) => ({
                  ...p,
                  measures: (opts ?? []).map((o) => o.value),
                }));
                clearProductErrorsIfAny();
              }}
              onMeasureCreate={(val) => {
                const trimmed = val.trim();
                if (!trimmed) return;
                setProduct((p) => ({
                  ...p,
                  measures: [...(p.measures ?? []), trimmed],
                }));
                clearProductErrorsIfAny();
              }}
            />
          )}

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.5}
            sx={{
              "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            <Button onClick={handleClose} disabled={showBusy}>
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
