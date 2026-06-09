import React, { Component } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { getFriendlyErrorMessage } from "./commons/ErrorHandling/errorMessages";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { error, hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={this.handleReset}>
                Prøv igjen
              </Button>
            }
          >
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>
              Appen støtte på en feil.
            </Typography>
            {getFriendlyErrorMessage(this.state.error, "global")}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
