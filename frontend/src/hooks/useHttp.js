import { useEffect, useState, useCallback, useContext } from "react";
import PropTypes from "prop-types";
import { API_URL } from "../components/commons/Consts/constants";
import axios from "axios";
import { StoreContext } from "../Store/Store";

const useCustomHttp = (initialUrl, options = {}) => {
  const { auto = false } = options;

  const [httpState, setHttpState] = useState({
    data: null,
    loading: false,
    error: null,
    resource: null,
  });

  const { dispatch } = useContext(StoreContext);

  const getResourceFromUrl = useCallback((requestUrl) => {
    try {
      const full = requestUrl.startsWith("http")
        ? new URL(requestUrl).pathname
        : requestUrl;
      const parts = full.split("/").filter(Boolean);
      const apiIdx = parts.indexOf("api");
      if (apiIdx !== -1 && parts.length > apiIdx + 1) return parts[apiIdx + 1];
      return parts[0] || "server";
    } catch {
      return "server";
    }
  }, []);

  const sendRequest = useCallback(
    async (url, method = "GET", payload = null, config = {}) => {
      setHttpState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;

        const response = await axios.request({
          url: fullUrl,
          method,
          data: payload,
          signal: config.signal,
        });

        setHttpState({
          data: response.data,
          loading: false,
          error: null,
          resource: fullUrl,
        });

        return { data: response.data, error: null };
      } catch (error) {
        const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
        const resource = getResourceFromUrl(url);
        const errKey = error?.response?.data?.message || error?.message || "server";

        setHttpState({
          data: null,
          loading: false,
          error: {
            message: error?.response?.data || error?.message,
            status: error?.response?.status,
            url: fullUrl,
          },
          resource: fullUrl,
        });

        try {
          dispatch({
            type: "SET_ERROR",
            resource,
            error: {
              message: errKey,
              status: error?.response?.status,
              data: error?.response?.data,
            },
            showError: true,
            lastRequest: { url: fullUrl, method, payload },
          });
        } catch {}

        return {
          data: null,
          error: {
            message: errKey,
            status: error?.response?.status,
            data: error?.response?.data,
          },
        };
      }
    },
    [dispatch, getResourceFromUrl]
  );

  useEffect(() => {
    if (!auto || !initialUrl) return;
    sendRequest(initialUrl);
  }, [auto, initialUrl, sendRequest]);

  return { ...httpState, sendRequest };
};

useCustomHttp.propTypes = {
  initialUrl: PropTypes.string,
};

export default useCustomHttp;

