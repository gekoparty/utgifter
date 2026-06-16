import React from "react";
import { Box, FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import FieldLabel from "../../../../../components/commons/Forms/FieldLabel";
import FormSection from "../../../../../components/commons/Forms/FormSection";

export default function StatusDateSection({ expense, controller }) {
  return (
    <FormSection title="Status og dato">
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box flex={1}>
          <FieldLabel>Status</FieldLabel>
          <RadioGroup
            row
            value={expense.purchased ? "kjøpt" : "registrert"}
            onChange={controller.handleTransactionType}
            sx={{
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
              "& .MuiFormControlLabel-root": {
                m: 0,
                px: 2,
                py: 1,
                minWidth: { xs: "100%", sm: 140 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.14)",
                bgcolor: "rgba(255,255,255,0.035)",
              },
              "& .MuiFormControlLabel-root:has(.Mui-checked)": {
                borderColor: "primary.main",
                bgcolor: "rgba(59,130,246,0.16)",
              },
            }}
          >
            <FormControlLabel value="kjøpt" control={<Radio />} label="Kjøpt" />
            <FormControlLabel
              value="registrert"
              control={<Radio />}
              label="Registrert"
            />
          </RadioGroup>
        </Box>

        <Box flex={1}>
          <DatePicker
            label="Dato"
            value={controller.pickerDate}
            onChange={controller.handleDateChange}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Box>
      </Stack>
    </FormSection>
  );
}
