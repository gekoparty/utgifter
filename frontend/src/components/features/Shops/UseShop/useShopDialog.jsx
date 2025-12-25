import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addShopValidationSchema } from "../../../../validation/validationSchema";

const INITIAL_SHOP_STATE = {
  name: "",
  location: "",     // Store ID for saving
  locationName: "", // Store name for validation/display
  category: "",     // Store ID for saving
  categoryName: ""  // Store name for validation/display
};

const useShopDialog = (initialShop = null) => {
  // --- Context & Setup ---
  const { sendRequest, loading } = useCustomHttp("/api/shops");
  const { dispatch, state } = useContext(StoreContext);
  const queryClient = useQueryClient();
  
  // --- State ---
  // Initialize state based on initialShop (if editing) or the clean default state.
  const [shop, setShop] = useState(
    initialShop 
      ? { ...INITIAL_SHOP_STATE, ...initialShop }
      : { ...INITIAL_SHOP_STATE }
  );

  // --- Utility Handlers (Memoized) ---

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "shops" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
  }, [dispatch]);

  // Use a stable reference for the initial state when resetting.
  const resetFormAndErrors = useCallback(() => {
    setShop(initialShop ? { ...INITIAL_SHOP_STATE, ...initialShop } : { ...INITIAL_SHOP_STATE });
    resetServerError();
    resetValidationErrors();
  }, [initialShop, resetServerError, resetValidationErrors]);

  // --- Effects ---

  // Initialize or reset the form when initialShop changes (simplified initialization).
  useEffect(() => {
    if (initialShop) {
      setShop({
        ...INITIAL_SHOP_STATE,
        ...initialShop,
        // Ensure locationName/categoryName always reflect the display value
        locationName: initialShop.locationName || initialShop.location || "",
        categoryName: initialShop.categoryName || initialShop.category || "",
      });
    } else {
      setShop({ ...INITIAL_SHOP_STATE });
    }
    
    // Cleanup: Clear unused resource data in the global store when component unmounts
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "categories" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
    };
  }, [initialShop, dispatch]);

  // --- Mutations ---

  // 1. Save (Add/Edit) Mutation
  const saveShopMutation = useMutation({
    mutationFn: async (savePayload) => {
      const url = initialShop ? `/api/shops/${initialShop._id}` : "/api/shops";
      const method = initialShop ? "PUT" : "POST";
      const { data, error: apiError } = await sendRequest(url, method, savePayload);
      if (apiError) {
        // Use the actual error message from the API response if available
        throw new Error(apiError.message || "Failed to save shop.");
      }
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["shops", "paginated"] });
    },
    onError: (error) => {
      // Handle server error display using the global dispatch
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "shops",
        showError: true,
      });
    },
    onSuccess: (data, variables, context) => {
      resetServerError();
      resetValidationErrors();
      // Invalidate the shops paginated query to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["shops", "paginated"] });
    },
  });

  // 2. Delete Mutation (New structure for consistency)
  const deleteShopMutation = useMutation({
    mutationFn: (shopId) => sendRequest(`/api/shops/${shopId}`, "DELETE"),
    onSuccess: (data, shopId, context) => {
      // Invalidate the shops paginated query to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["shops", "paginated"] });
    },
    // Optional: Add optimistic updates here if needed, similar to the original saveShopMutation logic.
  });

  // --- Business Logic Handlers ---

  const handleSaveShop = async (onClose) => {
    resetServerError();
    resetValidationErrors();
    let validationErrors = {};
    
    try {
      // 1. Format display fields for validation
      const formattedData = {
        name: formatComponentFields(shop.name, "shop", "name"),
        locationName: formatComponentFields(shop.locationName, "shop", "location"),
        categoryName: formatComponentFields(shop.categoryName, "shop", "category")
      };

      // 2. Validate formatted display names
      await addShopValidationSchema.validate(formattedData, { abortEarly: false });

      // 3. Prepare final payload
      const savePayload = {
        name: formattedData.name,
        // Send the ID if it's a real ID, otherwise send the name for the backend to handle creation/lookup
        location: shop.location.startsWith('temp-') ? formattedData.locationName : shop.location,
        category: shop.category.startsWith('temp-') ? formattedData.categoryName : shop.category
      };

      // 4. Execute the mutation (handles loading, success, and error state internally)
      await saveShopMutation.mutateAsync(savePayload);
      
      // 5. Close dialog only on success
      setShop({ ...INITIAL_SHOP_STATE });
      return true; // Indicate success
      
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      
      // Handle validation error display
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "shops",
        validationErrors: {
          ...state.validationErrors?.shops,
          ...validationErrors,
        },
        showError: true,
      });
      return false; // Indicate failure
    }
  };

  // Simplified Delete Handler using deleteShopMutation
  const handleDeleteShop = async (selectedShop, onDeleteSuccess, onDeleteFailure) => {
    try {
        await deleteShopMutation.mutateAsync(selectedShop._id);
        onDeleteSuccess(selectedShop);
        return true;
    } catch (error) {
        onDeleteFailure(selectedShop);
        return false;
    }
  };

  // --- Exposed State and Helpers ---

  const displayError = state.error?.shops;
  const validationError = state.validationErrors?.shops;

  // Simplified form validation check
  const isFormValid = () => {
    const requiredFields = [shop?.name, shop?.locationName, shop?.categoryName];
    // Check if all required fields are present (non-empty after trimming)
    const allFieldsPopulated = requiredFields.every(field => field?.trim().length > 0);
    
    // Check if there are any active validation errors
    const hasActiveValidationError = 
      (validationError?.name?.show || validationError?.locationName?.show || validationError?.categoryName?.show);
      
    return allFieldsPopulated && !hasActiveValidationError;
  };

  return {
    isFormValid,
    // Combine loading states from HTTP hook and save mutation
    loading: loading || saveShopMutation.isPending || deleteShopMutation.isPending,
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
