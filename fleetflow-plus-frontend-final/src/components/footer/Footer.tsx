import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";
import { colors as c } from "../../theme/palette";
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: c.ink, color: c.paper, pt: 5, pb: 3 }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.6fr 1fr 1fr" },
            gap: 4,
            pb: 5,
          }}
        >
          <Box>
            <Logo />
            <Typography
              sx={{ maxWidth: 290, mt: 2, color: "#d6d1c6", fontSize: 14 }}
            >
              A connected logistics platform for the people who keep the world
              moving.
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight={750} sx={{ mb: 1.5 }}>
              Explore
            </Typography>
            {["Home", "About", "Contact"].map((n) => (
              <MuiLink
                key={n}
                component={Link}
                to={`/#${n.toLowerCase()}`}
                color="inherit"
                underline="hover"
                sx={{ display: "block", fontSize: 14, mb: 1 }}
              >
                {n}
              </MuiLink>
            ))}
          </Box>
          <Box>
            <Typography fontWeight={750} sx={{ mb: 1.5 }}>
              Get in touch
            </Typography>
            <MuiLink
              component={Link}
              to="/#contact"
              color="inherit"
              underline="hover"
              sx={{ fontSize: 14 }}
            >
              Contact our team
            </MuiLink>
            <Typography sx={{ color: "#d6d1c6", fontSize: 13, mt: 2 }}>
              Built for customers, dispatchers and drivers.
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "#ffffff25" }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            pt: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "#d6d1c6" }}>
            © {new Date().getFullYear()} FleetFlow Plus. All rights reserved.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Newsreader Variable",
              fontStyle: "italic",
              fontSize: 16,
            }}
          >
            Every mile matters.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
