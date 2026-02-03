// src/components/.../UseProduct/useProductDialog.js
import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addProductValidationSchema } from "../../../../validation/validationSchema";

const INITIAL_PRODUCT_STATE = {
  name: "",
  brandNames: [],
  measures: [],
  measurementUnit: "",
  category: "",
  variants: [],
};

const PRODUCTS_QUERY_KEY = ["products", "paginated"];
const BRANDS_QUERY_KEY = ["brands", "paginated"];

const normalizeBrandNames = (p) => {
  if (
    Array.isArray(p?.brands) &&
    p.brands.length > 0 &&
    typeof p.brands[0] === "object"
  ) {
    return p.brands.map((b) => b?.name).filter(Boolean);
  }
  if (typeof p?.brand === "string") {
    return p.brand
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (
    Array.isArray(p?.brands) &&
    p.brands.length > 0 &&
    typeof p.brands[0] === "string"
  ) {
    return p.brands.map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const normalizeVariants = (p) => {
  if (!Array.isArray(p?.variants)) return [];

  // populated: [{_id,name}]
  if (p.variants.length > 0 && typeof p.variants[0] === "object") {
    return p.variants.map((v) => String(v?._id ?? "").trim()).filter(Boolean);
  }

  // already ids: ["..."]
  return p.variants.map((v) => String(v).trim()).filter(Boolean);
};

// ✅ used to de-dupe variants before formatting/sending
const uniqueCaseInsensitive = (arr) => {
  const seen = new Set();
  const out = [];
  for (const x of arr ?? []) {
    const v = String(x ?? "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
};

const buildFormStateFromInitial = (initialProduct) => {
  if (!initialProduct?._id) return { ...INITIAL_PRODUCT_STATE };

  return {
    ...INITIAL_PRODUCT_STATE,
    ...initialProduct,
    brandNames: normalizeBrandNames(initialProduct),
    measures: initialProduct.measures ?? [],
    measurementUnit: initialProduct.measurementUnit ?? "",
    category: initialProduct.category ?? "",
    variants: normalizeVariants(initialProduct),
  };
};

const useProductDialog = (initialProduct = null) => {
  const queryClient = useQueryClient();
  const { dispatch, state } = useContext(StoreContext);

  const { sendRequest, loading: httpLoading } = useCustomHttp("/api/products", {
    auto: false,
  });

  const productId = initialProduct?._id;
  const isEditMode = Boolean(productId);
  const initKey = productId || "ADD";

  const [product, _setProduct] = useState(() =>
    buildFormStateFromInitial(initialProduct),
  );

  const setProduct = useCallback((updater) => {
    setIsDirty(true);
    _setProduct(updater);
  }, []);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ Init once per dialog open / product target.
  // Allows late-arriving initialProduct data without wiping user edits.
  useEffect(() => {
    setHasInitialized(false);
    setIsDirty(false);
    _setProduct(buildFormStateFromInitial(initialProduct));
  }, [initKey]);

  useEffect(() => {
    if (!productId) return; // ADD: initializer already handled it

    if (!hasInitialized && !isDirty) {
      _setProduct(buildFormStateFromInitial(initialProduct));
      setHasInitialized(true);
    }
  }, [productId, initialProduct, hasInitialized, isDirty]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "products" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "products" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setHasInitialized(false);
    setIsDirty(false);
    _setProduct(buildFormStateFromInitial(initialProduct));
    resetServerError();
    resetValidationErrors();
  }, [initialProduct, resetServerError, resetValidationErrors]);

  

  const saveProductMutation = useMutation({
    mutationFn: async (payload) => {
      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw new Error(error.message || "Could not save product");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["brands"] });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "products",
        showError: true,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await sendRequest(`/api/products/${id}`, "DELETE");
      if (error) throw new Error(error.message || "Could not delete product");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "products",
        showError: true,
      });
    },
  });

  const handleSaveProduct = useCallback(async () => {
    if (!product?.name?.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      const formatted = {
        name: formatComponentFields(product.name, "product", "name"),

        brands: (product.brandNames ?? [])
          .map((b) => formatComponentFields(b, "product", "brands"))
          .filter(Boolean),

        measurementUnit: product.measurementUnit ?? "",

        category: formatComponentFields(
          product.category ?? "",
          "product",
          "category",
        ),

        // ✅ OPTION A:
        // - de-dupe first (case-insensitive)
        // - then format (formatComponentFields must NOT mutate ObjectIds for variants)
        variants: uniqueCaseInsensitive(product.variants ?? [])
          .map((v) => formatComponentFields(v, "product", "variants"))
          .filter(Boolean),

        measures: product.measures ?? [],
      };

      await addProductValidationSchema.validate(formatted, {
        abortEarly: false,
      });

      const saved = await saveProductMutation.mutateAsync(formatted);

      if (!isEditMode) setProduct({ ...INITIAL_PRODUCT_STATE });

      return saved;
    } catch (error) {
      if (error?.name === "ValidationError") {
        const errors = {};
        (error.inner ?? []).forEach((err) => {
          if (!err?.path) return;
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "products",
          validationErrors: {
            ...state.validationErrors?.products,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  }, [
    product,
    isEditMode,
    resetServerError,
    resetValidationErrors,
    saveProductMutation,
    dispatch,
    state.validationErrors?.products,
  ]);

  const handleDeleteProduct = useCallback(
    async (productToDelete) => {
      if (!productToDelete?._id) return false;

      resetServerError();
      resetValidationErrors();

      try {
        await deleteProductMutation.mutateAsync(productToDelete._id);
        return true;
      } catch {
        return false;
      }
    },
    [deleteProductMutation, resetServerError, resetValidationErrors],
  );

  const displayError = state.error?.products;
  const validationError = state.validationErrors?.products;

  const isFormValid = useCallback(() => {
    return (
      product?.name?.trim().length > 0 &&
      (product?.brandNames?.length ?? 0) > 0 &&
      product?.measurementUnit?.trim().length > 0 &&
      product?.category?.trim().length > 0 &&
      !validationError?.name &&
      !validationError?.brands &&
      !validationError?.measurementUnit &&
      !validationError?.category &&
      !validationError?.variants
    );
  }, [product, validationError]);

  const loading =
    httpLoading ||
    saveProductMutation.isPending ||
    deleteProductMutation.isPending;

  return useMemo(
    () => ({
      product,
      setProduct,
      isFormValid,
      loading,
      displayError,
      validationError,
      handleSaveProduct,
      handleDeleteProduct,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    }),
    [
      product,
      isFormValid,
      loading,
      displayError,
      validationError,
      handleSaveProduct,
      handleDeleteProduct,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    ],
  );
};

export default useProductDialog;
