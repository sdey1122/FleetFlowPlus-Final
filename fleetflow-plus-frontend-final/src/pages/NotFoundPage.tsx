import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPinOff } from "lucide-react";
import { colors as c } from "../theme/palette";
export default function NotFoundPage() {
  return (
    <Container
      maxWidth="sm"
      sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}
    >
      <Box sx={{ color: c.deep }}>
        <MapPinOff size={54} strokeWidth={1.5} />
      </Box>
      <Typography
        sx={{
          fontSize: "clamp(82px,18vw,150px)",
          fontWeight: 800,
          letterSpacing: "-.09em",
          lineHeight: 1,
          color: c.ink,
        }}
      >
        404
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 2 }}>
        Looks like a wrong turn.
      </Typography>
      <Typography color="text.secondary" sx={{ my: 2 }}>
        This page isn't on the map. Let’s get you back on track.
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        startIcon={<ArrowLeft size={18} />}
      >
        Back to home
      </Button>
    </Container>
  );
}
