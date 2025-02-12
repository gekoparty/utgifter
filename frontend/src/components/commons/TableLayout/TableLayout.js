import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minWidth: 600,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        flexDirection: "column", // Stack children vertically
        justifyContent: "center",
        alignItems: "stretch", // Make sure everything stretches
        backgroundColor: "#2C2C2C",
        padding: 2,
        borderRadius: 2,
        height: "100vh", // Force it to take full viewport height
      }}
      data-testid="table-layout"
    >
      <Box
        sx={{
          minWidth: 600,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1, // Let it expand fully
          backgroundColor: "#333",
          borderRadius: 1,
          width: "100%",
        }}
        data-testid="table-layout-container"
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;


  