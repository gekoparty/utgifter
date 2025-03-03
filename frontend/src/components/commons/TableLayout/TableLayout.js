import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minWidth: 600,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        backgroundColor: "#2C2C2C",
        padding: 2,
        borderRadius: 2,
        height: "100vh",
      }}
    >
      <Box
        sx={{
          minWidth: 600,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          backgroundColor: "#333",
          borderRadius: 1,
          width: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;
  