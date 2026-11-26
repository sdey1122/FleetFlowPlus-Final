import { Box, CircularProgress, Typography } from "@mui/material";
export default function Loading() {
  return (
    <Box
      role="status"
      sx={{
        minHeight: 160,
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={26} />
      <Typography variant="body2">Getting things ready…</Typography>
    </Box>
  );
}
