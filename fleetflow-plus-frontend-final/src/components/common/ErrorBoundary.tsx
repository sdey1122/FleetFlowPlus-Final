import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
export default class ErrorBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h4">Something went off route.</Typography>
        <Button onClick={() => location.reload()}>Reload page</Button>
      </Box>
    ) : (
      this.props.children
    );
  }
}
