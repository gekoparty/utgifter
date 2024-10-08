import React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const TableRowItem = ({ item, onDelete, onEdit, headers, columnRenderers }) => {
  return (
    <TableRow
    >
      {headers.map((header) => {
        if (header === "Delete" || header === "Edit") {
          return (
            <TableCell key={header}>
              <IconButton
                aria-label={header.toLowerCase()}
                onClick={
                  header === "Delete"
                    ? () => onDelete(item)
                    : () => onEdit(item)
                }
                color={header === "Delete" ? "success" : "secondary"}
              >
                {header === "Delete" ? (
                  <DeleteIcon sx={{ fontSize: "inherit" }} />
                ) : (
                  <EditIcon sx={{ fontSize: "inherit" }} />
                )}
              </IconButton>
            </TableCell>
          );
        } else if (columnRenderers && columnRenderers[header]) {
          // Check if a custom renderer is defined for the column
          return (
            <TableCell key={header}>
              {columnRenderers[header](item)} {/* Use the custom renderer */}
            </TableCell>
          );
        } else {
          return (
            <TableCell key={header}>{item[header.toLowerCase()]}</TableCell>
          );
        }
      })}
    </TableRow>
  );
};

export default TableRowItem;
