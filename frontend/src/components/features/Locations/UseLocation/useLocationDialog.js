import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addLocationValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_LOCATION_STATE = { name: "" };

const useLocationDialog = (initialLocation = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading } = useCustomHttp("/api/locations");
  const { dispatch, state } = useContext(StoreContext);

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [location, setLocation] = useState(
    initialLocation
      ? { ...INITIAL_LOCATION_STATE, ...initialLocation }
      : { ...INITIAL_LOCATION_STATE }
  );

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "locations" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setLocation(
      initialLocation
        ? { ...INITIAL_LOCATION_STATE, ...initialLocation }
        : { ...INITIAL_LOCATION_STATE }
    );
    resetServerError();
    resetValidationErrors();
  }, [initialLocation, resetServerError, resetValidationErrors]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (initialLocation) {
      setLocation({ ...INITIAL_LOCATION_STATE, ...initialLocation });
    } else {
      setLocation({ ...INITIAL_LOCATION_STATE });
    }

    // Cleanup: clear resources when unmounting
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
    };
  }, [initialLocation, dispatch]);

  // --------------------------------------------------------------------------
  // Mutation: Save (Create/Update)
  // --------------------------------------------------------------------------
  const saveLocationMutation = useMutation({
    mutationFn: async (formattedLocation) => {
      const url = initialLocation
        ? `/api/locations/${initialLocation._id}`
        : "/api/locations";
      const method = initialLocation ? "PUT" : "POST";
      const { data, error } = await sendRequest(url, method, formattedLocation);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: (savedData) => {
      dispatch({ type: "RESET_ERROR", resource: "locations" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      return savedData;
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "locations",
        showError: true,
      });
    },
    // ✅ REMOVED: onMutate logic for cache rollback is now removed.
  });

  // --------------------------------------------------------------------------
  // ✅ NEW Mutation: Delete
  // --------------------------------------------------------------------------
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId) => {
      const { error } = await sendRequest(`/api/locations/${locationId}`, "DELETE");
      if (error) throw new Error("Could not delete location");
      return locationId;
    },
    onSuccess: (deletedId) => {
      dispatch({ type: "DELETE_ITEM", resource: "locations", payload: deletedId });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSaveLocation = async (onClose) => {
    if (!location.name.trim()) return false;

    let formattedLocation = { ...location };
    let validationErrors = {};
    
    try {
      // 1. Format
      formattedLocation.name = formatComponentFields(location.name, "location", "name");
      
      // 2. Validate
      await addLocationValidationSchema.validate(formattedLocation, { abortEarly: false });
      
      // 3. Mutate
      const data = await saveLocationMutation.mutateAsync(formattedLocation);
      
      // 4. Cleanup
      setLocation({ ...INITIAL_LOCATION_STATE });
      onClose && onClose();
      
      return data;
      
    } catch (error) {
      if (error.name === "ValidationError") {
        error.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "locations",
          validationErrors: { ...state.validationErrors?.locations, ...validationErrors },
          showError: true,
        });
      }
      // Server errors handled by mutation onError, but return false to stop UI flow
      return false;
    }
  };

  const handleDeleteLocation = async (selectedLocation, onDeleteSuccess, onDeleteFailure) => {
    try {
      await deleteLocationMutation.mutateAsync(selectedLocation._id);
      onDeleteSuccess(selectedLocation);
      return true;
    } catch (error) {
      onDeleteFailure(selectedLocation);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------
  const displayError = state.error?.locations;
  const validationError = state.validationErrors?.locations;

  const isFormValid = () => {
    return location?.name?.trim().length > 0 && !validationError?.name;
  };

  // Combine loading states from all asynchronous sources
  const isLoading = loading || saveLocationMutation.isPending || deleteLocationMutation.isPending;

  return {
    isFormValid,
    loading: isLoading,
    handleSaveLocation,
    handleDeleteLocation,
    displayError,
    validationError,
    location,
    setLocation,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useLocationDialog.propTypes = {
  initialLocation: PropTypes.object,
};

export default useLocationDialog;