import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import {
  Package,
  Truck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import DynamicForm from "../../components/forms/DynamicForm";
import ShipmentRouteFields from "../../components/customer/ShipmentRouteFields";
import PriceBreakdown from "../../components/customer/PriceBreakdown";
import Loading from "../../components/common/Loading";
import { useAppSelector } from "../../hooks/useAppSelector";
import { shipmentApi } from "../../services/api/shipmentApi";
import { shipmentSchema } from "../../services/validation/shipmentSchema";
import { apiError } from "../../services/helper/errors";
import { money, goodsOptions, dateTime } from "../../constants/shipment";
import type { IFormField } from "../../types/interface/IFormField";
import type { IPlace } from "../../types/interface/IPlace";
import type { IQuote } from "../../types/interface/IQuote";
import type { IBookingRouteState } from "../../types/interface/IBookingRouteState";
import type { GoodsCategory } from "../../types/type/GoodsCategory";
import type { ServiceTier } from "../../types/type/ServiceTier";
const RouteMap = lazy(() => import("../../components/journey/RouteMap"));
const fields: IFormField[] = [
  { name: "senderName", label: "Sender name", kind: "text" },
  { name: "senderPhone", label: "Sender phone", kind: "phone" },
  {
    name: "pickupAddress",
    label: "Complete pickup address / PIN code",
    kind: "textarea",
  },
  { name: "recipientName", label: "Recipient name", kind: "text" },
  { name: "recipientPhone", label: "Recipient phone", kind: "phone" },
  {
    name: "deliveryAddress",
    label: "Complete delivery address / PIN code",
    kind: "textarea",
  },
  {
    name: "category",
    label: "Goods category",
    kind: "select",
    options: goodsOptions,
  },
  { name: "description", label: "Describe the goods", kind: "text" },
  { name: "weight", label: "Actual weight (kg, maximum 100)", kind: "number" },
  { name: "length", label: "Length (cm)", kind: "number" },
  { name: "width", label: "Width (cm)", kind: "number" },
  { name: "height", label: "Height (cm)", kind: "number" },
  {
    name: "instructions",
    label: "Special instructions (optional)",
    kind: "textarea",
  },
];
export default function BookShipmentPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const loc = useLocation();
  const navigate = useNavigate();
  const from = loc.state as IBookingRouteState | null;
  const [pickup, setPickup] = useState<IPlace | null>(from?.pickup || null),
    [destination, setDestination] = useState<IPlace | null>(
      from?.destination || null,
    );
  const [safe, setSafe] = useState(false),
    [quote, setQuote] = useState<IQuote | null>(null),
    [tier, setTier] = useState<ServiceTier>("standard"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [initial, setInitial] = useState<Record<string, string>>({
    senderName: user.name,
    senderPhone: user.phone || "",
    pickupAddress: "",
    recipientName: "",
    recipientPhone: "",
    deliveryAddress: "",
    category: "personal",
    description: "",
    weight: "0.5",
    length: "20",
    width: "15",
    height: "10",
    instructions: "",
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!quote) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quote]);
  const selected = quote?.prices.find((p) => p.tier === tier);
  const expired = !!quote && Date.parse(quote.expiresAt) <= now;
  const checkout = async () => {
    if (!quote) return;
    setBusy(true);
    setError("");
    try {
      const result = await shipmentApi.checkout(quote.id, tier);
      navigate(`/customer/orders/${result.order.id}`, {
        state: { checkout: true },
      });
    } catch (e) {
      setError(apiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography variant="overline" color="error.main">
          CUSTOMER / NEW SHIPMENT
        </Typography>
        <Typography variant="h4" fontWeight={850}>
          Make the next move.
        </Typography>
        <Typography color="text.secondary">
          Plan a domestic shipment, compare services and review your final price
          before checkout.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip
          label="01 Route & parcel"
          color={!quote ? "primary" : "default"}
        />
        <Chip
          label="02 Service & quote"
          color={quote ? "primary" : "default"}
        />
        <Chip label="03 Payment" />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!quote ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0,1fr) minmax(260px,.48fr)",
            },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, display: "grid", gap: 3 }}
          >
            <ShipmentRouteFields
              pickup={pickup}
              destination={destination}
              setPickup={setPickup}
              setDestination={setDestination}
            />
            <Divider />
            <Typography variant="h6" fontWeight={800}>
              02 / Parcel and recipient
            </Typography>
            <DynamicForm
              fields={fields}
              schema={shipmentSchema}
              initial={initial}
              submitLabel="Calculate delivery quote"
              extra={
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={safe}
                      onChange={(e) => setSafe(e.target.checked)}
                    />
                  }
                  label="I confirm the contents are lawful, non-hazardous and do not require special handling."
                />
              }
              onSubmit={async (v) => {
                if (!pickup || !destination)
                  throw new Error("Select pickup and destination.");
                if (!safe) throw new Error("Confirm the goods declaration.");
                setInitial(
                  Object.fromEntries(
                    Object.entries(v).map(([k, value]) => [
                      k,
                      String(value ?? ""),
                    ]),
                  ),
                );
                const q = await shipmentApi.quote({
                  pickup,
                  destination,
                  senderName: v.senderName,
                  senderPhone: v.senderPhone,
                  pickupAddress: v.pickupAddress,
                  recipientName: v.recipientName,
                  recipientPhone: v.recipientPhone,
                  deliveryAddress: v.deliveryAddress,
                  category: v.category as GoodsCategory,
                  description: v.description,
                  weight: Number(v.weight),
                  length: Number(v.length),
                  width: Number(v.width),
                  height: Number(v.height),
                  instructions: v.instructions || "",
                  declaredSafe: safe,
                });
                setPickup(pickup);
                setDestination(destination);
                setNow(Date.now());
                setQuote(q);
              }}
            />
          </Paper>
          <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
            <Package size={32} />
            <Typography variant="h6" fontWeight={800}>
              Know before you send
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All shipments have a 100 kg maximum actual and chargeable weight.
              Dimensional weight uses length × width × height ÷ 5,000. ₹50
              platform fee and 18% GST apply.
            </Typography>
            <Divider />
            <Typography variant="body2">
              Restricted, hazardous and temperature-controlled cargo are not
              supported in this phase. Booking is domestic only. Travel
              estimates are not guaranteed delivery times.
            </Typography>
            <Button
              component={Link}
              to="/customer/orders"
              endIcon={<ArrowRight size={16} />}
            >
              Existing shipment?
            </Button>
          </Paper>
        </Box>
      ) : (
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
            <Button
              startIcon={<ArrowLeft size={17} />}
              sx={{ justifySelf: "start" }}
              onClick={() => {
                setQuote(null);
                setError("");
              }}
            >
              Edit shipment
            </Button>
            <Typography variant="h6" fontWeight={800}>
              Your route
            </Typography>
            <Typography variant="body2">
              {pickup?.label} → {destination?.label}
            </Typography>
            <Chip
              label={`${(quote.route.distance / 1000).toFixed(1)} km · ${Math.ceil(quote.route.duration / 60)} min road estimate`}
              sx={{ justifySelf: "start" }}
            />
            <Suspense fallback={<Loading />}>
              <RouteMap a={pickup} b={destination} route={quote.route} />
            </Suspense>
            <Typography variant="h6" fontWeight={800}>
              Select service
            </Typography>
            <RadioGroup
              value={tier}
              onChange={(e) => setTier(e.target.value as ServiceTier)}
            >
              {quote.prices.map((p, i) => (
                <Paper
                  key={p.tier}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderColor: tier === p.tier ? "primary.main" : "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <FormControlLabel
                    value={p.tier}
                    control={<Radio />}
                    sx={{ flex: 1, m: 0 }}
                    label={
                      <Box>
                        <Typography fontWeight={800}>{p.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {
                            [
                              "Economical",
                              "Everyday priority",
                              "Urgent priority",
                              "Highest priority",
                            ][i]
                          }
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography fontWeight={800}>{money(p.total)}</Typography>
                </Paper>
              ))}
            </RadioGroup>
          </Paper>
          <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
            <Truck size={28} />
            <Typography variant="h6" fontWeight={800}>
              Checkout summary
            </Typography>
            {selected && <PriceBreakdown price={selected} />}
            <Typography variant="caption">
              Quote expires {dateTime(quote.expiresAt)} IST.
            </Typography>
            {expired && (
              <Alert severity="warning">
                Quote expired. Edit shipment and get a new quote.
              </Alert>
            )}
            <Button
              disabled={busy || expired}
              variant="contained"
              endIcon={<ArrowRight size={17} />}
              onClick={checkout}
            >
              {busy ? "Preparing…" : "Place order & continue to payment"}
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
