import React, { Component } from "react";
import ErrorHandling from "./commons/ErrorHandling/ErrorHandling";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error or send it to an error tracking service
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorHandling
          resource="global" // Set a global resource name for the ErrorHandling component
          loading={false} // Pass default value if no specific loading state is available
          field="" // Pass default value if no specific field is available
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;