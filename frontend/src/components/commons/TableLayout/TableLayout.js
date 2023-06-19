import {
    Box,
  } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
    return (
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: `${drawerWidth}px`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "800px" }}>
          {children}
        </Box>
      </Box>
    );
  };

  export default TableLayout;

  