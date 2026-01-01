// src/components/.../UseShop/useShopDialog.js
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addShopValidationSchema } from "../../../../validation/validationSchema";

const INITIAL_SHOP_STATE = {
  name: "",
  location: "",     // ObjectId string OR "temp-..." (new)
  locationName: "", // display + yup
  category: "",     // ObjectId string OR "temp-..." (new)
  categoryName: "", // display + yup
};

const SHOPS_QUERY_KEY = ["shops", "paginated"];

const buildShopState = (initialShop) => {
  if (!initialShop?._id) return { ...INITIAL_SHOP_STATE };

  const locationId = initialShop.location ? String(initialShop.location) : "";
  const categoryId = initialShop.category ? String(initialShop.category) : "";

  const locationName = initialShop.locationName || "";
  const categoryName = initialShop.categoryName || "";

  return {
    ...INITIAL_SHOP_STATE,
    ...initialShop,
    location: locationId,
    category: categoryId,
    locationName,
    categoryName,
  };
};

// ✅ Normalize POST/PUT responses to match GET shape
const normalizeShopResponse = (saved) => {
  if (!saved) return saved;

  const locObj =
    saved.location && typeof saved.location === "object" ? saved.location : null;
  const catObj =
    saved.category && typeof saved.category === "object" ? saved.category : null;

  const locationId = locObj?._id
    ? String(locObj._id)
    : saved.location
    ? String(saved.location)
    : "";

  const categoryId = catObj?._id
    ? String(catObj._id)
    : saved.category
    ? String(saved.category)
    : "";

  return {
    ...saved,
    location: locationId,
    category: categoryId,
    locationName: saved.locationName || locObj?.name || "N/A",
    categoryName: saved.categoryName || catObj?.name || "N/A",
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

  const [shop, setShop] = useState(() => buildShopState(initialShop));

  // ✅ only resync when switching record (prevents “can't type”)
  useEffect(() => {
    setShop(buildShopState(initialShop));
  }, [shopId]); // intentional

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "shops" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setShop(buildShopState(initialShop));
    resetServerError();
    resetValidationErrors();
  }, [initialShop, resetServerError, resetValidationErrors]);

  const saveShopMutation = useMutation({
    mutationFn: async (payload) => {
      const url = shopId ? `/api/shops/${shopId}` : "/api/shops";
      const method = shopId ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw new Error(error.message || "Failed to save shop");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["shops"] });

      // backend may create new ones by name
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
    resetServerError();
    resetValidationErrors();

    try {
      const formatted = {
        name: formatComponentFields(shop.name, "shop", "name"),
        locationName: formatComponentFields(
          shop.locationName,
          "shop",
          "locationName"
        ),
        categoryName: formatComponentFields(
          shop.categoryName,
          "shop",
          "categoryName"
        ),
      };

      await addShopValidationSchema.validate(formatted, { abortEarly: false });

      const isTemp = (v) => typeof v === "string" && v.startsWith("temp-");

      const payload = {
        name: formatted.name,
        location: isTemp(shop.location) ? formatted.locationName : shop.location,
        category: isTemp(shop.category) ? formatted.categoryName : shop.category,
      };

      const savedRaw = await saveShopMutation.mutateAsync(payload);

      // ✅ FIX: return normalized so table shows names immediately
      const saved = normalizeShopResponse(savedRaw);

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

  const loading =
    httpLoading || saveShopMutation.isPending || deleteShopMutation.isPending;

  return useMemo(
    () => ({
      shop,
      setShop,
      loading,
      displayError,
      validationError,
      isFormValid,
      handleSaveShop,
      handleDeleteShop,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    }),
    [
      shop,
      loading,
      displayError,
      validationError,
      isFormValid,
      handleSaveShop,
      handleDeleteShop,
      resetServerError,
      resetValidationErrors,
      resetFormAndErrors,
    ]
  );
};

export default useShopDialog;

