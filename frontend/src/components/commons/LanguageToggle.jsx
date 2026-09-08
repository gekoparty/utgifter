import React from "react";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { requestJson } from "../../api/httpClient";
import { useAppPreferences } from "../../store/Store";
import { useAuth } from "../../auth/useAuth";
import { useTranslation } from "../../i18n/useTranslation";

export default function LanguageToggle() {
  const { preferences, setPreference } = useAppPreferences();
  const { refreshAppUser } = useAuth();
  const { t } = useTranslation();
  const language = preferences.language === "en" ? "en" : "nb";

  const handleChange = async (_event, nextLanguage) => {
    if (!nextLanguage || nextLanguage === language) return;

    setPreference("language", nextLanguage);
    try {
      await requestJson("/api/app-users/me", {
        method: "PATCH",
        data: { preferences: { language: nextLanguage } },
      });
      await refreshAppUser?.();
    } catch {
      setPreference("language", language);
    }
  };

  return (
    <Tooltip title={t("language")}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={language}
        onChange={handleChange}
        aria-label={t("language")}
        sx={{
          bgcolor: "action.hover",
          borderRadius: 999,
          p: 0.25,
          "& .MuiToggleButton-root": {
            border: 0,
            borderRadius: 999,
            px: 1,
            py: 0.25,
            fontSize: 12,
            fontWeight: 900,
            lineHeight: 1.3,
          },
        }}
      >
        <ToggleButton value="nb" aria-label={t("norwegian")}>
          NO
        </ToggleButton>
        <ToggleButton value="en" aria-label={t("english")}>
          EN
        </ToggleButton>
      </ToggleButtonGroup>
    </Tooltip>
  );
}
