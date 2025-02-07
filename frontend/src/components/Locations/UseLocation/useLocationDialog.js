import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { addLocationValidationSchema } from "../../../validation/validationSchema";
import { StoreContext } from "../../../Store/Store";

const useLocationDialog = (initialLocation = null) => {
  // Memoize initial state to prevent unnecessary recalculations.
  const initialLocationState = useMemo(
    () => ({
      name: "",
    }),
    []
  );

  // Initialize state with initialLocation if available.
  const [location, setLocation] = useState(
    initialLocation ? initialLocation : { ...initialLocationState }
  );

  // Custom HTTP hook for API requests.
  const { sendRequest, loading } = useCustomHttp("/api/locations");

  // Access global store context.
  const { dispatch, state } = useContext(StoreContext);

  // Reset server error state.
  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "locations",
    });
  }, [dispatch]);

  // Reset validation errors.
  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "locations",
    });
  }, [dispatch]);

  // Reset form fields and clear errors.
  const resetFormAndErrors = useCallback(() => {
    setLocation(initialLocation ? initialLocation : { ...initialLocationState });
    resetServerError();
    resetValidationErrors();
  }, [initialLocation, initialLocationState, resetServerError, resetValidationErrors]);

  // Effect to initialize/reset form when initialLocation changes.
  useEffect(() => {
    if (initialLocation) {
      setLocation((prevLocation) => ({
        ...prevLocation,
        ...initialLocation,
      }));
    } else {
      resetFormAndErrors();
    }

    // Cleanup: Clear any related resources.
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
    };
  }, [initialLocation, resetFormAndErrors, dispatch]);

  // Save location (Create or Update).
  const handleSaveLocation = async (onClose) => {
    if (!location.name.trim()) return;

    let formattedLocation = { ...location };
    let validationErrors = {};

    try {
      // Format name field.
      formattedLocation.name = formatComponentFields(location.name, "location", "name");

      // Validate using schema.
      await addLocationValidationSchema.validate(formattedLocation, {
        abortEarly: false,
      });
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "locations",
        validationErrors: {
          ...state.validationErrors?.locations,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    try {
      // Determine API endpoint and method.
      const url = initialLocation
        ? `/api/locations/${initialLocation._id}`
        : "/api/locations";
      const method = initialLocation ? "PUT" : "POST";

      const { data, error: addDataError } = await sendRequest(url, method, formattedLocation);

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: data?.error || addDataError,
          resource: "locations",
          showError: true,
        });
      } else {
        dispatch({ type: "RESET_ERROR", resource: "locations" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });

        // Reset form after saving.
        setLocation({ ...initialLocationState });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "locations",
        showError: true,
      });
    }
  };

  // Delete a location.
  const handleDeleteLocation = async (selectedLocation, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/locations/${selectedLocation?._id}`, "DELETE");
      if (response.error) {
        onDeleteFailure(selectedLocation);
        return false;
      } else {
        onDeleteSuccess(selectedLocation);
        dispatch({
          type: "DELETE_ITEM",
          resource: "locations",
          payload: selectedLocation._id,
        });
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedLocation);
      return false;
    }
  };

  // Extract errors from global state.
  const displayError = state.error?.locations;
  const validationError = state.validationErrors?.locations;

  // Validate form.
  const isFormValid = () => {
    return location?.name?.trim().length > 0 && !validationError?.name;
  };

  return {
    isFormValid,
    loading,
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

