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
  secondaryAction,
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
    <Box sx={{ minWidth: 0, ...sx }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          {icon ? (
            <Box sx={{
              display: "grid", placeItems: "center", flexShrink: 0,
              width: 36, height: 36, borderRadius: "10px",
              color: "primary.main", bgcolor: "action.selected",
            }}>
              {icon}
            </Box>
          ) : null}

          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="h5" sx={{
              fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, overflowWrap: "anywhere",
            }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                {subtitle}
              </Typography>
            ) : null}

            {summaryItems.length ? (
              <Stack
                component="dl" direction="row" spacing={1.75} useFlexGap flexWrap="wrap"
                sx={{ m: 0, mt: 0.75 }}
              >
                {summaryItems.map((item) => (
                  <Box key={item.label} sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                    <Typography component="dt" variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography component="dd" variant="caption" sx={{
                      m: 0, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    }}>{item.value}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Box>
        </Stack>

        {resolvedAction || secondaryAction ? (
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{
            flexShrink: 0,
            "& > .MuiButton-contained": { flex: { xs: 1, sm: "0 0 auto" }, whiteSpace: "nowrap" },
          }}>
            {secondaryAction}
            {resolvedAction}
          </Stack>
        ) : null}
      </Stack>

      {previewItems.length || emptyPreviewText ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          {previewItems.length ? (
            previewItems.map((label) => (
              <Chip key={label} label={label} size="small" variant="outlined" sx={{ maxWidth: 240 }} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">{emptyPreviewText}</Typography>
          )}
        </Stack>
      ) : null}
    </Box>
  );
}
