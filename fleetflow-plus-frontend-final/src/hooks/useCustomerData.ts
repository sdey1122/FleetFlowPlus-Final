import { useEffect, useState, useRef } from "react";
import { apiError } from "../services/helper/errors";
export function useCustomerData<T>(
  loader: (signal: AbortSignal) => Promise<T>,
) {
  const [data, setData] = useState<T>();
  const lastLoader = useRef(loader);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((x) => x + 1);
    window.addEventListener("fleetflow:orders-changed", refresh);
    return () =>
      window.removeEventListener("fleetflow:orders-changed", refresh);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    if (lastLoader.current !== loader) {
      lastLoader.current = loader;
      setData(undefined);
    }
    setLoading(true);
    setError("");
    loader(abort.signal)
      .then((v) => {
        if (!abort.signal.aborted) setData(v);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(apiError(e).message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [loader, revision]);
  return { data, loading, error, refresh: () => setRevision((x) => x + 1) };
}
