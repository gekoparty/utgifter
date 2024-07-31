// useFetchData.js
import { useQuery } from "@tanstack/react-query";

const useFetchData = (open) => {
  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  };

  const fetchBrands = async () => {
    const response = await fetch("/api/brands");
    if (!response.ok) {
      throw new Error("Failed to fetch brands");
    }
    return response.json();
  };

  const fetchShops = async () => {
    const response = await fetch("/api/shops");
    if (!response.ok) {
      throw new Error("Failed to fetch shops");
    }
    const shops = await response.json();
    const shopsWithLocations = await Promise.all(
      shops.map(async (shop) => {
        const locationResponse = await fetch(`/api/locations/${shop.location}`);
        if (!locationResponse.ok) {
          throw new Error(`Failed to fetch location details for location: ${shop.location}`);
        }
        const location = await locationResponse.json();
        return { ...shop, locationName: location.name };
      })
    );
    return shopsWithLocations;
  };

  const { data: products = [], isLoading: isLoadingProducts } = useQuery(
    ["products"],
    fetchProducts,
    { enabled: open }
  );
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery(
    ["brands"],
    fetchBrands,
    { enabled: open }
  );
  const { data: shops = [], isLoading: isLoadingShops } = useQuery(
    ["shops"],
    fetchShops,
    { enabled: open }
  );

  const isLoading = isLoadingProducts || isLoadingBrands || isLoadingShops;

  return {
    products,
    brands,
    shops,
    isLoading,
  };
};

export default useFetchData;