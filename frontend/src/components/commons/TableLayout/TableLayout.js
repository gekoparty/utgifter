import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        marginLeft: `${drawerWidth}px`,
        padding: 3,
        minHeight: "100vh",
        backgroundColor: "#F5F5F5", // Light gray background
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#FFFFFF", // White card-style box
          borderRadius: 2,
          boxShadow: 1,
          padding: 3,
          flexGrow: 1,
          width: "100%",
          minWidth: 600,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;
