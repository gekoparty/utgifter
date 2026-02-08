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

function NextBillsCard({ nextBills, formatCurrency }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={900}>
          Neste forfall
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Sortert etter nærmeste dato
        </Typography>

        <List dense sx={{ p: 0 }}>
          {nextBills.map((b) => {
            const isPaid = b.status === "PAID";

            // ✅ normalize type for label lookup
            const typeKey = normalizeRecurringType(b.type);
            const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? b.type;

            return (
              <React.Fragment key={`${b.recurringExpenseId}-${String(b.dueDate)}`}>
                <ListItem
                  sx={{ px: 1, pr: 10, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
                  secondaryAction={
                    <Typography fontWeight={900} noWrap>
                      {formatCurrency(b.expectedMax ?? 0)}
                    </Typography>
                  }
                >
                  <Avatar sx={{ width: 30, height: 30, mr: 1 }}>
                    <ReceiptLong fontSize="small" />
                  </Avatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap sx={{ minWidth: 0 }}>
                          {b.title}
                        </Typography>
                        {isPaid && <Chip size="small" label="Betalt" color="success" />}
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {typeLabel} {" • "} {dueShortLabel(b.dueDate)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider sx={{ opacity: 0.4 }} />
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

export default memo(NextBillsCard);
