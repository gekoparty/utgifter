import { useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { addLocationValidationSchema } from "../../../validation/validationSchema";
import { StoreContext } from "../../../Store/Store";



const useLocationDialog = (initialLocation = null) => {
  const [locationName, setLocationName] = useState(initialLocation?.name || "");
  const { sendRequest, loading } = useCustomHttp(
    "/api/locations"
  );
  const { dispatch, state } = useContext(StoreContext);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
  }, [dispatch]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "locations" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setLocationName(initialLocation?.name || "");
    dispatch({ type: "RESET_ERROR", resource: "locations" });
    resetValidationErrors();
  }, [dispatch, initialLocation, resetValidationErrors]);

  useEffect(() => {
    if (initialLocation) {
      setLocationName(initialLocation.name);
    } else {
      resetFormAndErrors();
    }
  }, [initialLocation, resetFormAndErrors]);



  const handleSaveLocation = async (onClose) => {
    if (typeof locationName !== "string" || locationName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {
      await addLocationValidationSchema.validate({ locationName });
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "locations",
        validationErrors: {
          locationName: { show: true, message: "Navnet må være minst 2 tegn" },
        },
        showError: true,
      });
      return; // Exit the function if validation fails
    }

    const formattedLocationName = formatComponentFields(
      locationName,
      "location"
    );
    

    try {
      let url = "/api/locations";
      let method = "POST";

      if (initialLocation) {
        url = `/api/locations/${initialLocation._id}`;
        method = "PUT";
      }

      const { error: addDataError } = await sendRequest(
        url,
        method,
        formattedLocationName
      );

      if (addDataError) {
        console.log("value of addDataError", addDataError);
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "locations",
          showError: true,
        });
      } else {
        
        setLocationName("");
        dispatch({ type: "RESET_ERROR", resource: "locations" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });

        onClose();
        return true; // Note: Don't close the dialog here, do it in the respective components
      }
    } catch (fetchError) {
      console.log("value of fetchError", fetchError);
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/locations",
        showError: true,
      });
    }
  };

  const handleDeleteLocation = async (
    selectedLocation,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      const response = await sendRequest(
        `/api/locations/${selectedLocation?._id}`,
        "DELETE"
      );
      if (response.error) {
        onDeleteFailure(selectedLocation);
        return false; // Indicate deletion failure
      } else {
        onDeleteSuccess(selectedLocation);
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedLocation);
      return false; // Indicate deletion failure
    }
  };

  const displayError = state.error?.locations;
  const validationError = state.validationErrors?.locations?.locationName;

  const isFormValid = () => {
    return (
      typeof locationName === "string" &&
      locationName.trim().length > 0 &&
      !validationError
    );
  };

  return {
    locationName,
    setLocationName,
    loading,
    handleSaveLocation,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    handleDeleteLocation,
    resetFormAndErrors,
  };
};

useLocationDialog.propTypes = {
  initialLocation: PropTypes.object, // initialBrand is optional and should be an object
};

export default useLocationDialog;
