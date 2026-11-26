import { lazy, Suspense } from "react";
import { Box, Button, Container, Typography, Divider } from "@mui/material";
import {
  ArrowUpRight,
  ArrowRight,
  Package,
  Route,
  Truck,
  ShieldCheck,
  Users,
  Navigation,
} from "lucide-react";
import { colors as c } from "../theme/palette";
import { useAuthModal } from "../hooks/useAuthModal";
import { useAppSelector } from "../hooks/useAppSelector";
import { useNavigate } from "react-router-dom";
import { dashboardPath } from "../constants/roles";
import RouteArtwork from "../components/journey/RouteArtwork";
import Loading from "../components/common/Loading";
const JourneyPlanner = lazy(
  () => import("../components/journey/JourneyPlanner"),
);
const ContactSection = lazy(() => import("../components/home/ContactSection"));
const roles = [
  {
    n: "01",
    title: "Customer",
    text: "Start with a destination. Follow your shipments from the first mile to the last.",
    Icon: Package,
  },
  {
    n: "02",
    title: "Dispatcher",
    text: "Bring fleet coordination, people and assignments into one connected workspace.",
    Icon: Route,
  },
  {
    n: "03",
    title: "Driver",
    text: "Stay focused on the road with a clear view of your journeys and delivery tasks.",
    Icon: Truck,
  },
];
export default function HomePage() {
  const modal = useAuthModal(),
    user = useAppSelector((s) => s.auth.user),
    navigate = useNavigate();
  const start = () =>
    user ? navigate(dashboardPath(user.role)) : modal.open("register");
  return (
    <Box id="home" sx={{ scrollMarginTop: 80 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: { xs: 5, md: 9 },
            pb: { xs: 5, md: 7 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.12fr 0.88fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "start",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontSize: 11,
                letterSpacing: 2.2,
                fontWeight: 750,
                color: c.deep,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: c.coral,
                }}
              />{" "}
              LOGISTICS IN MOTION
            </Typography>
            <Typography
              component="h1"
              variant="h1"
              sx={{
                fontSize: "clamp(44px, 6vw, 86px)",
                lineHeight: 0.99,
                mt: 2.5,
                maxWidth: 720,
              }}
            >
              Move smarter.
              <br />
              Go further.
            </Typography>
            <Typography
              sx={{
                fontFamily: "Newsreader Variable",
                fontStyle: "italic",
                fontSize: { xs: 30, md: 43 },
                lineHeight: 1.15,
                color: c.deep,
                mt: 2,
              }}
            >
              Beyond the destination.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 15, md: 17 },
                lineHeight: 1.65,
                color: c.muted,
                maxWidth: 470,
                my: 2.5,
              }}
            >
              Connect your shipments, fleet operations and the people behind
              every delivery. A simpler way to get from here to wherever comes
              next.
            </Typography>
            <Button onClick={start} variant="contained" sx={{ mr: 2, mb: 3 }}>
              {" "}
              {user ? "Open my workspace" : "Get started"}{" "}
            </Button>
            <Button
              color="secondary"
              href="#about"
              endIcon={<ArrowRight size={16} />}
              sx={{ mb: 3 }}
            >
              Explore the platform
            </Button>
            <RouteArtwork />
          </Box>
          <Box sx={{ pt: { xs: 0, md: 6 } }}>
            <Suspense fallback={<Loading />}>
              <JourneyPlanner />
            </Suspense>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 1,
                alignItems: "center",
                color: c.muted,
              }}
            >
              <ShieldCheck size={17} />
              <Typography variant="caption">
                Your location is only used with your permission.
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
            gap: 2,
            py: 3,
          }}
        >
          {[
            { Icon: Navigation, text: "Plan with clarity" },
            { Icon: Users, text: "Connect the right people" },
            { Icon: ShieldCheck, text: "Secure account access" },
          ].map(({ Icon, text }) => (
            <Box
              key={text}
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                justifyContent: { xs: "flex-start", sm: "center" },
              }}
            >
              <Icon size={22} color={c.deep} />
              <Typography fontSize={14} fontWeight={700}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
        <Divider />
        <Box id="about" sx={{ scrollMarginTop: 90, py: { xs: 7, md: 10 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.65fr 1.35fr" },
              gap: 3,
              alignItems: "end",
              mb: 4,
            }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2, color: c.deep }}
            >
              OUR ECOSYSTEM
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: 34, md: 52 }, maxWidth: 780 }}
            >
              Different roles.{" "}
              <Box
                component="span"
                sx={{
                  fontFamily: "Newsreader Variable",
                  fontStyle: "italic",
                  color: c.deep,
                  fontWeight: 500,
                }}
              >
                One direction.
              </Box>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr 1fr" },
              gap: 2,
            }}
          >
            {roles.map(({ n, title, text, Icon }, i) => (
              <Box
                key={title}
                sx={{
                  minHeight: 220,
                  p: 3,
                  bgcolor: i === 1 ? c.ink : i === 0 ? c.sand : c.paper,
                  color: i === 1 ? c.paper : c.ink,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: `1px solid ${c.line}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Icon size={34} strokeWidth={1.5} />
                  <Typography variant="caption">{n} / 03</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, lineHeight: 1.6, opacity: 0.85 }}
                  >
                    {text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: 5,
            bgcolor: c.soft,
            borderRadius: 3,
            p: { xs: 3, md: 5 },
            mb: { xs: 6, md: 9 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2, fontWeight: 700 }}
            >
              ABOUT FLEETFLOW PLUS
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: 32, md: 46 }, mt: 1 }}
            >
              Every mile matters.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ lineHeight: 1.65, mb: 2 }}>
              FleetFlow Plus is being built around a single idea: logistics
              works better when the people, routes and information behind it are
              connected. We make the journey feel clearer, from planning to the
              delivery ahead.
            </Typography>
            <Button
              color="secondary"
              variant="outlined"
              onClick={start}
              endIcon={<ArrowRight size={17} />}
            >
              Join the journey
            </Button>
          </Box>
        </Box>
        <Suspense fallback={<Loading />}>
          <ContactSection />
        </Suspense>
      </Container>
    </Box>
  );
}
