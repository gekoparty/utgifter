import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import slugify from "slugify";

const useCustomHttp = (initialUrl, slugifyFields = {}) => {
  const [httpState, setHttpState] = useState({
    data: null,
    loading: true,
    error: null,
    resource: null,
  });

  const sendRequest = useCallback(async (url, method = "GET", payload = null) => {
    setHttpState((prevHttpState) => ({
      ...prevHttpState,
      loading: true,
    }));

    const source = axios.CancelToken.source();

    try {
      let requestConfig = {
        url,
        method,
        cancelToken: source.token,
      };
  
      if (payload) {
        // Check if the component has slugify fields defined
        const fieldsToSlugify = slugifyFields[method];
        if (fieldsToSlugify && Array.isArray(fieldsToSlugify)) {
          // Apply slugify to specified fields in the payload
          const slugifiedPayload = {};
          for (const field of fieldsToSlugify) {
            slugifiedPayload[field] = slugify(payload[field], { lower: true });
          }

          // Send both original and slugified payloads
          requestConfig.data = {
            originalPayload: payload,
            slugifiedPayload,
          };
        } else {
          // No slugify fields defined, use the original payload
          requestConfig.params = payload;
        }
      }
      const response = await axios.request(requestConfig);

      if (response && response.data) {
        setHttpState((prevHttpState) => ({
          ...prevHttpState,
          data: response.data,
          loading: false,
        }));

        return { data: response.data, error: null };
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        setHttpState((prevHttpState) => ({
          ...prevHttpState,
          error: error.response?.data || error.message,
          loading: false,
          resource: url,
        }));
      }
      return { data: null, error };
    } finally {
      source.cancel();
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

