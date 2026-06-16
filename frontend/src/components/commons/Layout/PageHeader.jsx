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
        p: { xs: 2, md: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(31,41,55,0.56) 62%)"
            : "linear-gradient(135deg, rgba(25,118,210,0.10), rgba(255,255,255,0.78) 62%)",
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
                width: 44,
                height: 44,
                borderRadius: 1.5,
                color: "primary.contrastText",
                bgcolor: "primary.main",
              }}
            >
              {icon}
            </Box>
          ) : null}

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 850, lineHeight: 1.1 }}>
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
                borderRadius: 1.5,
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
