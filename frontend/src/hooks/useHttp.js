import { useEffect, useState, useCallback, useContext } from "react";
import PropTypes from "prop-types";
import { API_URL } from "../components/commons/Consts/constants";
import axios from "axios";
import { StoreContext } from "../Store/Store";

const useCustomHttp = (initialUrl) => {
  const [httpState, setHttpState] = useState({
    data: null,
    loading: true,
    error: null,
    resource: null,
  });
  const { dispatch } = useContext(StoreContext);

  // Utility to extract resource name from a request URL (e.g. /api/brands -> brands)
  const getResourceFromUrl = useCallback((requestUrl) => {
    try {
      const full = requestUrl.startsWith("http") ? new URL(requestUrl).pathname : requestUrl;
      const parts = full.split("/").filter(Boolean);
      const apiIdx = parts.indexOf("api");
      if (apiIdx !== -1 && parts.length > apiIdx + 1) return parts[apiIdx + 1];
      return parts[0] || "server";
    } catch {
      return "server";
    }
  }, []);

  const sendRequest = useCallback(async (url, method = "GET", payload = null) => {
    setHttpState((prev) => ({ ...prev, loading: true, error: null }));
    const controller = new AbortController();

  try {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;

    const response = await axios.request({
      url: fullUrl,
      method,
      data: payload,
      signal: controller.signal,
    });

    setHttpState({ data: response.data, loading: false, error: null, resource: fullUrl });
    return { data: response.data, error: null };
  } catch (error) {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    const resource = getResourceFromUrl(url);
    const errKey = error?.response?.data?.message || "server";
    // Update local state
    setHttpState({
      data: null,
      loading: false,
      error: {
        message: error?.response?.data || error?.message,
        status: error?.response?.status,
        url: fullUrl,
      },
      resource: url,
    });
    // Dispatch to global store so UI can show consistent error messages and save the last request for retry
    try {
      dispatch({
        type: "SET_ERROR",
        resource,
        error: { message: errKey, status: error?.response?.status, data: error?.response?.data },
        showError: true,
        lastRequest: { url: fullUrl, method, payload },
      });
    } catch (e) {
      // ignore if dispatch not available
    }
    const normalizedError = { message: errKey, status: error?.response?.status, data: error?.response?.data };
    return { data: null, error: normalizedError };
  }
  }, [dispatch, getResourceFromUrl]);

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted or not

    const fetchDataFromInitialUrl = async () => {
      sendRequest(initialUrl);
    };

    fetchDataFromInitialUrl();

    const requestInterceptor = axios.interceptors.request.use((config) => {
      // Modify the request config if needed
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        // Modify the response if needed
        return response;
      },
      (error) => {
        // Handle response errors safely (guard against undefined properties)
        if (isMounted) {
          const responseData = error?.response?.data ?? { message: error?.message ?? "Unknown error" };
          const resourceUrl = error?.config?.url ?? null;
          setHttpState((prevHttpState) => ({
            ...prevHttpState,
            error: responseData,
            loading: false,
            resource: resourceUrl,
          }));
          // Also dispatch a normalized error to the global store and capture the failed request for retry
          try {
            const resource = (error?.config?.url && getResourceFromUrl(error.config.url)) || "server";
            const errKey = error?.response?.data?.message || error?.message || "server";
            const req = error?.config || {};
            const lastRequest = {
              url: req.url,
              method: req.method,
              payload: req.data,
            };
            dispatch({
              type: "SET_ERROR",
              resource,
              error: { message: errKey, status: error?.response?.status, data: error?.response?.data },
              showError: true,
              lastRequest,
            });
          } catch (e) {
            // ignore if dispatch/getResourceFromUrl not available
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      isMounted = false; // Set the flag to false when the component unmounts
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [initialUrl, sendRequest, dispatch, getResourceFromUrl]);

  return { ...httpState, sendRequest };
};

useCustomHttp.propTypes = {
  initialUrl: PropTypes.string.isRequired,
};

export default useCustomHttp;


