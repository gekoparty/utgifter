import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ThemeModeSwitch from "../components/commons/ThemeModeSwitch";

export default function LoginScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, login, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const from = location.state?.from?.pathname || "/";

  const title = isSignup ? "Opprett bruker" : "Logg inn";
  const subtitle = isSignup
    ? "Første bruker blir administrator. Nye brukere får vanlig tilgang."
    : "Logg inn for å se og registrere utgifter.";

  const canSubmit = useMemo(
    () =>
      form.email.trim() &&
      form.password.length >= 8 &&
      (!isSignup || form.name.trim()),
    [form.email, form.name, form.password, isSignup],
  );

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signUp(form);
      } else {
        await login(form);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Kunne ikke logge inn.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        variant="outlined"
        sx={{
          width: "min(100%, 430px)",
          p: { xs: 2.25, sm: 3 },
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2.25}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack spacing={0.75}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  color: "primary.contrastText",
                  bgcolor: "primary.main",
                }}
              >
                <LockOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={950}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              </Box>
            </Stack>
            <ThemeModeSwitch />
          </Stack>

          {loading ? <CircularProgress size={22} /> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {isSignup ? (
            <TextField
              label="Navn"
              value={form.name}
              onChange={handleChange("name")}
              fullWidth
            />
          ) : null}

          <TextField
            label="E-post"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            autoComplete="email"
            fullWidth
          />

          <TextField
            label="Passord"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            autoComplete={isSignup ? "new-password" : "current-password"}
            helperText={isSignup ? "Minst 8 tegn." : ""}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!canSubmit || submitting || loading}
            sx={{ textTransform: "none", fontWeight: 900 }}
          >
            {submitting ? "Jobber..." : isSignup ? "Opprett bruker" : "Logg inn"}
          </Button>

          <Button
            type="button"
            variant="text"
            onClick={() => {
              setError("");
              setMode(isSignup ? "login" : "signup");
            }}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            {isSignup ? "Har du bruker? Logg inn" : "Ny bruker? Opprett konto"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
