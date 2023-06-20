import { useEffect, useState } from 'react';
import axios from 'axios';

const useCustomHttp = (initialUrl) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // Set loading to true initially
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted or not

    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await axios.get(initialUrl);
        if (isMounted) {
          setData(response.data);
          setLoading(false);
        }
        
      } catch (error) {
        if (isMounted) {
          setError(error);
          setLoading(false);
        }
      }
    };

    fetchData();

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
        return Promise.reject(error);
      }
    );

    return () => {
      isMounted = false; // Set the flag to false when the component unmounts
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [initialUrl]);

  const fetchData = async (url, method = 'GET', payload = null) => {
    setLoading(true);

    try {
      const response = await axios.request({
        url,
        method,
        data: payload,
      });

      console.log('Response:', response);

      setData(response.data);
      setLoading(false);
      return { data: response.data, error: null };
    } catch (error) {
      setError(error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const deleteData = async (url) => {
    setLoading(true);
    

    try {
      console.log('Deleting data:', url);
      await axios.delete(url);
      console.log('Data deleted successfully');

      setLoading(false);
      return { error: null };
    } catch (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
  };

  const addData = async (url, method = 'POST', payload = null) => {
    console.log('Data to be sent:', payload);
    setLoading(true);

    try {
      const response = await axios.post(url, payload);
      console.log('Data added successfully:', response);

      setLoading(false);
      return { data: response.data, error: null };
    } catch (error) {
      setError(error);
      setLoading(false);
      return { data: null, error };
    }
  };

 
  

  return { data, loading, error, fetchData, deleteData, addData };
};

export default useCustomHttp;