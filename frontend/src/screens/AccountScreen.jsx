import React, { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonIcon from "@mui/icons-material/Person";
import AppScreen from "../components/commons/Layout/AppScreen";
import KpiCard from "../components/commons/DataDisplay/KpiCard";
import SectionCard from "../components/commons/Layout/SectionCard";
import { requestJson } from "../api/httpClient";
import { useAuth } from "../auth/useAuth";
import { useTranslation } from "../i18n/useTranslation";

export default function AccountScreen() {
  const { user, appUser, refreshAppUser, refreshSession } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(appUser?.name || user?.name || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  React.useEffect(() => {
    setName(appUser?.name || user?.name || "");
  }, [appUser?.name, user?.name]);

  const saveProfile = async () => {
    setProfileError("");
    setProfileMessage("");
    setProfileSaving(true);
    try {
      await requestJson("/api/app-users/me", {
        method: "PATCH",
        data: { name: name.trim() },
      });
      await requestJson("/api/auth/update-user", {
        method: "POST",
        data: { name: name.trim() },
      }).catch(() => null);
      await refreshAppUser();
      await refreshSession();
      setProfileMessage(t("account.profileSaved"));
    } catch (error) {
      setProfileError(error.message || t("account.profileSaveFailed"));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError(t("account.passwordMinError"));
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordError(t("account.passwordMatchError"));
      return;
    }

    setPasswordSaving(true);
    try {
      await requestJson("/api/auth/change-password", {
        method: "POST",
        data: {
          currentPassword,
          newPassword,
          revokeOtherSessions,
        },
      });
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordMessage(t("account.passwordSaved"));
    } catch (error) {
      setPasswordError(error.message || t("account.passwordFailed"));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AppScreen
      title={t("account.title")}
      subtitle={t("account.subtitle")}
      icon={<ManageAccountsIcon />}
      summaryItems={[
        { label: t("account.role"), value: appUser?.role === "admin" ? t("account.admin") : t("account.user") },
        { label: t("account.email"), value: user?.email || t("common.unknown") },
      ]}
      maxWidth={1360}
    >
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard label={t("account.email")} value={user?.email || t("common.unknown")} subtext={t("account.loginAccount")} icon={<PersonIcon />} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label={t("account.role")} value={appUser?.role === "admin" ? t("account.admin") : t("account.user")} subtext={t("account.accessLevel")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label={t("account.userId")} value={appUser?.id?.slice(-8) || "-"} subtext={t("account.internalOwnerId")} />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <SectionCard title={t("account.profile")} subtitle={t("account.profileSubtitle")} icon={<PersonIcon />}>
            <Stack spacing={2}>
              {profileMessage ? <Alert severity="success">{profileMessage}</Alert> : null}
              {profileError ? <Alert severity="error">{profileError}</Alert> : null}
              <TextField
                label={t("common.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={saveProfile}
                disabled={profileSaving || !name.trim()}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("account.saveProfile")}
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title={t("account.password")} subtitle={t("account.passwordSubtitle")} icon={<LockResetIcon />}>
            <Stack spacing={2}>
              {passwordMessage ? <Alert severity="success">{passwordMessage}</Alert> : null}
              {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
              <TextField
                label={t("account.currentPassword")}
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("account.newPassword")}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("account.repeatPassword")}
                type="password"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={revokeOtherSessions}
                    onChange={(event) => setRevokeOtherSessions(event.target.checked)}
                  />
                }
                label={t("account.revokeOtherSessions")}
              />
              <Button
                variant="contained"
                onClick={changePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !repeatPassword}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("account.changePassword")}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t("account.minPassword")}
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </AppScreen>
  );
}
