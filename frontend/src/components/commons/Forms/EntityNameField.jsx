import React from "react";
import { TextField } from "@mui/material";
import FieldErrorText from "../ErrorHandling/FieldErrorText";
import FormErrorAlert from "../ErrorHandling/FormErrorAlert";

export default function EntityNameField({
  resource,
  label,
  value,
  error,
  disabled,
  onChange,
  showFormError,
  autoFocus = true,
}) {
  return (
    <>
      {showFormError ? <FormErrorAlert resource={resource} /> : null}
      <TextField
        autoFocus={autoFocus}
        fullWidth
        size="small"
        label={label}
        value={value || ""}
        error={Boolean(error)}
        disabled={disabled}
        onChange={onChange}
      />
      {(showFormError || error) ? (
        <FieldErrorText resource={resource} field="name" />
      ) : null}
    </>
  );
}
