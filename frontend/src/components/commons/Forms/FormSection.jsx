import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function FormSection({ title, description, step, children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: 2,
        bgcolor: "background.paper",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.012))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.70))",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        ...sx,
      })}
    >
      {title ? (
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="flex-start"
          sx={{
            mb: 2,
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {step ? (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.25,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 950,
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              {step}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 900,
                color: "text.primary",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {description ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      ) : null}
      {children}
    </Paper>
  );
}
