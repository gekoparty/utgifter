import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function SectionCard({
  title,
  subtitle,
  action,
  icon,
  children,
  sx,
  contentSx,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper",
        height: "100%",
        ...sx,
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 }, ...contentSx }}>
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
                <Box sx={{ color: "primary.main", display: "grid", placeItems: "center", mt: 0.15 }}>
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
