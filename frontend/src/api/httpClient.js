import { API_URL } from "../components/commons/Consts/constants";

export const buildApiUrl = (pathOrUrl) => {
  if (pathOrUrl instanceof URL) return pathOrUrl;
  if (String(pathOrUrl).startsWith("http")) return new URL(pathOrUrl);

  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const path = String(pathOrUrl).startsWith("/")
    ? String(pathOrUrl).slice(1)
    : String(pathOrUrl);

  return new URL(path, base);
};

export const normalizeHttpError = (error, fallbackMessage = "Request failed") => {
  const responseData = error?.response?.data ?? error?.data;
  const serverMessage = responseData?.message || responseData?.error;
  const message =
    typeof serverMessage === "string"
      ? serverMessage
      : typeof error?.message === "string"
        ? error.message
        : fallbackMessage;

  return {
    message,
    status: error?.response?.status ?? error?.status,
    data: responseData,
  };
};

export const requestJson = async (
  pathOrUrl,
  { data: requestData, headers, signal, ...init } = {},
) => {
  const url = buildApiUrl(pathOrUrl);
  const response = await fetch(url.toString(), {
    ...init,
    signal,
    headers: {
      ...(requestData !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: requestData !== undefined ? JSON.stringify(requestData) : init.body,
  });

  let responseData = null;
  const text = await response.text();

  if (text) {
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      responseData?.message ||
        responseData?.error ||
        response.statusText ||
        "Request failed",
    );
    error.status = response.status;
    error.data = responseData;
    error.url = url.toString();
    throw error;
  }

  return responseData;
};

export const axiosJson = async ({
  url,
  method = "GET",
  data,
  signal,
  ...config
}) => {
  const { default: axios } = await import("axios");
  const fullUrl = buildApiUrl(url).toString();
  const response = await axios.request({
    ...config,
    url: fullUrl,
    method,
    data,
    signal,
  });

  return response.data;
};

export const isAbortError = (error) =>
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED" ||
  error?.message === "canceled";
