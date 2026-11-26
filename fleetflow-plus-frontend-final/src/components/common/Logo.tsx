import { Box, Typography } from "@mui/material";
import { colors as c } from "../../theme/palette";
export default function Logo() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        color: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="36" height="36" viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M8 40V13Q8 6 16 6H38M8 25H25Q34 25 34 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="40" r="3.8" fill={c.coral} />
        <path
          d="M36 31v12m-6-6h12"
          stroke={c.coral}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <Typography
        component="span"
        sx={{
          fontFamily: "Manrope Variable",
          fontSize: { xs: 17, sm: 20 },
          fontWeight: 800,
          letterSpacing: "-.065em",
        }}
      >
        FleetFlow
        <Box component="span" sx={{ color: c.deep }}>
          {" "}
          Plus
        </Box>
      </Typography>
    </Box>
  );
}
