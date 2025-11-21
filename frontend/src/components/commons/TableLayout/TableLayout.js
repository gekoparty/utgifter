import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: 3,
        padding: 4,
        width: "100%",
        maxWidth: 1200,
        minWidth: 600,
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
};
export default TableLayout;
