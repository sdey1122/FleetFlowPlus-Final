import { Box, Typography } from "@mui/material";
import { colors as c } from "../../theme/palette";
export default function RouteArtwork() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: 220,
        bgcolor: c.sand,
        borderRadius: 2,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <svg
        viewBox="0 0 600 260"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path d="M30 0H0V30" fill="none" stroke="#877c68" opacity=".17" />
          </pattern>
        </defs>
        <rect width="600" height="260" fill={c.sand} />
        <rect width="600" height="260" fill="url(#grid)" />
        <g fill="none" stroke="#faf9f5" opacity=".7" strokeWidth="2">
          <path d="M-30 70Q120 140 200 10T470 70T650 10" />
          <path d="M0 180Q160 60 260 190T610 130" />
          <path d="M90 -20L190 280M330 -20L410 280M550 -20L470 280" />
        </g>
        <path
          d="M40 220C120 210 120 120 220 120S340 200 390 106S485 45 550 42"
          fill="none"
          stroke={c.ink}
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M40 220C120 210 120 120 220 120S340 200 390 106S485 45 550 42"
          fill="none"
          stroke={c.paper}
          strokeWidth="2"
          strokeDasharray="6 10"
        />
        <circle
          cx="40"
          cy="220"
          r="11"
          fill={c.coral}
          stroke={c.paper}
          strokeWidth="3"
        />
        <circle
          cx="550"
          cy="42"
          r="11"
          fill={c.coral}
          stroke={c.paper}
          strokeWidth="3"
        />
        <g transform="translate(260 123) rotate(20)">
          <rect
            x="-34"
            y="-12"
            width="49"
            height="24"
            rx="4"
            fill={c.paper}
            stroke={c.ink}
            strokeWidth="2"
          />
          <path
            d="M15 -12h15l11 9v15H15Z"
            fill={c.coral}
            stroke={c.ink}
            strokeWidth="2"
          />
          <rect x="27" y="-7" width="9" height="8" fill={c.ink} />
          <circle cx="-23" cy="13" r="6" fill={c.ink} />
          <circle cx="28" cy="13" r="6" fill={c.ink} />
        </g>
      </svg>
      <Box
        sx={{
          position: "absolute",
          left: 16,
          top: 15,
          bgcolor: c.paper,
          px: 1.2,
          py: 0.5,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ letterSpacing: 1, fontWeight: 750 }}
        >
          FROM A TO B, BETTER.
        </Typography>
      </Box>
      <Box sx={{ position: "absolute", right: 15, bottom: 12 }}>
        <Typography variant="caption" sx={{ color: c.ink, fontWeight: 700 }}>
          FLEETFLOW / ROUTE STUDY
        </Typography>
      </Box>
    </Box>
  );
}
