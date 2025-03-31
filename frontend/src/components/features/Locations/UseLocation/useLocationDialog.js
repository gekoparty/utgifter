import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addLocationValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const useLocationDialog = (initialLocation = null) => {
  // Initialize initial state
  const initialLocationState = useMemo(() => ({ name: "" }), []);
  const [location, setLocation] = useState(
    initialLocation ? initialLocation : { ...initialLocationState }
  );
  
  // Custom HTTP hook
  const { sendRequest, loading } = useCustomHttp("/api/locations");
  
  // Global store
  const { dispatch, state } = useContext(StoreContext);
  
  // React Query client
  const queryClient = useQueryClient();

  // Reset functions
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "locations" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setLocation(initialLocation ? initialLocation : { ...initialLocationState });
    resetServerError();
    resetValidationErrors();
  }, [initialLocation, initialLocationState, resetServerError, resetValidationErrors]);

  // Update location on initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setLocation((prevLocation) => ({ ...prevLocation, ...initialLocation }));
    } else {
      resetFormAndErrors();
    }
    // Cleanup: clear resources when unmounting
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
    };
  }, [initialLocation, resetFormAndErrors, dispatch]);

  // Define mutation for saving location using object syntax (like your product hook)
  const saveLocationMutation = useMutation({
    mutationFn: async (formattedLocation) => {
      const url = initialLocation
        ? `/api/locations/${initialLocation._id}`
        : "/api/locations";
      const method = initialLocation ? "PUT" : "POST";
      const { data, error: addDataError } = await sendRequest(url, method, formattedLocation);
      if (addDataError) {
        throw new Error(data?.error || addDataError);
      }
      return data;
    },
    onMutate: async (formattedLocation) => {
      await queryClient.cancelQueries({ queryKey: ["locations"] });
      const previousLocations = queryClient.getQueryData(["locations"]);
      // Optionally update the cache optimistically here.
      return { previousLocations };
    },
    onError: (error, formattedLocation, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(["locations"], context.previousLocations);
      }
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "locations",
        showError: true,
      });
    },
    onSuccess: () => {
      dispatch({ type: "RESET_ERROR", resource: "locations" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    // Optionally, you can add onSettled if needed.
  });

  // Handle save location with validation
  const handleSaveLocation = async (onClose) => {
    if (!location.name.trim()) return;
    
    let formattedLocation = { ...location };
    let validationErrors = {};
    try {
      formattedLocation.name = formatComponentFields(location.name, "location", "name");
      await addLocationValidationSchema.validate(formattedLocation, { abortEarly: false });
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "locations",
        validationErrors: { ...state.validationErrors?.locations, ...validationErrors },
        showError: true,
      });
      return;
    }

    try {
      await saveLocationMutation.mutateAsync(formattedLocation);
      setLocation({ ...initialLocationState });
      onClose();
      return true;
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError.message,
        resource: "locations",
        showError: true,
      });
    }
  };

  // Delete a location
  const handleDeleteLocation = async (selectedLocation, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/locations/${selectedLocation?._id}`, "DELETE");
      if (response.error) {
        onDeleteFailure(selectedLocation);
        return false;
      } else {
        onDeleteSuccess(selectedLocation);
        dispatch({ type: "DELETE_ITEM", resource: "locations", payload: selectedLocation._id });
        queryClient.invalidateQueries({ queryKey: ["locations"] });
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedLocation);
      return false;
    }
  };

  // Error and validation states
  const displayError = state.error?.locations;
  const validationError = state.validationErrors?.locations;

  const isFormValid = () => {
    return location?.name?.trim().length > 0 && !validationError?.name;
  };

  return {
    isFormValid,
    loading: loading || saveLocationMutation.isLoading,
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
