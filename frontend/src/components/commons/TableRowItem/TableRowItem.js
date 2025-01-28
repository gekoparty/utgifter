import React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// TableRowItem component
const TableRowItem = ({ item, onDelete, onEdit, columns }) => {
  return (
    <>
      {/* Render Table Header */}
      <TableRow data-testid="table-header">
        {columns.map((column) => {
          const { id, header, renderEditDelete, flexGrow, size, minSize, maxSize } = column;

          if (header) {
            return (
              <TableCell
                key={`header-${id}`}
                data-testid={`table-cell-header-${id}`}
                sx={{
                  flexGrow: flexGrow || 1,
                  minWidth: minSize || size || 150, // Set a default min size
                  maxWidth: maxSize || size || 200, // Set a default max size
                  textAlign: "center",
                  backgroundColor: "#333", // Dark grey for the header
                  color: "#fff", // White text color for contrast
                  fontWeight: "bold", // Bold font for the header // Align header text (optional)
                }}
              >
                {header} {/* This is where you show the column header */}
              </TableCell>
            );
          }
          return null; // In case there's no header defined, just skip
        })}
      </TableRow>

      {/* Render Table Row */}
      <TableRow data-testid="table-row">
        {columns.map((column) => {
          const {
            id,
            accessorKey,
            renderEditDelete,
            Cell,
            flexGrow,
            size,
            minSize,
            maxSize,
          } = column;

          // If the column has edit/delete actions
          if (renderEditDelete) {
            return (
              <TableCell
                key={id}
                data-testid={`table-cell-${id}`}
                sx={{
                  flexGrow: flexGrow || 1,
                  minWidth: minSize || size || 150,
                  maxWidth: maxSize || size || 200,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  backgroundColor: "#444", // Greyish background for data cells
                  color: "#fff", // White text for better readability
                }}
              >
                <IconButton
                  aria-label="edit"
                  onClick={() => onEdit(item)}
                  color="secondary"
                  data-testid="edit-button"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => onDelete(item)}
                  color="error"
                  data-testid="delete-button"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            );
          }

          // If the column has a custom cell renderer (Cell)
          if (Cell) {
            return (
              <TableCell
                key={id}
                data-testid={`table-cell-${id}`}
                sx={{
                  size: 200,
                  flexGrow: flexGrow || 1,
                  minWidth: minSize || size || 150,
                  maxWidth: maxSize || size || 200,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  backgroundColor: "#444", // Greyish background for data cells
                  color: "#fff", // White text for better readability
                }}
              >
                {Cell({ row: item })} {/* Custom cell content */}
              </TableCell>
            );
          }

          // Default behavior for regular columns
          return (
            <TableCell
              key={id}
              data-testid={`table-cell-${id}`}
              sx={{
                flexGrow: flexGrow || 0,
                minWidth: minSize || size || 150,
                maxWidth: maxSize || size || 200,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                backgroundColor: "#444", // Greyish background for data cells
                color: "#fff", // White text for better readability
              }}
            >
              {item[accessorKey]} {/* Default value for column */}
            </TableCell>
          );
        })}
      </TableRow>
    </>
  );
};

export default TableRowItem;
