import React from "react";
import { Box, Paper, Stack } from "@mui/material";
import PageHeader from "./PageHeader";

export default function AppScreen({
  title,
  subtitle,
  icon,
  action,
  actionLabel,
  actionIcon,
  onAction,
  summaryItems = [],
  filters,
  toolbar,
  children,
  maxWidth = 1280,
  contentSx,
  headerSx,
  filterSx,
}) {
  const filterContent = filters ?? toolbar;

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "background.default",
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.5, md: 2.5 },
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: "100%",
          maxWidth,
          mx: "auto",
          ...contentSx,
        }}
      >
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          action={action}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          onAction={onAction}
          summaryItems={summaryItems}
          sx={{ mb: 0, ...headerSx }}
        />

        {filterContent ? (
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 0.75,
              borderRadius: 2,
              boxShadow: "none",
              bgcolor: "background.paper",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(15,23,42,0.10)",
              ...filterSx,
            })}
          >
            {filterContent}
          </Paper>
        ) : null}

        {children}
      </Stack>
    </Box>
  );
}
