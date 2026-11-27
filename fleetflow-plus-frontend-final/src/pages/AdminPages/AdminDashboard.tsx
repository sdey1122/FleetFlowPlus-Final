import { Box, Paper, Typography } from "@mui/material";
import { LayoutDashboard } from "lucide-react";
import { useAppSelector } from "../../hooks/useAppSelector";
import { colors as c } from "../../theme/palette";
export default function AdminDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Typography variant="overline" color="error.main">
        ADMIN WORKSPACE
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: 4, maxWidth: 720, display: "grid", gap: 2 }}
      >
        <LayoutDashboard size={36} color={c.deep} />
        <Typography variant="h4" fontWeight={850}>
          Welcome Admin.
        </Typography>
        <Typography color="text.secondary">
          Your admin operations will be available in a later development phase.
        </Typography>
      </Paper>
    </Box>
  );
}
