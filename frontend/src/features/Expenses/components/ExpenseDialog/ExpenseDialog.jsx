import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../styles/theme/selectStyles";

import BasicDialog from "../../../../components/commons/BasicDialog/BasicDialog";
import ExpenseFormFields from "./ExpenseFormFields";
import { formatComponentFields } from "../../../../components/commons/Utils/FormatUtil";
import {
  addBrandValidationSchema,
  addProductValidationSchema,
  addShopValidationSchema,
} from "../../../../validation/validationSchema";

import { useExpenseDialogForm } from "../../hooks/useExpenseDialogForm";
import { useExpenseDialogData } from "../../hooks/useExpenseDialogData";
import { useExpenseDialogOptions } from "../../hooks/useExpenseDialogOptions";
import { useExpenseDialogController } from "../../hooks/useExpenseDialogController";

const isHexObjectId = (value) =>
  /^[a-f\d]{24}$/i.test(String(value ?? "").trim());

const ExpenseDialog = ({ open, mode, expenseToEdit, onClose, onSuccess, onError }) => {
  const theme = useTheme();
  const selectStyles = getSelectStyles(theme);
  const queryClient = useQueryClient();

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

  const locationOptions = useMemo(
    () =>
      (data.locations ?? []).map((location) => ({
        value: String(location._id),
        label: location.name,
      })),
    [data.locations]
  );

  const categoryOptions = useMemo(
    () =>
      (data.categories ?? []).map((category) => ({
        value: String(category._id),
        label: category.name,
      })),
    [data.categories]
  );

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
        value: expenseToEdit?.productId || name,
        id: expenseToEdit?.productId || "",
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
    expenseToEdit?.productId,
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

  useEffect(() => {
    if (!open || isDelete) return;

    setExpense((prev) => {
      const updates = {};

      if (prev.brandName && !prev.brandId && Array.isArray(brandOptions)) {
        const brandMatch = brandOptions.find(
          (option) =>
            option.name === prev.brandName ||
            option.label === prev.brandName
        );

        if (brandMatch?.value) {
          updates.brandId = String(brandMatch.value);
        }
      }

      if (prev.shopName && !prev.shopId && Array.isArray(shopOptions)) {
        const shopMatch = shopOptions.find(
          (option) => option.name === prev.shopName || option.label === prev.shopName
        );

        if (shopMatch?.value) {
          updates.shopId = String(shopMatch.value);
          updates.locationId = shopMatch.locationId || prev.locationId || "";
          updates.locationName = shopMatch.locationName || prev.locationName || "";
        }
      }

      return Object.keys(updates).length ? { ...prev, ...updates } : prev;
    });
  }, [open, isDelete, brandOptions, shopOptions, setExpense]);

  useEffect(() => {
    if (!open || isDelete) return;
    clearFieldError?.("volume");
  }, [open, isDelete, expense.productId, expense.volume, clearFieldError]);

  const loading = formLoading;

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

  const getSelectedProductId = () =>
    [
      controller.selectedProduct?.id,
      controller.selectedProduct?._id,
      expense.productId,
      controller.selectedProduct?.value,
    ]
      .map((value) => String(value ?? "").trim())
      .find(isHexObjectId) || "";

  const hasSelectedProductId = Boolean(getSelectedProductId());

  const handleCreateBrand = async (name) => {
    const productId = getSelectedProductId();
    if (!productId) throw new Error("Velg et produkt først.");

    const formattedBrand = {
      name: formatComponentFields(name, "brand", "name"),
    };

    await addBrandValidationSchema.validate(formattedBrand, {
      abortEarly: false,
    });

    const { data: createdBrand, error } = await data.sendRequest(
      "/api/brands",
      "POST",
      { ...formattedBrand, productId }
    );

    if (error) throw error;

    const brand = createdBrand?.brand ?? createdBrand;
    const brandId = String(brand?._id ?? brand?.id ?? "");
    const brandName = String(brand?.name ?? formattedBrand.name).trim();

    controller.setSelectedProduct((prev) => {
      if (!prev || !brandId) return prev;
      const brandIds = Array.isArray(prev.brands) ? prev.brands.map(String) : [];
      return brandIds.includes(brandId)
        ? prev
        : { ...prev, brands: [...brandIds, brandId] };
    });

    queryClient.invalidateQueries({ queryKey: ["brands"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    clearFieldError?.("brandName");
    controller.handleBrandSelect({ label: brandName, value: brandId, name: brandName });

    return brand;
  };

  const handleCreateVariant = async (name) => {
    const productId = getSelectedProductId();
    if (!productId) throw new Error("Velg et produkt fra listen først.");

    const formattedVariantName = formatComponentFields(
      name,
      "product",
      "variants"
    );

    await addProductValidationSchema.validateAt("variants", {
      variants: [formattedVariantName],
    });

    const { data: payload, error } = await data.sendRequest(
      "/api/variants",
      "POST",
      { name: formattedVariantName, productId }
    );

    if (error) throw error;

    const variant = payload?.variant ?? payload;
    const variantId = String(variant?._id ?? variant?.id ?? "");
    const variantName = String(variant?.name ?? formattedVariantName).trim();

    controller.setSelectedProduct((prev) => {
      if (!prev || !variantId) return prev;
      const variants = Array.isArray(prev.variants) ? prev.variants : [];
      const exists = variants.some((v) => String(v?._id ?? v) === variantId);
      return exists
        ? prev
        : {
            ...prev,
            variants: [...variants, { _id: variantId, name: variantName }],
          };
    });

    queryClient.invalidateQueries({ queryKey: ["products"] });
    controller.handleVariantSelect({
      label: variantName,
      value: variantId,
      name: variantName,
    });

    return variant;
  };

  const handleCreateShop = async ({ name, locationName, categoryName }) => {
    const formatted = {
      name: formatComponentFields(name, "shop", "name"),
      locationName: formatComponentFields(
        locationName,
        "shop",
        "locationName"
      ),
      categoryName: formatComponentFields(
        categoryName,
        "shop",
        "categoryName"
      ),
    };

    await addShopValidationSchema.validate(formatted, { abortEarly: false });

    const { data: shop, error } = await data.sendRequest("/api/shops", "POST", {
      name: formatted.name,
      locationName: formatted.locationName,
      categoryName: formatted.categoryName,
    });

    if (error) throw error;

    const shopId = String(shop?._id ?? shop?.id ?? "");
    const shopName = String(shop?.name ?? formatted.name).trim();
    const locationId = String(shop?.location ?? "").trim();
    const resolvedLocationName = String(
      shop?.locationName ?? formatted.locationName ?? ""
    ).trim();

    queryClient.invalidateQueries({ queryKey: ["shops"] });
    controller.handleShopSelect({
      label: `${shopName}, ${resolvedLocationName}`,
      value: shopId,
      id: shopId,
      name: shopName,
      locationId,
      locationName: resolvedLocationName,
    });

    return shop;
  };

  // ✅ Validate brand only on Save
  const isBrandValidForSelectedProduct = () => {
    if (!controller.selectedProduct) return true;

    const brand = String(expense.brandName || "").trim();
    if (!brand) return false;

    const selectedBrandId = String(expense.brandId || "").trim();
    const selectedProductBrandIds = Array.isArray(controller.selectedProduct?.brands)
      ? controller.selectedProduct.brands
          .map((item) => String(item?._id ?? item?.id ?? item).trim())
          .filter(Boolean)
      : [];

    if (selectedBrandId && selectedProductBrandIds.includes(selectedBrandId)) {
      return true;
    }

    const list = Array.isArray(data.brandsForProduct) ? data.brandsForProduct : [];
    if (!list.length) return false; // no known brands for product -> treat as invalid (or relax if you prefer)

    return list.some((b) => {
      const idMatches = selectedBrandId && String(b?._id || "") === selectedBrandId;
      const nameMatches =
        String(b?.name || "").toLowerCase() === brand.toLowerCase();
      return idMatches || nameMatches;
    });
  };

  const isVolumeValid = () => {
    const volume = Number(expense.volume);
    return Number.isFinite(volume) && volume > 0;
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

      if (!isVolumeValid()) {
        setFieldError?.(
          "volume",
          "Volum må være større enn 0."
        );
        return;
      } else {
        clearFieldError?.("volume");
      }

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
      quickCreate={{
        createBrand: handleCreateBrand,
        createVariant: handleCreateVariant,
        createShop: handleCreateShop,
        hasSelectedProductId,
        locationOptions,
        categoryOptions,
        isLoadingLocations: data.isLoadingLocations,
        isLoadingCategories: data.isLoadingCategories,
        isLocationError: data.isLocationError,
        isCategoryError: data.isCategoryError,
      }}
    />
  );

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle={dialogTitle}
      maxWidth={isDelete ? "sm" : "lg"}
    >
      <form onSubmit={handleSubmit}>
        {body}

        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1.5}
          justifyContent="flex-end"
          sx={{
            mt: 3,
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
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
