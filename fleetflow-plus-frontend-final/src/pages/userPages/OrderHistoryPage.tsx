import { useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Chip,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
} from "@mui/x-data-grid";
import { ArrowUpRight, RefreshCw, Search } from "lucide-react";
import type { IOrder } from "../../types/interface/IOrder";
import { useCustomerData } from "../../hooks/useCustomerData";
import { shipmentApi } from "../../services/api/shipmentApi";
import { money, dateTime, statusLabel } from "../../constants/shipment";
export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [sort, setSort] = useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [input, setInput] = useState(""),
    [search, setSearch] = useState(""),
    [payment, setPayment] = useState("all");
  const loader = useCallback(
    (signal: AbortSignal) =>
      shipmentApi.orders(
        pagination.page,
        pagination.pageSize,
        search,
        payment,
        signal,
        sort[0]?.field || "createdAt",
        sort[0]?.sort || "desc",
      ),
    [pagination.page, pagination.pageSize, search, payment, sort],
  );
  const q = useCustomerData(loader);
  const totalRef = useRef(0);
  if (q.data) totalRef.current = q.data.total;
  const columns: GridColDef<IOrder>[] = [
    { field: "number", headerName: "Order reference", minWidth: 235, flex: 1 },
    {
      field: "createdAt",
      headerName: "Order date / IST",
      minWidth: 185,
      valueFormatter: (v) => dateTime(String(v)),
    },
    {
      field: "service",
      sortable: false,
      headerName: "Service",
      minWidth: 155,
      valueGetter: (_v, row) => row.price.label,
    },
    {
      field: "paymentStatus",
      headerName: "Payment",
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.row.paymentStatus)}
          color={
            p.row.paymentStatus === "paid"
              ? "success"
              : p.row.paymentStatus === "failed"
                ? "error"
                : "warning"
          }
        />
      ),
    },
    {
      field: "status",
      headerName: "Shipment status",
      minWidth: 155,
      valueFormatter: (v) => statusLabel(String(v)),
    },
    {
      field: "amount",
      headerName: "Total",
      width: 130,
      valueGetter: (_v, row) => row.price.total,
      valueFormatter: (v) => money(Number(v)),
    },
    {
      field: "actions",
      headerName: "Details / receipt",
      width: 145,
      sortable: false,
      renderCell: (p) => (
        <Button
          size="small"
          onClick={() => navigate(`/customer/orders/${p.row.id}`)}
          endIcon={<ArrowUpRight size={15} />}
        >
          Open
        </Button>
      ),
    },
  ];
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="overline" color="error.main">
            YOUR SHIPMENT RECORDS
          </Typography>
          <Typography variant="h4" fontWeight={850}>
            Order history
          </Typography>
          <Typography color="text.secondary">
            All orders, payment attempts and downloadable receipts.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/customer/book-shipment"
          variant="contained"
        >
          New shipment
        </Button>
      </Box>
      <Paper
        variant="outlined"
        sx={{ p: 2, display: "grid", gap: 2, minWidth: 0 }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(input.trim());
            setPagination((p) => ({ ...p, page: 0 }));
          }}
          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            label="Order or tracking ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            sx={{ flex: 1, minWidth: 180 }}
          />
          <Button type="submit" startIcon={<Search size={16} />}>
            Search
          </Button>
          <TextField
            size="small"
            select
            label="Payment"
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            sx={{ minWidth: 140 }}
          >
            {["all", "paid", "pending", "failed"].map((v) => (
              <MenuItem key={v} value={v}>
                {statusLabel(v)}
              </MenuItem>
            ))}
          </TextField>
          <Button onClick={q.refresh} startIcon={<RefreshCw size={16} />}>
            Refresh
          </Button>
        </Box>
        {q.error && <Alert severity="warning">{q.error}</Alert>}
        <Box sx={{ height: 620, width: "100%", minWidth: 0 }}>
          <DataGrid
            rows={q.data?.items || []}
            columns={columns}
            loading={q.loading}
            rowCount={q.data?.total ?? totalRef.current}
            paginationMode="server"
            paginationModel={pagination}
            onPaginationModelChange={setPagination}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sortingMode="server"
            sortModel={sort}
            onSortModelChange={(v) => {
              setSort(v);
              setPagination((p) => ({ ...p, page: 0 }));
            }}
            disableColumnFilter
            disableColumnMenu
            localeText={{
              noRowsLabel:
                "No matching orders. Book your first shipment to get started.",
            }}
            sx={{ border: 0 }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
