import React from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";

export default function PageHeader({
  title,
  subtitle,
  icon,
  action,
  actionLabel,
  actionIcon,
  onAction,
  summaryItems = [],
  previewItems = [],
  emptyPreviewText,
  sx,
}) {
  const resolvedAction =
    action ??
    (actionLabel ? (
      <Button variant="contained" startIcon={actionIcon} onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <Box
      sx={(theme) => ({
        mb: 2,
        p: { xs: 1.75, md: 2.25 },
        border: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.13)"
            : "rgba(15,23,42,0.10)",
        borderRadius: 2,
        backgroundColor: "background.paper",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.76))",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 28px rgba(0,0,0,0.18)"
            : "0 10px 28px rgba(15,23,42,0.055)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          width: 4,
          right: "auto",
          backgroundColor: theme.palette.primary.main,
        },
        ...sx,
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          {icon ? (
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                width: 42,
                height: 42,
                borderRadius: 1.5,
                color: "primary.contrastText",
                bgcolor: "primary.main",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 8px 18px rgba(79,140,255,0.22)"
                    : "0 8px 16px rgba(36,87,214,0.14)",
              }}
            >
              {icon}
            </Box>
          ) : null}

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.08 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        {resolvedAction ? (
          <Box sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, "& > .MuiButton-root": { width: { xs: "100%", md: "auto" } } }}>
            {resolvedAction}
          </Box>
        ) : null}
      </Stack>

      {summaryItems.length ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
          {summaryItems.map((item) => (
            <Chip
              key={item.label}
              label={`${item.label}: ${item.value}`}
              variant={item.value ? "filled" : "outlined"}
            sx={{
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: item.value ? "action.selected" : "transparent",
              }}
            />
          ))}
        </Stack>
      ) : null}

      {previewItems.length || emptyPreviewText ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
          {previewItems.length ? (
            previewItems.map((label) => (
              <Chip key={label} label={label} size="small" variant="outlined" sx={{ maxWidth: 240 }} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              {emptyPreviewText}
            </Typography>
          )}
        </Stack>
      ) : null}
    </Box>
  );
}
