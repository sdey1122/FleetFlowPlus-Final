import { useState } from "react";
import type { IPlace } from "../types/interface/IPlace";
export const useGeolocation = () => {
  const [locating, setLocating] = useState(false);
  const locate = () =>
    new Promise<IPlace>((resolve, reject) => {
      if (!window.isSecureContext) {
        reject(
          new Error(
            "Current location requires HTTPS or localhost. Enter your pickup manually.",
          ),
        );
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is unavailable."));
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLocating(false);
          resolve({
            label: `Current location (${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)})`,
            lat: p.coords.latitude,
            lon: p.coords.longitude,
          });
        },
        (e) => {
          setLocating(false);
          reject(
            new Error(
              e.code === 1
                ? "Location permission denied. Enter your pickup manually."
                : e.code === 3
                  ? "Location request timed out. Enable location services or enter your pickup manually."
                  : "Location unavailable. Enable device location services or enter your pickup manually.",
            ),
          );
        },
        { timeout: 25000, maximumAge: 60000, enableHighAccuracy: false },
      );
    });
  return { locating, locate };
};
