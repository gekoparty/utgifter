import useHttp from './useHttp';

const useShops = () => {
  const { data, loading, error } = useHttp();

  // Assuming the response data is an array of shops
  const shops = Array.isArray(data) ? data : [];

  return { shops, loading, error };
};

export default useShops;