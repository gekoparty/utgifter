import { useEffect, useState } from "react";
import axios from "axios";

const useCustomHttp = (initialUrl) => {
  const [httpState, setHttpState] = useState({
    data: null,
    loading: true,
    error: null,
    resource: null,
  });

  const fetchData = async (url = initialUrl, method = "GET", payload = null) => {
    setHttpState((prevHttpState) => ({
      ...prevHttpState,
      loading: true,
    }));

    try {
      const response = await axios.request({
        url,
        method,
        data: payload,
      });

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
      setHttpState((prevHttpState) => ({
        ...prevHttpState,
        error: error.response?.data || error.message,
        loading: false,
        resource: url,
      }));
      return { data: null, error };
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted or not
    const source = axios.CancelToken.source();

    const fetchDataFromInitialUrl = async () => {
      fetchData(initialUrl);
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
      source.cancel();
    };
  }, [initialUrl]);

  const deleteData = async (url) => {
    setHttpState((prevHttpState) => ({
      ...prevHttpState,
      loading: true,
    }));

    try {
      await axios.delete(url);

      setHttpState((prevHttpState) => ({
        ...prevHttpState,
        loading: false,
      }));

      return { error: null };
    } catch (error) {
      setHttpState((prevHttpState) => ({
        ...prevHttpState,
        error: error.response.data,
        loading: false,
        resource: url,
      }));
      return { error };
    }
  };

  const addData = async (url, method = "POST", payload = null) => {
    console.log("Data to be sent:", payload);
    setHttpState((prevHttpState) => ({
      ...prevHttpState,
      loading: true,
    }));

    try {
      const response = await axios.post(url, payload);

      console.log("Data added successfully:", response);

      setHttpState((prevHttpState) => ({
        ...prevHttpState,
        data: response.data,
        loading: false,
      }));

      return { data: response.data, error: null };
    } catch (error) {
      console.log("error:", error);
      setHttpState((prevHttpState) => ({
        ...prevHttpState,
        error,
        loading: false,
        resource: url,
      }));
      return { data: null, error };
    }
  };

  return { ...httpState, fetchData, deleteData, addData };
};

export default useCustomHttp;

