import { useCallback, useEffect, useState } from "react";
import { useStoreDispatch } from "../store/Store";
import {
  axiosJson,
  buildApiUrl,
  isAbortError,
  normalizeHttpError,
} from "../api/httpClient";

const getResourceFromUrl = (requestUrl) => {
  try {
    const pathname = requestUrl.startsWith("http")
      ? new URL(requestUrl).pathname
      : requestUrl;
    const parts = pathname.split("/").filter(Boolean);
    const apiIndex = parts.indexOf("api");

    if (apiIndex !== -1 && parts.length > apiIndex + 1) {
      return parts[apiIndex + 1];
    }

    return parts[0] || "server";
  } catch {
    return "server";
  }
};

const useCustomHttp = (initialUrl, options = {}) => {
  const { auto = false } = options;
  const dispatch = useStoreDispatch();

  const [httpState, setHttpState] = useState({
    data: null,
    loading: false,
    error: null,
    resource: null,
  });

  const sendRequest = useCallback(
    async (url, method = "GET", payload = null, config = {}) => {
      setHttpState((prev) => ({ ...prev, loading: true, error: null }));

      const fullUrl = buildApiUrl(url).toString();

      try {
        const data = await axiosJson({
          ...config,
          url,
          method,
          data: payload,
        });

        setHttpState({
          data,
          loading: false,
          error: null,
          resource: fullUrl,
        });

        return { data, error: null };
      } catch (error) {
        if (isAbortError(error)) {
          setHttpState((prev) => ({ ...prev, loading: false }));
          return { data: null, error: null, aborted: true };
        }

        const resource = getResourceFromUrl(url);
        const normalizedError = normalizeHttpError(error, "server");
        const stateError = { ...normalizedError, url: fullUrl };

        setHttpState({
          data: null,
          loading: false,
          error: stateError,
          resource: fullUrl,
        });

        try {
          dispatch({
            type: "SET_ERROR",
            resource,
            error: normalizedError,
            showError: true,
            lastRequest: { url: fullUrl, method, payload },
          });
        } catch {
          // Store error reporting is best-effort only.
        }

        return { data: null, error: normalizedError };
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!auto || !initialUrl) return undefined;

    const controller = new AbortController();
    sendRequest(initialUrl, "GET", null, { signal: controller.signal });

    return () => controller.abort();
  }, [auto, initialUrl, sendRequest]);

  return { ...httpState, sendRequest };
};

export default useCustomHttp;
