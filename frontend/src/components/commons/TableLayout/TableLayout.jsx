import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 2,
        p: 3,
        width: "100%",
        maxWidth: 1200,
        boxShadow: 1,
      }}
    >
      {children}
    </Box>
  );
};
export default TableLayout;
