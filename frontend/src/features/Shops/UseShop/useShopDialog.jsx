// src/components/.../UseShop/useShopDialog.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../../components/commons/Utils/FormatUtil";
import { useStoreDispatch, useStoreState } from "../../../store/Store";
import { addShopValidationSchema } from "../../../validation/validationSchema";

const INITIAL_SHOP_STATE = {
  name: "",
  locations: [],
  locationNames: [],
  categoryName: "", // ✅ always a name (display + payload)
};

const SHOPS_QUERY_KEY = ["shops", "paginated"];

const buildShopStateFromInitial = (initialShop) => {
  if (!initialShop?._id) return { ...INITIAL_SHOP_STATE };

  return {
    ...INITIAL_SHOP_STATE,
    ...initialShop,
    name: initialShop.name ?? "",
    locations: Array.isArray(initialShop.locations)
      ? initialShop.locations.map(String)
      : Array.isArray(initialShop.locationIds)
        ? initialShop.locationIds.map(String)
        : initialShop.location
          ? [String(initialShop.location)]
          : [],
    locationNames: Array.isArray(initialShop.locationNames)
      ? initialShop.locationNames
      : initialShop.locationName && initialShop.locationName !== "N/A"
        ? String(initialShop.locationName).split(",").map((name) => name.trim()).filter(Boolean)
        : [],
    categoryName: initialShop.categoryName ?? "",
  };
};

const useShopDialog = (initialShop = null) => {
  const queryClient = useQueryClient();
  const dispatch = useStoreDispatch();
  const state = useStoreState();

  const { sendRequest, loading: httpLoading } = useCustomHttp("/api/shops", {
    auto: false,
  });

  const shopId = initialShop?._id;
  const isEditMode = Boolean(shopId);

  const [shop, setShop] = useState(() => buildShopStateFromInitial(initialShop));

  // ✅ IMPORTANT: only sync when id changes, not when object identity changes
  useEffect(() => {
    setShop(buildShopStateFromInitial(initialShop));
  }, [shopId]); // 👈 this fixes "can't type"

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "shops" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setShop(buildShopStateFromInitial(initialShop));
    resetServerError();
    resetValidationErrors();
  }, [initialShop, resetServerError, resetValidationErrors]);

  const saveShopMutation = useMutation({
    mutationFn: async (payload) => {
      const url = shopId ? `/api/shops/${shopId}` : "/api/shops";
      const method = shopId ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["shops"] });

      // if backend upserts new ones by name, refresh these too
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "shop"] });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error,
        resource: "shops",
        showError: true,
      });
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await sendRequest(`/api/shops/${id}`, "DELETE");
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["shops"] });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error,
        resource: "shops",
        showError: true,
      });
    },
  });

  const handleSaveShop = useCallback(async () => {
    if (!shop?.name?.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      const formatted = {
        name: formatComponentFields(shop.name, "shop", "name"),
        locationNames: (Array.isArray(shop.locationNames) ? shop.locationNames : [])
          .map((name) => formatComponentFields(name, "shop", "locationName"))
          .filter(Boolean),
        categoryName: formatComponentFields(shop.categoryName, "shop", "categoryName"),
      };

      await addShopValidationSchema.validate(formatted, { abortEarly: false });

      // ✅ payload is names only (backend resolves -> ids)
      const payload = {
        name: formatted.name,
        locationNames: formatted.locationNames,
        categoryName: formatted.categoryName,
      };

      const saved = await saveShopMutation.mutateAsync(payload);

      if (!isEditMode) setShop({ ...INITIAL_SHOP_STATE });

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
          resource: "shops",
          validationErrors: {
            ...state.validationErrors?.shops,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  }, [
    shop,
    isEditMode,
    resetServerError,
    resetValidationErrors,
    saveShopMutation,
    dispatch,
    state.validationErrors?.shops,
  ]);

  const handleDeleteShop = useCallback(
    async (shopToDelete) => {
      if (!shopToDelete?._id) return false;

      resetServerError();
      resetValidationErrors();

      try {
        await deleteShopMutation.mutateAsync(shopToDelete._id);
        return true;
      } catch {
        return false;
      }
    },
    [deleteShopMutation, resetServerError, resetValidationErrors]
  );

  const displayError = state.error?.shops;
  const validationError = state.validationErrors?.shops;

  const isFormValid = useCallback(() => {
    return (
      shop?.name?.trim().length > 0 &&
      Array.isArray(shop?.locationNames) &&
      shop.locationNames.length > 0 &&
      shop?.categoryName?.trim().length > 0 &&
      !validationError?.name &&
      !validationError?.locationNames &&
      !validationError?.categoryName
    );
  }, [shop, validationError]);

  const loading = httpLoading || saveShopMutation.isPending || deleteShopMutation.isPending;

  return useMemo(
    () => ({
      shop,
      setShop,
      isFormValid,
      loading,
      displayError,
      validationError,
      handleSaveShop,
      handleDeleteShop,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    }),
    [
      shop,
      isFormValid,
      loading,
      displayError,
      validationError,
      handleSaveShop,
      handleDeleteShop,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    ]
  );
};

export default useShopDialog;

