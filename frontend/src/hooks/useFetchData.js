import { useQuery } from '@tanstack/react-query';

const fetchProducts = async () => {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

const fetchBrands = async () => {
  const response = await fetch('/api/brands');
  if (!response.ok) {
    throw new Error('Failed to fetch brands');
  }
  return response.json();
};

const fetchShops = async () => {
  const response = await fetch('/api/shops');
  if (!response.ok) {
    throw new Error('Failed to fetch shops');
  }
  const shops = await response.json();

  // Fetch locations for each shop
  const shopsWithLocations = await Promise.all(
    shops.map(async (shop) => {
      const locationResponse = await fetch(`/api/locations/${shop.location}`);
      if (!locationResponse.ok) {
        throw new Error(
          `Failed to fetch location details for location: ${shop.location}`
        );
      }
      const location = await locationResponse.json();
      return { ...shop, locationName: location.name };
    })
  );

  return shopsWithLocations;
};

export const useFetchProducts = (enabled) => {
  return useQuery(['products'], fetchProducts, { enabled });
};

export const useFetchBrands = (enabled) => {
  return useQuery(['brands'], fetchBrands, { enabled });
};

export const useFetchShops = (enabled) => {
  return useQuery(['shops'], fetchShops, { enabled });
};