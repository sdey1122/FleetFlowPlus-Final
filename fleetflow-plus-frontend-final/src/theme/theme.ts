import { createTheme } from "@mui/material/styles";
import { colors as c } from "./palette";
export const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 576, md: 990, lg: 1200, xl: 1536 } },
  palette: {
    primary: { main: c.coral, contrastText: c.ink },
    secondary: { main: c.ink },
    background: { default: c.ivory, paper: c.paper },
    text: { primary: c.ink, secondary: c.muted },
    error: { main: c.deep },
  },
  typography: {
    fontFamily: '"DM Sans Variable", Arial, sans-serif',
    h1: {
      fontFamily: '"Manrope Variable", sans-serif',
      fontWeight: 800,
      letterSpacing: "-.065em",
    },
    h2: {
      fontFamily: '"Manrope Variable", sans-serif',
      fontWeight: 800,
      letterSpacing: "-.045em",
    },
    h3: {
      fontFamily: '"Manrope Variable", sans-serif',
      fontWeight: 750,
      letterSpacing: "-.035em",
    },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, minHeight: 42 } },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiOutlinedInput: { styleOverrides: { root: { background: c.paper } } },
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: "smooth" },
        body: { margin: 0 },
        "::selection": { background: c.soft, color: c.ink },
        "@media(prefers-reduced-motion: reduce)": {
          "*": {
            scrollBehavior: "auto !important",
            animationDuration: "0.01ms !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
  },
});
