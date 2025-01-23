import { Box } from "@mui/material";

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
      data-testid="table-layout"
    >
      <Box
        sx={{ width: "100%", maxWidth: "1000px" }}
        data-testid="table-layout-container"
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;

  