import { apiError } from "../../services/helper/errors";
import { useState, useEffect, useRef, useCallback } from "react";
import { Box, TextField, Button, List, ListItemButton, ListItemText, CircularProgress, Alert, Typography } from "@mui/material";
import { Search } from "lucide-react";
import type { IPlace } from "../../types/interface/IPlace";
import { searchPlace } from "../../services/api/journeyApi";
export default function PlaceField({ label, place, onSelect }: { label: string; place: IPlace | null; onSelect: (p: IPlace | null) => void }) {
  const [query, setQuery] = useState(place?.label || "");
  const [results, setResults] = useState<IPlace[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(""), [searched, setSearched] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (place) {
      clearTimeout(timer.current); abort.current?.abort();
      setQuery(place.label); setResults([]); setBusy(false); setError(""); setSearched(false);
    }
  }, [place]);
  useEffect(() => () => { clearTimeout(timer.current); abort.current?.abort(); }, []);
  const search = useCallback(async (text: string, autocomplete: boolean) => {
    clearTimeout(timer.current);
    if (text.trim().length < 3) { setError("Enter at least three characters."); return; }
    abort.current?.abort();
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(""); setSearched(false); setResults([]);
    try {
      let found = await searchPlace(text.trim(), controller.signal, autocomplete);
      if (!found.length && autocomplete && !controller.signal.aborted) found = await searchPlace(text.trim(), controller.signal, false);
      if (controller.signal.aborted) return;
      setResults(found); setSearched(true);
    } catch (e) {
      if (!controller.signal.aborted) setError(apiError(e).message);
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }, []);
  useEffect(() => {
    if (place || query.trim().length < 3) return;
    timer.current = setTimeout(() => void search(query, true), 750);
    return () => clearTimeout(timer.current);
  }, [query, place, search]);
  return <Box>
    <Box sx={{ display: "flex", gap: 1 }}>
      <TextField fullWidth label={label} value={query} inputProps={{ autoComplete: 'off' }} onChange={e => {
        clearTimeout(timer.current); abort.current?.abort(); setBusy(false); setError(""); setSearched(false); setQuery(e.target.value); onSelect(null); setResults([]);
      }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void search(query, false); } }}/>
      <Button variant="outlined" color="secondary" aria-label={`Search ${label}`} onClick={() => void search(query, false)} disabled={busy} sx={{ minWidth: 44, p: 1 }}>{busy ? <CircularProgress size={17}/> : <Search size={18}/>}</Button>
    </Box>
    {error && <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>}
    {searched && !results.length && !error && <Typography role="status" variant="caption" color="text.secondary">No matching Indian locations. Try a city, locality or PIN code.</Typography>}
    {results.length > 0 && <List dense sx={{ maxHeight: 220, overflow: "auto", border: 1, borderColor: "divider", bgcolor: "background.paper", borderRadius: 1, mt: .5 }}>
      {results.map((p, i) => <ListItemButton key={`${p.lat}:${p.lon}:${i}`} onClick={() => { clearTimeout(timer.current); abort.current?.abort(); onSelect(p); setQuery(p.label); setResults([]); setBusy(false); setSearched(false); setError(""); }}><ListItemText primary={p.label} slotProps={{ primary: { fontSize: 13 } }}/></ListItemButton>)}
    </List>}
  </Box>;
}
