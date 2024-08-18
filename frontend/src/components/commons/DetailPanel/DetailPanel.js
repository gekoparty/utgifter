import { CircularProgress, Alert, Stack } from "@mui/material";
import useExpenseForm from "../../Expenses/useExpenseForm";
import { useQuery } from "@tanstack/react-query";

// Define the DetailPanel component
const DetailPanel = ({ row }) => {
    const { expense, loading, error } = useExpenseForm(null, row.original._id);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

  const { shopName, brandName, locationName, ...otherDetails } = expense;


  return (
    <Stack gap="0.5rem" minHeight="100px">
      <div><b>Butikk:</b> {shopName}</div>
      <div><b>Merke:</b> {brandName}</div>
      <div><b>Sted:</b> {locationName}</div>
      {/* Render any other details you want to show */}
    </Stack>
  );
};

// Fetch additional expense details
const useFetchExpenseDetails = ({ expenseId }, options) => {
  const API_URL =
    process.env.NODE_ENV === "production"
      ? "https://www.material-react-table.com"
      : "http://localhost:3000";

  return useQuery({
    queryKey: ['expenseDetails', expenseId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/expense-details/${expenseId}`);
      return response.json();
    },
    ...options,
  });
};

export { DetailPanel };
