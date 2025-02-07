import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        marginLeft: `${drawerWidth}px`,
        display: "grid",      // Use Grid
        gridTemplateColumns: "1fr", // One column that takes all space
        backgroundColor: "#2C2C2C",
        padding: 2,
        borderRadius: 2,
      }}
      data-testid="table-layout"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#333",
          borderRadius: 1,
          width: "100%", // Could be removed, grid takes care of sizing
        }}
        data-testid="table-layout-container"
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;

  