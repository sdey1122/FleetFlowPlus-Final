import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { Search } from "lucide-react";
import type { IPlace } from "../../types/interface/IPlace";
import { searchPlace } from "../../services/api/journeyApi";
import { toast } from "sonner";
export default function PlaceField({
  label,
  place,
  onSelect,
}: {
  label: string;
  place: IPlace | null;
  onSelect: (p: IPlace | null) => void;
}) {
  const [query, setQuery] = useState(place?.label || ""),
    [results, setResults] = useState<IPlace[]>([]),
    [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    if (place) {
      setQuery(place.label);
      setResults([]);
    }
  }, [place]);
  useEffect(() => () => abort.current?.abort(), []);
  const search = async () => {
    if (query.trim().length < 3) {
      toast.error("Enter at least three characters.");
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const found = await searchPlace(query.trim(), controller.signal);
      setResults(found);
      if (!found.length) toast.info("No matching locations found.");
    } catch (e) {
      if (!controller.signal.aborted)
        toast.error(e instanceof Error ? e.message : "Search failed.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          label={label}
          value={query}
          onChange={(e) => {
            abort.current?.abort();
            setBusy(false);
            setQuery(e.target.value);
            onSelect(null);
            setResults([]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
        <Button
          variant="outlined"
          color="secondary"
          aria-label={`Search ${label}`}
          onClick={search}
          disabled={busy}
          sx={{ minWidth: 44, p: 1 }}
        >
          {busy ? <CircularProgress size={17} /> : <Search size={18} />}
        </Button>
      </Box>
      {results.length > 0 && (
        <List
          dense
          sx={{
            maxHeight: 180,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 1,
            mt: 0.5,
          }}
        >
          {results.map((p, i) => (
            <ListItemButton
              key={i}
              onClick={() => {
                onSelect(p);
                setQuery(p.label);
                setResults([]);
              }}
            >
              <ListItemText
                primary={p.label}
                slotProps={{ primary: { fontSize: 12 } }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
