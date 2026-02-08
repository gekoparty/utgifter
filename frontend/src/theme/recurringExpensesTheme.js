// src/theme/RecurringExpensesTheme.js
import { createTheme } from "@mui/material/styles";
import { dashboardTheme } from "./dashboardTheme";

/**
 * Screen-scoped theme: extends your existing dashboardTheme
 * without changing it. Safe for the rest of the app.
 */
export const recurringExpensesTheme = createTheme(dashboardTheme, {
  components: {
    // Keep your dashboardTheme overrides, add/override only what this screen needs.
    MuiCard: {
      styleOverrides: {
        root: {
          // Slightly more "dashboard card" feel, but consistent with your existing dark UI
          borderRadius: 16,
          overflow: "hidden",
        },
      },
    },

    MuiCardContent: {
  styleOverrides: {
    root: {
      padding: 22,
      "&:last-child": {
        paddingBottom: 22,
      },
    },
  },
},

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          // Helps the "1 stk" chip stay compact and aligned
          maxWidth: "100%",
        },
        sizeSmall: {
          height: 22,
        },
        labelSmall: {
          paddingLeft: 8,
          paddingRight: 8,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 36,
          paddingTop: 6,
          paddingBottom: 6,
          fontWeight: 800,
        },
      },
    },

    MuiListItem: {
      styleOverrides: {
        root: {
          // Stops cramped list items (esp. with secondaryAction)
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
  },
});
