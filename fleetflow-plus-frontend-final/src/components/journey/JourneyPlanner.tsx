import { apiError } from "../../services/helper/errors";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAuthModal } from "../../hooks/useAuthModal";
import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { Box, Button, Typography, Divider, Chip, Alert } from "@mui/material";
import { MapPin, LocateFixed, ArrowDownUp, ArrowRight, Route, Clock, } from "lucide-react";
import type { IPlace } from "../../types/interface/IPlace";
import type { IRoute } from "../../types/interface/IRoute";
import { useGeolocation } from "../../hooks/useGeolocation";
import { routeBetween } from "../../services/api/journeyApi";
import { colors as c } from "../../theme/palette";
import PlaceField from "./PlaceField";
import Loading from "../common/Loading";
const RouteMap = lazy(() => import("./RouteMap"));
export default function JourneyPlanner() {
    const [a, setA] = useState<IPlace | null>(null), [b, setB] = useState<IPlace | null>(null), [route, setRoute] = useState<IRoute | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [showMap, setShowMap] = useState(false), [revision, setRevision] = useState(0);
    const navigate = useNavigate();
    const user = useAppSelector(s => s.auth.user);
    const modal = useAuthModal();
    const { locate, locating } = useGeolocation();
    const abort = useRef<AbortController | null>(null);
    useEffect(() => () => abort.current?.abort(), []);
    const clear = () => {
        abort.current?.abort();
        setBusy(false);
        setRoute(null);
        setError("");
    };
    const calculate = async () => {
        setShowMap(true);
        if (!a || !b) {
            setError("Search and select both locations first.");
            return;
        }
        clear();
        const ctrl = new AbortController();
        abort.current = ctrl;
        setBusy(true);
        try {
            const result = await routeBetween(a, b, ctrl.signal);
            if (!ctrl.signal.aborted) setRoute(result);
        }
        catch (e) {
            if (!ctrl.signal.aborted)
                setError(apiError(e).message);
        }
        finally {
            if (!ctrl.signal.aborted)
                setBusy(false);
        }
    };
    return (<Box sx={{
            bgcolor: c.paper,
            border: `1px solid ${c.line}`,
            borderRadius: 3,
            p: { xs: 2.5, md: 3 },
            boxShadow: "0 18px 60px #28282512",
        }}>
      <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
        }}>
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 2, color: c.deep, fontWeight: 700 }}>
            JOURNEY PLANNER
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-.04em" }}>
            Where are we going?
          </Typography>
        </Box>
        <Route size={30} color={c.deep}/>
      </Box>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <PlaceField key={`a${revision}`} label="Pickup location" place={a} onSelect={(p) => {
            setA(p);
            if (p) setShowMap(true);
            clear();
        }}/>
        <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            alignItems: "center",
        }}>
          <Button size="small" startIcon={<LocateFixed size={16}/>} disabled={locating} onClick={async () => {
            try {
                const p = await locate();
                setA(p);
                setShowMap(true);
                clear();
            }
            catch (e) {
                setError(e instanceof Error ? e.message : "Location unavailable.");
            }
        }} sx={{ color: c.deep, minHeight: 32 }}>
            {locating ? "Locating…" : "Use current location"}
          </Button>
          <Button size="small" color="secondary" startIcon={<ArrowDownUp size={16}/>} onClick={() => {
            setA(b);
            setB(a);
            setRevision((v) => v + 1);
            clear();
        }}>
            Swap
          </Button>
        </Box>
        <PlaceField key={`b${revision}`} label="Destination" place={b} onSelect={(p) => {
            setB(p);
            if (p) setShowMap(true);
            clear();
        }}/>
        {error && <Alert severity="warning">
        {error}
        </Alert>}
        <Button variant="contained" onClick={calculate} disabled={busy} endIcon={<ArrowRight size={19}/>} sx={{ py: 1.3 }}>
          {busy ? "Finding your route…" : "Explore my route"}
        </Button>
        <Button size="small" onClick={() => setShowMap(v => !v)}>{showMap ? "Hide map" : "Open map"}</Button>
        <Typography variant="caption" color="text.secondary">
          Search and route requests use OpenRouteService; coverage is limited to India.
          Current location is shared only when you calculate a route.
        </Typography>
      </Box>
      {showMap && (<>
          <Divider sx={{ my: 2 }}/>
          {route && (<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip icon={<MapPin size={16}/>} label={`${(route.distance / 1000).toFixed(1)} km`}/>
              <Chip icon={<Clock size={16}/>} label={`${Math.max(1, Math.round(route.duration / 60))} min estimated`}/>
            </Box>)}
          <Suspense fallback={<Loading />}>
            <RouteMap a={a} b={b} route={route}/>
          </Suspense>
          {route && a && b && (!user || user.role === "customer") && <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => user ? navigate("/customer/book-shipment", { state: { pickup: a, destination: b } }) : modal.open("login")}>
            {user ? "Book this shipment" : "Sign in to book"}
            </Button>}
          <Typography variant="caption" color="text.secondary">
            Estimated driving route; not live traffic or a truck-specific route.
          </Typography>
        </>)}
    </Box>);
}
