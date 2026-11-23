import React, { useId, useState } from "react";
import { Box, Button, Popover, Stack, Typography } from "@mui/material";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { useTranslation } from "../../../i18n/useTranslation";

export default function PageWorkflow({ question, answer, steps = [], action, sx }) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const open = Boolean(anchor);

  if (!question && !answer && !steps.length && !action) return null;

  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={<HelpOutlineRoundedIcon fontSize="small" />}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
      >
        {t("common.pageHelp")}
      </Button>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: {
          mt: 1, width: 380, maxWidth: "calc(100vw - 32px)", borderRadius: "12px",
          border: "1px solid", borderColor: "divider",
        } } }}
      >
        <Stack id={id} role="dialog" aria-labelledby={question ? `${id}-title` : undefined}
          aria-label={question ? undefined : t("common.pageHelp")} spacing={1.25} sx={{ p: 2, ...sx }}>
          {question && <Typography id={`${id}-title`} variant="subtitle2" fontWeight={750}>{question}</Typography>}
          {answer && <Typography variant="body2" color="text.secondary">{answer}</Typography>}
          {steps.length > 0 && (
            <Box component="ol" sx={{ m: 0, pl: 2.25, "& li + li": { mt: 0.75 } }}>
              {steps.map((step, index) => (
                <Typography component="li" variant="body2" key={`${step}-${index}`}>{step}</Typography>
              ))}
            </Box>
          )}
          {action && <Box>{action}</Box>}
          <Button size="small" onClick={() => setAnchor(null)} sx={{ alignSelf: "flex-end" }}>
            {t("common.closeHelp")}
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
