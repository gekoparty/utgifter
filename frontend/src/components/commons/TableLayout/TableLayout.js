import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
        padding: 3,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4f8, #e6ebef)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // center horizontally
        width: "100%",        // full width, no margin
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#FAFAFA",
          borderRadius: 3,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
          padding: 4,
          width: "100%",
          maxWidth: 1200,
          minWidth: 600,
          flexGrow: 0,
          height: "fit-content",
          border: "1px solid rgba(0,0,0,0.05)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
export default TableLayout;
