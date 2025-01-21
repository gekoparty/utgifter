import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const useCustomHttp = (initialUrl) => {
  const [httpState, setHttpState] = useState({
    data: null,
    loading: true,
    error: null,
    resource: null,
  });

  const sendRequest = useCallback(async (url, method = "GET", payload = null) => {
    setHttpState((prev) => ({ ...prev, loading: true, error: null }));
    const controller = new AbortController();

    try {
      const response = await axios.request({
        url,
        method,
        data: payload,
        signal: controller.signal,
      });

      setHttpState({ data: response.data, loading: false, error: null, resource: url });
      return { data: response.data, error: null };
    } catch (error) {
      setHttpState({
        data: null,
        loading: false,
        error: {
          message: error.response?.data || error.message,
          status: error.response?.status,
          url,
        },
        resource: url,
      });
      return { data: null, error };
    }
  }, []);

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
        // Handle response errors if needed
        if (isMounted) {
          setHttpState((prevHttpState) => ({
            ...prevHttpState,
            error: error.response.data,
            loading: false,
            resource: error.config.url,
          }));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      isMounted = false; // Set the flag to false when the component unmounts
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [initialUrl, sendRequest]);

  return { ...httpState, sendRequest };
};

useCustomHttp.propTypes = {
  initialUrl: PropTypes.string.isRequired,
};

export default useCustomHttp;


