import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        width: "100%",
        boxShadow: 1,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        // ✅ remove maxWidth because Container already controls width
        maxWidth: "none",
      }}
    >
      {children}
    </Box>
  );
};

export default TableLayout;