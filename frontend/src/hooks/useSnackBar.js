import { useCallback } from "react";
import { useStoreDispatch } from "../store/Store";

const useSnackBar = () => {
  const dispatch = useStoreDispatch();

  const showSnackbar = useCallback(
    (message, severity = "success", options = {}) => {
      dispatch({
        type: "SHOW_NOTIFICATION",
        message,
        severity,
        autoHideDuration: options.autoHideDuration,
      });
    },
    [dispatch],
  );

  return {
    showSnackbar,
  };
};

export default useSnackBar;
