import { Box, Button, Typography, Alert, Chip } from '@mui/material';
import { LocateFixed, ArrowDownUp } from 'lucide-react';
import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import PlaceField from '../journey/PlaceField';
import Loading from '../common/Loading';
import { useGeolocation } from '../../hooks/useGeolocation';
import { routeBetween } from '../../services/api/journeyApi';
import { apiError } from '../../services/helper/errors';
import type { IPlace } from '../../types/interface/IPlace';
import type { IRoute } from '../../types/interface/IRoute';
const RouteMap = lazy(() => import('../journey/RouteMap'));
export default function ShipmentRouteFields({ pickup, destination, setPickup, setDestination }: {
    pickup: IPlace | null;
    destination: IPlace | null;
    setPickup: (p: IPlace | null) => void;
    setDestination: (p: IPlace | null) => void;
}) {
    const { locate, locating } = useGeolocation();
    const [error, setError] = useState(''), [revision, setRevision] = useState(0);
    const [showMap, setShowMap] = useState(!!pickup || !!destination), [route, setRoute] = useState<IRoute | null>(null), [busy, setBusy] = useState(false);
    const abort = useRef<AbortController | null>(null);
    useEffect(() => () => abort.current?.abort(), []);
    const clear = () => { abort.current?.abort(); setRoute(null); setBusy(false); setError(''); };
    const preview = async () => {
        setShowMap(true); clear();
        if (!pickup || !destination) { setError('Select both locations to calculate your route.'); return; }
        const controller = new AbortController(); abort.current = controller; setBusy(true);
        try { const result = await routeBetween(pickup, destination, controller.signal); if (!controller.signal.aborted) setRoute(result); }
        catch (e) { if (!controller.signal.aborted) setError(apiError(e).message); }
        finally { if (!controller.signal.aborted) setBusy(false); }
    };
    return <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Typography variant="h6" fontWeight={800}>01 / Pickup & delivery</Typography>
        <PlaceField key={`a${revision}`} label="Pickup location" place={pickup} onSelect={p => { clear(); setPickup(p); if (p) setShowMap(true); }}/>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" startIcon={<LocateFixed size={16}/>} disabled={locating} onClick={async () => {
                try { const p = await locate(); clear(); setPickup(p); setShowMap(true); }
                catch (e) { setError(apiError(e).message); }
            }}>{locating ? 'Locating…' : 'Current location'}</Button>
            <Button size="small" startIcon={<ArrowDownUp size={16}/>} onClick={() => { clear(); setPickup(destination); setDestination(pickup); setRevision(v => v + 1); }}>Swap</Button>
        </Box>
        <PlaceField key={`b${revision}`} label="Delivery destination" place={destination} onSelect={p => { clear(); setDestination(p); if (p) setShowMap(true); }}/>
        {error && <Alert severity="warning">{error}</Alert>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button size="small" onClick={() => setShowMap(v => !v)}>{showMap ? 'Hide map' : 'Open map'}</Button>
            <Button size="small" variant="outlined" disabled={busy} onClick={() => void preview()}>{busy ? 'Calculating…' : 'Preview road route'}</Button>
        </Box>
        {showMap && <>
            {route && <Chip sx={{ justifySelf: 'start' }} label={`${(route.distance / 1000).toFixed(1)} km · ${Math.ceil(route.duration / 60)} min road estimate`}/>}
            <Suspense fallback={<Loading/>}><RouteMap a={pickup} b={destination} route={route}/></Suspense>
        </>}
        <Typography variant="caption" color="text.secondary">Select an Indian location from search results. Add the full street address below. Road routes are estimates; your final quote is calculated on the server.</Typography>
    </Box>;
}
