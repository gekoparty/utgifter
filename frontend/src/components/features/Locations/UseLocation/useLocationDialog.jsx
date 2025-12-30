import { useContext, useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addLocationValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_LOCATION_STATE = { name: "" };
const LOCATIONS_QUERY_KEY = ["locations", "paginated"];

const useLocationDialog = (initialLocation = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading: httpLoading } = useCustomHttp("/api/locations", { auto: false });
  const { dispatch, state } = useContext(StoreContext);

  const isEditMode = Boolean(initialLocation && initialLocation._id);

  const [location, setLocation] = useState(INITIAL_LOCATION_STATE);

  // Keep in sync when selected record changes
  useEffect(() => {
    if (isEditMode) {
      setLocation({ ...INITIAL_LOCATION_STATE, ...initialLocation });
    } else {
      setLocation({ ...INITIAL_LOCATION_STATE });
    }
  }, [isEditMode, initialLocation?._id]);

  const resetServerError = () => {
    dispatch({ type: "RESET_ERROR", resource: "locations" });
  };

  const resetValidationErrors = () => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "locations" });
  };

  const resetFormAndErrors = () => {
    setLocation(isEditMode ? { ...INITIAL_LOCATION_STATE, ...initialLocation } : { ...INITIAL_LOCATION_STATE });
    resetServerError();
    resetValidationErrors();
  };

  const saveLocationMutation = useMutation({
    mutationFn: async (formattedLocation) => {
      const url = isEditMode
        ? `/api/locations/${initialLocation._id}`
        : "/api/locations";

      const method = isEditMode ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, formattedLocation);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "locations",
        showError: true,
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId) => {
      const { error } = await sendRequest(`/api/locations/${locationId}`, "DELETE");
      if (error) throw new Error("Could not delete location");
      return locationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "locations",
        showError: true,
      });
    },
  });

  const handleSaveLocation = async () => {
    if (!location.name.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      const formattedLocation = {
        ...location,
        name: formatComponentFields(location.name, "location", "name"),
      };

      await addLocationValidationSchema.validate(formattedLocation, { abortEarly: false });

      const data = await saveLocationMutation.mutateAsync(formattedLocation);

      if (!isEditMode) {
        setLocation({ ...INITIAL_LOCATION_STATE });
      }

      return data;
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "locations",
          validationErrors: {
            ...state.validationErrors?.locations,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  };

  const handleDeleteLocation = async (locationToDelete) => {
    if (!locationToDelete?._id) return false;

    resetServerError();
    resetValidationErrors();

    try {
      await deleteLocationMutation.mutateAsync(locationToDelete._id);
      return true;
    } catch {
      return false;
    }
  };

  const displayError = state.error?.locations;
  const validationError = state.validationErrors?.locations;

  const isFormValid = () =>
    location?.name?.trim().length > 0 && !validationError?.name;

  const loading =
    httpLoading ||
    saveLocationMutation.isPending ||
    deleteLocationMutation.isPending;

  return {
    location,
    setLocation,
    isFormValid,
    loading,
    displayError,
    validationError,
    handleSaveLocation,
    handleDeleteLocation,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

export default useLocationDialog;
