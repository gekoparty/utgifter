import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function SectionCard({
  title,
  subtitle,
  action,
  icon,
  children,
  sx,
  contentSx,
  compact = false,
}) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        borderRadius: 2,
        bgcolor: "background.paper",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(15,23,42,0.10)",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.024), rgba(255,255,255,0.006))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.76))",
        boxShadow: "none",
        height: "100%",
        ...sx,
      })}
    >
      <CardContent
        sx={{
          p: compact ? 1.25 : 1.75,
          "&:last-child": { pb: compact ? 1.25 : 1.75 },
          ...contentSx,
        }}
      >
        {(title || subtitle || action || icon) && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1.5}
            sx={{ mb: children ? 1.25 : 0 }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
              {icon ? (
                <Box
                  sx={{
                    color: "primary.main",
                    display: "grid",
                    placeItems: "center",
                    mt: 0.15,
                    width: compact ? 28 : 32,
                    height: compact ? 28 : 32,
                    borderRadius: 1.5,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Box>
              ) : null}
              <Box sx={{ minWidth: 0 }}>
                {title ? (
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {title}
                  </Typography>
                ) : null}
                {subtitle ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
            {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
