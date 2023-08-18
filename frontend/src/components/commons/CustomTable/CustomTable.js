import React from "react";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableRowItem from "../TableRowItem/TableRowItem";



const CustomTable = ({ data, headers, onDelete, onEdit, columnRenderers }) => {
  


  
  return (
    <Table size="small" aria-label="a dense table">
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableCell key={header}>{header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item) => (
          
          <TableRowItem
            key={item._id}
            item={{
              ...item, // Spread the properties of the product
            }}
            onDelete={onDelete}
            onEdit={onEdit}
            headers={headers}
            columnRenderers={columnRenderers} 
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default CustomTable;
