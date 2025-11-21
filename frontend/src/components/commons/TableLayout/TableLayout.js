import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
  sx={{
    backgroundColor: "background.paper",
    borderRadius: 3,
    padding: 4,
    width: "100%",
    maxWidth: 1200,
    minWidth: 600,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  }}
>
  {children}
</Box>
  );
};
export default TableLayout;
