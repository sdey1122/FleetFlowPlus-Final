import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
export default function DashboardLayout() {
  return (
    <Box sx={{ minHeight: "65vh" }}>
      <Outlet />
    </Box>
  );
}
