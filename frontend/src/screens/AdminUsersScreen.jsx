import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../components/commons/Layout/PageHeader";
import KpiCard from "../components/commons/DataDisplay/KpiCard";
import SectionCard from "../components/commons/Layout/SectionCard";
import { requestJson } from "../api/httpClient";
import { useAuth } from "../auth/useAuth";

const DATA_LABELS = {
  expenses: "Utgifter",
  products: "Produkter",
  brands: "Merker",
  shops: "Butikker",
  variants: "Varianter",
  categories: "Kategorier",
  locations: "Steder",
  recurringExpenses: "Faste kostnader",
  recurringPayments: "Betalinger",
  recurringTerms: "Vilkår",
  receiptAliases: "Kvitteringslæring",
};

const fetchUsers = () => requestJson("/api/app-users");

const updateUser = ({ id, name, role }) =>
  requestJson(`/api/app-users/${id}`, {
    method: "PATCH",
    data: { name, role },
  });

const deleteUser = ({ id, deleteData }) =>
  requestJson(`/api/app-users/${id}?deleteData=${deleteData ? "1" : "0"}`, {
    method: "DELETE",
  });

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("no-NO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Ukjent";

const dataRows = (summary) =>
  Object.entries(summary?.byType ?? {})
    .map(([key, count]) => ({ key, label: DATA_LABELS[key] ?? key, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

function UserDataSummary({ summary }) {
  const rows = dataRows(summary);
  if (!rows.length) return <Typography color="text.secondary">Ingen data.</Typography>;

  return (
    <Stack spacing={0.75}>
      {rows.slice(0, 6).map((row) => (
        <Stack key={row.key} direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {row.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {row.count}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function EditUserDialog({ user, open, onClose, onSave, loading, error }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");

  React.useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setRole(user.role || "user");
  }, [user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rediger bruker</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          <TextField
            label="Navn"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Rolle"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            fullWidth
          >
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="user">Bruker</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button
          variant="contained"
          disabled={loading || !name.trim()}
          onClick={() => onSave({ id: user.id, name: name.trim(), role })}
        >
          Lagre
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteUserDialog({ user, open, onClose, onConfirm, loading, error }) {
  const [deleteData, setDeleteData] = useState(false);
  const total = user?.dataSummary?.total ?? 0;

  React.useEffect(() => {
    if (open) setDeleteData(false);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Slett bruker</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          <Alert severity="warning">
            Dette sletter innloggingen til {user?.email}. Brukerens egne data slettes bare hvis du velger det under.
          </Alert>
          <SectionCard title="Data som tilhører brukeren" contentSx={{ p: 1.5 }}>
            <UserDataSummary summary={user?.dataSummary} />
          </SectionCard>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteData}
                onChange={(event) => setDeleteData(event.target.checked)}
              />
            }
            label={`Slett også brukerens data (${total} poster)`}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button
          color="error"
          variant="contained"
          disabled={loading}
          onClick={() => onConfirm({ id: user.id, deleteData })}
        >
          Slett bruker
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminUsersScreen() {
  const { isAdmin, appUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "app-users"],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "app-users"] });
    queryClient.invalidateQueries({ queryKey: ["app-users", "me"] });
  };

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      setEditingUser(null);
      refreshUsers();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      setDeletingUser(null);
      refreshUsers();
    },
  });

  const users = data?.users ?? [];
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term),
    );
  }, [search, users]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const dataTotal = users.reduce((sum, user) => sum + (user.dataSummary?.total ?? 0), 0);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Kun administrator har tilgang.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Brukere"
        subtitle="Administrer roller, brukere og brukerdata."
        icon={<AdminPanelSettingsIcon />}
      />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Brukere" value={users.length} subtext="Registrerte kontoer" icon={<GroupIcon />} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Administratorer" value={adminCount} subtext="Har full tilgang" icon={<AdminPanelSettingsIcon />} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard label="Eide dataposter" value={dataTotal} subtext="På tvers av alle brukere" icon={<Inventory2Icon />} />
        </Grid>
      </Grid>

      <SectionCard
        title="Brukeroversikt"
        subtitle="Admin kan redigere roller og slette brukere. Sletting av data krever eget valg."
        icon={<PersonIcon />}
        action={
          <TextField
            size="small"
            placeholder="Søk"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
          />
        }
      >
        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
            <CircularProgress size={20} />
            <Typography>Laster brukere...</Typography>
          </Stack>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            Kunne ikke laste brukere.
          </Alert>
        ) : null}

        {!isLoading && !error ? (
          <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Bruker</TableCell>
                  <TableCell>Rolle</TableCell>
                  <TableCell align="right">Data</TableCell>
                  <TableCell>Opprettet</TableCell>
                  <TableCell align="right">Handling</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isSelf = String(user.id) === String(appUser?.id);
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 900 }}>{user.name || "Uten navn"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={user.role === "admin" ? "primary" : "default"}
                          label={user.role === "admin" ? "Administrator" : "Bruker"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title={
                            <Box sx={{ minWidth: 180 }}>
                              <UserDataSummary summary={user.dataSummary} />
                            </Box>
                          }
                        >
                          <Chip size="small" label={`${user.dataSummary?.total ?? 0} poster`} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Rediger">
                            <IconButton size="small" onClick={() => setEditingUser(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isSelf ? "Du kan ikke slette deg selv" : "Slett bruker"}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isSelf}
                                onClick={() => setDeletingUser(user)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {!filteredUsers.length ? (
              <>
                <Divider />
                <Typography color="text.secondary" sx={{ p: 2 }}>
                  Ingen brukere matcher søket.
                </Typography>
              </>
            ) : null}
          </Paper>
        ) : null}
      </SectionCard>

      <EditUserDialog
        user={editingUser}
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={(payload) => updateMutation.mutate(payload)}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />
      <DeleteUserDialog
        user={deletingUser}
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={(payload) => deleteMutation.mutate(payload)}
        loading={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </Box>
  );
}
