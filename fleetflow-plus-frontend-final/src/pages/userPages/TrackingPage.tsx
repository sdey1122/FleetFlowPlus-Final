import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
} from "@mui/material";
import { Route } from "lucide-react";
import { useCustomerData } from "../../hooks/useCustomerData";
import { shipmentApi } from "../../services/api/shipmentApi";
import { statusLabel, dateTime } from "../../constants/shipment";
export default function TrackingPage() {
  const [value, setValue] = useState(""),
    [query, setQuery] = useState("");
  const loader = useCallback(
    (signal: AbortSignal) => shipmentApi.orders(0, 10, query, "all", signal),
    [query],
  );
  const q = useCustomerData(loader);
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Typography variant="h4" fontWeight={850}>
        Track your shipment
      </Typography>
      <Alert severity="info">
        Recorded order events only. Dispatcher assignment and live driver
        location will be added in the next phases.
      </Alert>
      <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(value.trim());
          }}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
        >
          <TextField
            label="Order or tracking ID"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{ flex: 1, minWidth: 180 }}
          />
          <Button type="submit" variant="contained">
            Find shipment
          </Button>
        </Box>
        {q.error && <Alert severity="error">{q.error}</Alert>}
        {q.loading && <Typography>Loading shipments…</Typography>}
        {q.data?.items.map((o) => (
          <Paper
            key={o.id}
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Route size={24} />
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                {o.trackingId}
              </Typography>
              <Typography variant="caption">
                {dateTime(o.createdAt)} IST
              </Typography>
            </Box>
            <Chip label={statusLabel(o.status)} />
            <Button component={Link} to={`/customer/orders/${o.id}`}>
              View progress
            </Button>
          </Paper>
        ))}
        {q.data && !q.data.items.length && (
          <Typography color="text.secondary">No matching shipments.</Typography>
        )}
      </Paper>
    </Box>
  );
}
