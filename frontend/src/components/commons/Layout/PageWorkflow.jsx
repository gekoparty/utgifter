import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function PageWorkflow({
  question,
  answer,
  steps = [],
  action,
  sx,
}) {
  if (!question && !answer && !steps.length && !action) return null;

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: { xs: 1.25, md: 1.5 },
        borderRadius: 2,
        boxShadow: "none",
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.035)"
            : "rgba(248,250,252,0.9)",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.10)"
            : "rgba(15,23,42,0.09)",
        ...sx,
      })}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          {question ? (
            <Typography variant="subtitle2" fontWeight={950}>
              {question}
            </Typography>
          ) : null}
          {answer ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {answer}
            </Typography>
          ) : null}
        </Box>

        {steps.length ? (
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            sx={{ justifyContent: { xs: "flex-start", lg: "flex-end" } }}
          >
            {steps.map((step, index) => (
              <Chip
                key={`${step}-${index}`}
                size="small"
                icon={index > 0 ? <ArrowForwardRoundedIcon /> : undefined}
                label={step}
                variant={index === 0 ? "filled" : "outlined"}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 800,
                  maxWidth: { xs: "100%", sm: 260 },
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            ))}
          </Stack>
        ) : null}

        {action ? <Box sx={{ flex: "0 0 auto" }}>{action}</Box> : null}
      </Stack>
    </Paper>
  );
}
