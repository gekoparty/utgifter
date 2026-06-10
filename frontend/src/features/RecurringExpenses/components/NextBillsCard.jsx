import React, { memo } from "react";
import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { ReceiptLong } from "@mui/icons-material";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";
import { dueShortLabel } from "../utils/recurringFormatters";

function NextBillsCard({ nextBills = [], formatCurrency }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
        <Typography variant="h6" fontWeight={900}>
          Neste forfall
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Regninger som kommer først.
        </Typography>

        {nextBills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ingen kommende forfall i valgt periode.
          </Typography>
        ) : (
          <List dense sx={{ p: 0 }}>
            {nextBills.map((b) => {
              const isPaid = b.status === "PAID";
              const typeKey = normalizeRecurringType(b.type);
              const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? b.type;

              return (
                <React.Fragment key={`${b.recurringExpenseId}-${String(b.dueDate)}`}>
                  <ListItem
                    sx={{
                      px: 1,
                      pr: { xs: 1, sm: 10 },
                      borderRadius: 2,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    secondaryAction={
                      <Typography
                        fontWeight={900}
                        noWrap
                        sx={{ display: { xs: "none", sm: "block" } }}
                      >
                        {formatCurrency(b.expectedMax ?? 0)}
                      </Typography>
                    }
                  >
                    <Avatar sx={{ width: 30, height: 30, mr: 1 }}>
                      <ReceiptLong fontSize="small" />
                    </Avatar>

                    <ListItemText
                      primary={
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 0.25, sm: 1 }}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          sx={{ minWidth: 0 }}
                        >
                          <Typography fontWeight={800} noWrap sx={{ minWidth: 0 }}>
                            {b.title}
                          </Typography>
                          {isPaid && <Chip size="small" label="Betalt" color="success" />}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {typeLabel} - {dueShortLabel(b.dueDate)} -{" "}
                          <strong>{formatCurrency(b.expectedMax ?? 0)}</strong>
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ opacity: 0.4 }} />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(NextBillsCard);
