import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  Divider,
  Stack,
} from "@mui/material";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { shipmentApi } from "../../services/api/shipmentApi";
import { useCustomerData } from "../../hooks/useCustomerData";
import { openRazorpay } from "../../services/helper/razorpayCheckout";
import { downloadReceipt, printReceipt } from "../../services/helper/receipt";
import { apiError } from "../../services/helper/errors";
import { money, dateTime, statusLabel } from "../../constants/shipment";
import PriceBreakdown from "../../components/customer/PriceBreakdown";
import Loading from "../../components/common/Loading";
export default function OrderDetailPage() {
  const { id = "" } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const loader = useCallback(
    (signal: AbortSignal) => shipmentApi.order(id, signal),
    [id],
  );
  const q = useCustomerData(loader);
  const o = q.data?.id === id ? q.data : undefined;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const started = useRef(false);
  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const checkout = await shipmentApi.retry(id);
      if (checkout.order.paymentStatus === "paid") {
        toast.success("Payment already completed.");
        return;
      }
      const result = await openRazorpay(checkout, () => {
        toast.error("Payment attempt failed. You can retry in checkout.");
        void shipmentApi
          .sync(id)
          .then(() => q.refresh())
          .catch(() => {});
      });
      if (result) {
        const verified = await shipmentApi.verify(id, result);
        if (verified.paymentStatus === "paid")
          toast.success("Payment completed. Shipment awaiting dispatch.");
        else toast.info("Payment submitted; awaiting capture.");
      } else {
        await shipmentApi.sync(id);
        toast.info("Checkout closed. Review the payment status.");
      }
    } catch (e) {
      setError(apiError(e).message);
    } finally {
      setBusy(false);
      q.refresh();
    }
  };
  useEffect(() => {
    if (!started.current && o && loc.state?.checkout) {
      started.current = true;
      navigate(loc.pathname, { replace: true, state: null });
      if (o.paymentStatus !== "paid") void pay();
    }
  }, [o, loc.state]);
  const sync = async () => {
    setBusy(true);
    setError("");
    try {
      await shipmentApi.sync(id);
      q.refresh();
      toast.success("Payment status refreshed.");
    } catch (e) {
      setError(apiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  if (!o)
    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <Button
          component={Link}
          to="/customer/orders"
          startIcon={<ArrowLeft size={17} />}
        >
          Order history
        </Button>
        {q.loading ? (
          <Loading />
        ) : (
          <Alert
            severity="error"
            action={<Button onClick={q.refresh}>Retry</Button>}
          >
            {q.error || "Order unavailable."}
          </Alert>
        )}
      </Box>
    );
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Button
        component={Link}
        to="/customer/orders"
        sx={{ justifySelf: "start" }}
        startIcon={<ArrowLeft size={17} />}
      >
        Order history
      </Button>
      <Box>
        <Typography variant="overline" color="error.main">
          SHIPMENT RECORD
        </Typography>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ overflowWrap: "anywhere" }}
        >
          {o.number}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
          <Chip label={statusLabel(o.status)} />
          <Chip
            label={`Payment: ${statusLabel(o.paymentStatus)}`}
            color={
              o.paymentStatus === "paid"
                ? "success"
                : o.paymentStatus === "failed"
                  ? "error"
                  : "warning"
            }
          />
        </Stack>
        <Typography variant="caption">
          Placed {dateTime(o.createdAt)} IST · Tracking {o.trackingId}
        </Typography>
      </Box>
      {(error || q.error) && (
        <Alert severity="warning">{error || q.error}</Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0,1fr) minmax(300px,.65fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            Shipment details
          </Typography>
          <Typography fontWeight={800}>Pickup</Typography>
          <Typography>
            {o.shipment.senderName} · {o.shipment.senderPhone}
          </Typography>
          <Typography color="text.secondary">
            {o.shipment.pickupAddress} — {o.shipment.pickup.label}
          </Typography>
          <Divider />
          <Typography fontWeight={800}>Delivery</Typography>
          <Typography>
            {o.shipment.recipientName} · {o.shipment.recipientPhone}
          </Typography>
          <Typography color="text.secondary">
            {o.shipment.deliveryAddress} — {o.shipment.destination.label}
          </Typography>
          <Divider />
          <Typography fontWeight={800}>
            {o.price.label} · {(o.route.distance / 1000).toFixed(1)} km
          </Typography>
          <Typography>
            {o.shipment.description} · {o.shipment.weight} kg ·{" "}
            {o.shipment.length} × {o.shipment.width} × {o.shipment.height} cm
          </Typography>
          {o.shipment.instructions && (
            <Typography>Instructions: {o.shipment.instructions}</Typography>
          )}
          <Divider />
          <Typography variant="h6" fontWeight={800}>
            Shipment progress
          </Typography>
          {o.timeline.map((t, i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <CheckCircle2 color="#38754a" size={20} />
              <Box>
                <Typography fontWeight={700}>{t.event}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dateTime(t.at)} IST
                </Typography>
              </Box>
            </Box>
          ))}
          {o.status === "awaiting_dispatch" && (
            <Alert severity="info" icon={<Clock size={18} />}>
              Waiting for dispatcher assignment. Driver GPS tracking will become
              available after the driver module is enabled.
            </Alert>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
          <CreditCard size={28} />
          <Typography variant="h6" fontWeight={800}>
            Billing summary
          </Typography>
          <PriceBreakdown price={o.price} />
          {o.paymentStatus !== "paid" && (
            <Button variant="contained" disabled={busy} onClick={pay}>
              {busy ? "Processing…" : "Pay / retry payment"}
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={busy}
            startIcon={<RefreshCw size={16} />}
            onClick={sync}
          >
            Refresh payment status
          </Button>
        </Paper>
      </Box>
      <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Transaction history & receipts
        </Typography>
        {!o.attempts.length && (
          <Typography color="text.secondary">
            No payment attempts recorded yet.
          </Typography>
        )}
        {o.attempts.map((a) => (
          <Box
            key={a.paymentId}
            sx={{
              border: 1,
              borderColor: "divider",
              p: 2,
              borderRadius: 2,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 160 }}>
              <Typography fontWeight={800}>
                {statusLabel(a.status)} ·{" "}
                {a.status === "captured" ? "Paid " : "Attempted "}
                {money(a.amount)}
              </Typography>
              <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>
                {a.paymentId} · {dateTime(a.at)} IST · {a.method}
              </Typography>
              {a.errorCode && (
                <Typography variant="body2" color="error.main">
                  {a.errorCode}
                </Typography>
              )}
            </Box>
            {a.status !== "authorized" && (
              <>
                <Button
                  size="small"
                  startIcon={<Printer size={16} />}
                  onClick={() =>
                    void printReceipt(o.id, a.paymentId).catch((e) =>
                      toast.error(apiError(e).message),
                    )
                  }
                >
                  Open / print PDF
                </Button>
                <Button
                  size="small"
                  startIcon={<Download size={16} />}
                  onClick={() =>
                    void downloadReceipt(o.id, a.paymentId, o.number).catch(
                      (e) => toast.error(apiError(e).message),
                    )
                  }
                >
                  {a.status === "captured"
                    ? "Download receipt"
                    : "Download failure report"}
                </Button>
              </>
            )}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
