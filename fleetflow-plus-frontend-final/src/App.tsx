import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Toaster } from "sonner";
import { store } from "./redux/store";
import { router } from "./routes/AppRoutes";
import { theme } from "./theme/theme";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </Provider>
  );
}
