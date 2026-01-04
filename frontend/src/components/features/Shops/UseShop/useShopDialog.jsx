// src/components/.../UseShop/useShopDialog.js
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addShopValidationSchema } from "../../../../validation/validationSchema";

const INITIAL_SHOP_STATE = {
  name: "",
  locationName: "", // ✅ always a name (display + payload)
  categoryName: "", // ✅ always a name (display + payload)
};

const SHOPS_QUERY_KEY = ["shops", "paginated"];

const buildShopStateFromInitial = (initialShop) => {
  if (!initialShop?._id) return { ...INITIAL_SHOP_STATE };

  return {
    ...INITIAL_SHOP_STATE,
    ...initialShop,
    name: initialShop.name ?? "",
    locationName: initialShop.locationName ?? "",
    categoryName: initialShop.categoryName ?? "",
  };
};

const useShopDialog = (initialShop = null) => {
  const queryClient = useQueryClient();
  const { dispatch, state } = useContext(StoreContext);

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
      if (error) throw new Error(error.message || "Could not save shop");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["shops"] });

      // if backend upserts new ones by name, refresh these too
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "shops",
        showError: true,
      });
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await sendRequest(`/api/shops/${id}`, "DELETE");
      if (error) throw new Error(error.message || "Could not delete shop");
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
        error: error.message,
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
        locationName: formatComponentFields(shop.locationName, "shop", "locationName"),
        categoryName: formatComponentFields(shop.categoryName, "shop", "categoryName"),
      };

      await addShopValidationSchema.validate(formatted, { abortEarly: false });

      // ✅ payload is names only (backend resolves -> ids)
      const payload = {
        name: formatted.name,
        locationName: formatted.locationName,
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
      shop?.locationName?.trim().length > 0 &&
      shop?.categoryName?.trim().length > 0 &&
      !validationError?.name &&
      !validationError?.locationName &&
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

