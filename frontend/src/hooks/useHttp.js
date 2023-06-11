import { useState, useEffect } from "react";
import axios from "axios";

const useHttp = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/data"); // Replace with your API endpoint
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const editData = async (id, newData) => {
    // Implement edit functionality here
  };

  const deleteData = async (id) => {
    // Implement delete functionality here
  };

  return { data, loading, error, editData, deleteData };
};

export default useHttp;