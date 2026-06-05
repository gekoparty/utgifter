import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Box,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const BasicDialog = ({
  open,
  onClose,
  children,
  cancelButton,
  confirmButton,
  dialogTitle,
  maxWidth = "lg",
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      disableEnforceFocus
      disableAutoFocus
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "stretch", sm: "center" },
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(5px)",
            backgroundColor: "rgba(0,0,0,0.55)",
          },
        },
        paper: {
          sx: {
            m: { xs: 0, sm: 4 },
            width: { xs: "100%", sm: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", sm: undefined },
            borderRadius: { xs: 0, sm: 2 },
            bgcolor: "background.paper",
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.12)",
            boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
            overflow: "hidden",
            maxHeight: { xs: "100dvh", sm: "92vh" },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2.25 },
          pr: { xs: 6, sm: 7 },
          fontWeight: 800,
          fontSize: { xs: "1.125rem", sm: "1.55rem" },
          letterSpacing: 0,
          borderBottom: "1px solid",
          borderColor: "rgba(255,255,255,0.1)",
          position: "relative",
          lineHeight: 1.25,
        }}
      >
        {dialogTitle}

        <IconButton
          onClick={handleClose}
          size="small"
          aria-label="Lukk dialog"
          sx={{
            position: "absolute",
            right: { xs: 12, sm: 18 },
            top: "50%",
            transform: "translateY(-50%)",
            color: "text.secondary",
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.1)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.08)",
              color: "text.primary",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 1, sm: 2.5 },
          py: { xs: 1.25, sm: 2.5 },
          bgcolor: "rgba(0,0,0,0.08)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.28)",
          },
        }}
      >
        <Box>
          <Stack spacing={2}>{children}</Stack>
        </Box>
      </DialogContent>

      {(cancelButton || confirmButton) && (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            bgcolor: "rgba(255,255,255,0.025)",
            borderTop: "1px solid",
            borderColor: "rgba(255,255,255,0.1)",
            "& .MuiButton-root": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          {cancelButton}
          {confirmButton}
        </DialogActions>
      )}
    </Dialog>
  );
};

BasicDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  confirmButton: PropTypes.element,
  cancelButton: PropTypes.element,
  dialogTitle: PropTypes.string.isRequired,
  maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", false]),
};

export default BasicDialog;
