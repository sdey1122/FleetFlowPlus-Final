import { Box, Container, Typography, Button } from "@mui/material";
import { LayoutDashboard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { Role } from "../../types/type/Role";
import { roleLabels } from "../../constants/roles";
import { colors as c } from "../../theme/palette";
export default function DashboardWelcome({ role }: { role: Role }) {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      <Box sx={{ borderBottom: `1px solid ${c.line}`, pb: 4 }}>
        <Typography
          variant="overline"
          sx={{
            color: c.deep,
            letterSpacing: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LayoutDashboard size={18} /> {roleLabels[role]} DASHBOARD
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 52 }, mt: 2 }}>
          Welcome {roleLabels[role]}
          {role === "admin" ? "" : `: ${user?.name || ""}`}
        </Typography>
      </Box>
      <Button
        component={Link}
        to="/"
        color="secondary"
        startIcon={<ArrowLeft size={17} />}
        sx={{ mt: 3 }}
      >
        Back to home
      </Button>
    </Container>
  );
}
