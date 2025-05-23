import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addShopValidationSchema } from "../../../../validation/validationSchema";

const useShopDialog = (initialShop = null) => {
  // Memoize the initial shop state to prevent unnecessary recalculations.
  const initialShopState = useMemo(() => ({
    name: "",
    location: "",      // Store ID for saving
    locationName: "",  // Store name for validation/display
    category: "",      // Store ID for saving
    categoryName: ""   // Store name for validation/display
  }), []);

  // Initialize the shop state using the initial shop passed in (if any)
  const [shop, setShop] = useState(
    initialShop ? initialShop : { ...initialShopState }
  );

  // Custom HTTP hook for shops.
  const { sendRequest, loading } = useCustomHttp("/api/shops");

  // Global store context.
  const { dispatch, state } = useContext(StoreContext);

  // React Query client
  const queryClient = useQueryClient();

  // Reset server error for shops.
  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "shops",
    });
  }, [dispatch]);

  // Reset validation errors for shops.
  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "shops",
    });
  }, [dispatch]);

  // Reset the form and clear all errors.
  const resetFormAndErrors = useCallback(() => {
    setShop(initialShop ? initialShop : { ...initialShopState });
    resetServerError();
    resetValidationErrors();
  }, [initialShop, initialShopState, resetServerError, resetValidationErrors]);

  // Initialize or reset the form when initialShop changes.
  useEffect(() => {
    if (initialShop) {
      console.log("Initial shop in useShopDialog:", initialShop);
      setShop((prevShop) => ({
        ...prevShop,
        ...initialShop,
        locationName: initialShop.locationName || initialShop.location || "",
        categoryName: initialShop.categoryName || initialShop.category || "",
      }));
    } else {
      resetFormAndErrors();
    }
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "categories" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
    };
  }, [initialShop, resetFormAndErrors, dispatch]);

  // -------------------------------
  // Mutation for saving a shop
  // -------------------------------
  const saveShopMutation = useMutation({
    mutationFn: async (formattedShop) => {
      const url = initialShop ? `/api/shops/${initialShop._id}` : "/api/shops";
      const method = initialShop ? "PUT" : "POST";
      const { data, error: addDataError } = await sendRequest(url, method, formattedShop);
      if (addDataError) {
        throw new Error(data?.error || addDataError);
      }
      return data;
    },
    onMutate: async (formattedShop) => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ["shops", "paginated"] });
      // Snapshot previous value
      const previousShops = queryClient.getQueryData(["shops", "paginated"]);
      // Optionally update the cache optimistically here.
      return { previousShops };
    },
    onError: (error, formattedShop, context) => {
      if (context?.previousShops) {
        queryClient.setQueryData(["shops", "paginated"], context.previousShops);
      }
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "shops",
        showError: true,
      });
    },
    onSuccess: () => {
      dispatch({ type: "RESET_ERROR", resource: "shops" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
      // Invalidate the shops paginated query so the list refreshes
      queryClient.invalidateQueries({ queryKey: ["shops", "paginated"] });
    },
  });

  // -------------------------------
  // Save the shop using mutation.
  // -------------------------------
  const handleSaveShop = async (onClose) => {
    let validationErrors = {};
  
    try {
      // 1. Format and validate display names only.
      const formattedData = {
        name: formatComponentFields(shop.name, "shop", "name"),
        locationName: formatComponentFields(shop.locationName, "shop", "location"),
        categoryName: formatComponentFields(shop.categoryName, "shop", "category")
      };
  
      // 2. Validate formatted display names.
      await addShopValidationSchema.validate(formattedData, { abortEarly: false });
  
      // 3. Prepare final payload with IDs/names.
      const savePayload = {
        name: formattedData.name,
        // If the shop.location starts with 'temp-', send the formatted name, otherwise the ID.
        location: shop.location.startsWith('temp-') ? formattedData.locationName : shop.location,
        category: shop.category.startsWith('temp-') ? formattedData.categoryName : shop.category
      };
  
      // 4. Execute the mutation.
      await saveShopMutation.mutateAsync(savePayload);
  
      // 5. Reset state and close dialog on success.
      setShop({ ...initialShopState });
      onClose();
      return true;
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "shops",
        validationErrors: {
          ...state.validationErrors?.shops,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }
  };

  // -------------------------------
  // Delete a shop.
  // -------------------------------
  const handleDeleteShop = async (selectedShop, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/shops/${selectedShop?._id}`, "DELETE");
      if (response.error) {
        onDeleteFailure(selectedShop);
        return false;
      } else {
        onDeleteSuccess(selectedShop);
        dispatch({
          type: "DELETE_ITEM",
          resource: "shops",
          payload: selectedShop._id,
        });
        queryClient.invalidateQueries({ queryKey: ["shops", "paginated"] });
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedShop);
      return false;
    }
  };

  // -------------------------------
  // Error and validation state.
  // -------------------------------
  const displayError = state.error?.shops;
  const validationError = state.validationErrors?.shops;

  // Check if the form is valid.
  const isFormValid = () => {
    return (
      !validationError?.name &&
      !validationError?.locationName &&
      !validationError?.categoryName &&
      shop?.name?.trim().length > 0 &&
      shop?.locationName?.trim().length > 0 &&
      shop?.categoryName?.trim().length > 0
    );
  };

  return {
    isFormValid,
    loading: loading || saveShopMutation.isLoading,
    handleSaveShop,
    handleDeleteShop,
    displayError,
    validationError,
    shop,
    setShop,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useShopDialog.propTypes = {
  initialShop: PropTypes.object,
};

export default useShopDialog;
