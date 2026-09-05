import React from "react";
import { Box, Stack } from "@mui/material";

export default function PageLayout({
  children,
  maxWidth = 1280,
  spacing = 2,
  sx,
  contentSx,
}) {
  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "background.default",
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.5, md: 2.5 },
        ...sx,
      }}
    >
      <Stack
        spacing={spacing}
        sx={{
          width: "100%",
          maxWidth,
          mx: "auto",
          ...contentSx,
        }}
      >
        {children}
      </Stack>
    </Box>
  );
}
