import React, { useState } from "react";
import {
  Alert,
  Box,
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
import PageHeader from "../components/commons/Layout/PageHeader";
import KpiCard from "../components/commons/DataDisplay/KpiCard";
import SectionCard from "../components/commons/Layout/SectionCard";
import { requestJson } from "../api/httpClient";
import { useAuth } from "../auth/AuthContext";

export default function AccountScreen() {
  const { user, appUser, refreshAppUser, refreshSession } = useAuth();
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
      setProfileMessage("Profilen er oppdatert.");
    } catch (error) {
      setProfileError(error.message || "Kunne ikke lagre profil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("Nytt passord må ha minst 8 tegn.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordError("Passordene er ikke like.");
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
      setPasswordMessage("Passordet er endret.");
    } catch (error) {
      setPasswordError(error.message || "Kunne ikke endre passord.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Min konto"
        subtitle="Administrer profil og innlogging."
        icon={<ManageAccountsIcon />}
      />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard label="E-post" value={user?.email || "Ukjent"} subtext="Innloggingskonto" icon={<PersonIcon />} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Rolle" value={appUser?.role === "admin" ? "Administrator" : "Bruker"} subtext="Tilgangsnivå" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Bruker-ID" value={appUser?.id?.slice(-8) || "-"} subtext="Intern eier-id" />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Profil" subtitle="Navnet vises i admin og kontooversikt." icon={<PersonIcon />}>
            <Stack spacing={2}>
              {profileMessage ? <Alert severity="success">{profileMessage}</Alert> : null}
              {profileError ? <Alert severity="error">{profileError}</Alert> : null}
              <TextField
                label="Navn"
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
                Lagre profil
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Passord" subtitle="Endre passord for din egen konto." icon={<LockResetIcon />}>
            <Stack spacing={2}>
              {passwordMessage ? <Alert severity="success">{passwordMessage}</Alert> : null}
              {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
              <TextField
                label="Nåværende passord"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                fullWidth
              />
              <TextField
                label="Nytt passord"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                fullWidth
              />
              <TextField
                label="Gjenta nytt passord"
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
                label="Logg ut andre økter"
              />
              <Button
                variant="contained"
                onClick={changePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !repeatPassword}
                sx={{ alignSelf: "flex-start" }}
              >
                Endre passord
              </Button>
              <Typography variant="caption" color="text.secondary">
                Minst 8 tegn.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
