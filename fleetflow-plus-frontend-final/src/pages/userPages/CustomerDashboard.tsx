import { useCallback, useState } from "react";
import type { ExpenseGrouping } from "../../types/type/ExpenseGrouping";
import { Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  Chip,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Package,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useCustomerData } from "../../hooks/useCustomerData";
import { shipmentApi } from "../../services/api/shipmentApi";
import { money, dateTime, statusLabel } from "../../constants/shipment";
import Loading from "../../components/common/Loading";
import { colors as c } from "../../theme/palette";
const istYear = (date: Date) =>
  Number.isFinite(date.getTime())
    ? Number(
        new Intl.DateTimeFormat("en-IN", {
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(date),
      )
    : NaN;
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(date + "T00:00:00Z"));
const fullDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T00:00:00Z"));
export default function CustomerDashboard() {
  const user = useAppSelector((s) => s.auth.user)!;
  const [months, setMonths] = useState(12);
  const currentYear = istYear(new Date());
  const [year, setYear] = useState(currentYear);
  const [grouping, setGrouping] = useState<ExpenseGrouping>("weekly");
  const joinedYear = istYear(new Date(user.createdAt));
  const firstYear = Math.max(
    2000,
    Math.min(
      currentYear - 5,
      Number.isFinite(joinedYear) ? joinedYear : currentYear,
    ),
  );
  const years = Array.from(
    { length: currentYear + 2 - firstYear + 1 },
    (_, i) => currentYear + 2 - i,
  );
  const loader = useCallback(
    (signal: AbortSignal) =>
      shipmentApi.overview(signal, months, year, grouping),
    [months, year, grouping],
  );
  const q = useCustomerData(loader);
  const s = q.data?.summary;
  const expenses = q.data?.expenses;
  const chartData =
    expenses?.points.map((p) => ({
      start: p.start,
      end: p.end,
      amount: p.total / 100,
    })) ?? [];
  const currency = (value: number) =>
    `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const metrics = [
    { label: "Total orders", value: s?.totalOrders, icon: Package },
    { label: "Paid orders", value: s?.paid, icon: CheckCircle2 },
    { label: "Awaiting dispatch", value: s?.awaiting, icon: Clock },
    {
      label: "Total expenses",
      value: s ? money(s.expenses) : undefined,
      icon: Wallet,
    },
  ];
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="overline" color="error.main">
            YOUR LOGISTICS WORKSPACE
          </Typography>
          <Typography variant="h4" fontWeight={850}>
            Welcome, {user.name}.
          </Typography>
          <Typography color="text.secondary">
            Your shipments, payments and expenses at a glance.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/customer/book-shipment"
          variant="contained"
          endIcon={<ArrowUpRight size={18} />}
        >
          New shipment
        </Button>
      </Box>
      {q.error && (
        <Alert
          severity="warning"
          action={<Button onClick={q.refresh}>Retry</Button>}
        >
          {q.error}
        </Alert>
      )}
      {q.loading && !q.data && <Loading />}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            lg: "repeat(4,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        {metrics.map((m) => (
          <Paper
            key={m.label}
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, display: "grid", gap: 1.2 }}
          >
            <m.icon size={24} color={c.deep} />
            <Typography variant="body2" color="text.secondary">
              {m.label}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={850}
              sx={{ overflowWrap: "anywhere" }}
            >
              {m.value ?? "—"}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0,1fr) minmax(280px,.65fr)",
          },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800}>
            Shipment expenses
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Captured payments · IST · INR
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.2,
              mt: 2,
            }}
          >
            <TextField
              select
              size="small"
              label="Year"
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                if (months === 0) setMonths(12);
              }}
              sx={{ minWidth: 112 }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                  {y === currentYear
                    ? " (Current)"
                    : y > currentYear
                      ? " (Future)"
                      : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Period"
              value={months}
              onChange={(e) => {
                const next = Number(e.target.value);
                setMonths(next);
                if (next === 0) setYear(currentYear);
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value={0}>Today</MenuItem>
              {[3, 6, 12].map((m) => (
                <MenuItem key={m} value={m}>
                  {year === currentYear ? "Last " : "Final "}
                  {m} months
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="View"
              value={months === 0 ? "daily" : grouping}
              disabled={months === 0}
              onChange={(e) =>
                setGrouping(e.target.value === "daily" ? "daily" : "weekly")
              }
              sx={{ minWidth: 106 }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
            </TextField>
          </Box>
          {expenses && chartData.length > 0 ? (
            <>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" fontWeight={850}>
                  {money(expenses.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fullDate(expenses.start)} – {fullDate(expenses.end)} ·{" "}
                  {expenses.grouping === "weekly"
                    ? "Weekly totals"
                    : "Daily totals"}
                </Typography>
              </Box>
              <Box sx={{ height: 280, mt: 2, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 6 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={c.line}
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="start"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                      minTickGap={22}
                      tickLine={false}
                    />
                    <YAxis
                      width={66}
                      tick={{ fontSize: 11 }}
                      tickFormatter={currency}
                      domain={[0, (max: number) => Math.max(100, max)]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [currency(Number(v)), "Expenses"]}
                      labelFormatter={(value) => {
                        const point = chartData.find(
                          (p) => p.start === String(value),
                        );
                        if (!point) return String(value);
                        return point.start === point.end
                          ? fullDate(point.start)
                          : `${fullDate(point.start)} – ${fullDate(point.end)}`;
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      name="Expenses"
                      fill={c.coral}
                      maxBarSize={18}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              {expenses.total === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {expenses.year > currentYear
                    ? "Future period — no recorded payments."
                    : "No captured payments in this period."}
                </Typography>
              )}
            </>
          ) : (
            <Box
              sx={{
                minHeight: 250,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: c.muted,
              }}
            >
              {q.error
                ? "Unable to load expenses. Use Retry above."
                : q.loading
                  ? "Loading expenses…"
                  : "Update the backend to enable daily and weekly expense history."}
            </Box>
          )}
        </Paper>
        <Paper
          variant="outlined"
          sx={{ p: 3, display: "grid", gap: 1.6, alignContent: "start" }}
        >
          <Typography variant="h6" fontWeight={800}>
            Customer details
          </Typography>
          <Divider />
          {[
            ["Name", user.name],
            ["Email", user.email],
            ["Phone", user.phone || "Not set"],
            ["Member since", dateTime(user.createdAt) + " IST"],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography fontWeight={650} sx={{ overflowWrap: "anywhere" }}>
                {value}
              </Typography>
            </Box>
          ))}
          <Button
            component={Link}
            to="/customer/profile"
            sx={{ justifySelf: "start" }}
          >
            Account overview
          </Button>
        </Paper>
      </Box>
      <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Recent orders
          </Typography>
          <Button component={Link} to="/customer/orders">
            View all
          </Button>
        </Box>
        {q.data && !q.data.recent.length && (
          <Typography color="text.secondary">
            No shipments yet. Book your first shipment to get started.
          </Typography>
        )}
        {q.data?.recent.map((o) => (
          <Box
            key={o.number}
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              borderTop: 1,
              borderColor: "divider",
              pt: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography fontWeight={750} sx={{ overflowWrap: "anywhere" }}>
                {o.number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dateTime(o.createdAt)} IST
              </Typography>
            </Box>
            <Chip size="small" label={statusLabel(o.paymentStatus)} />
            <Typography fontWeight={800}>{money(o.price.total)}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
