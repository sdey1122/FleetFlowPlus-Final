import { useState } from "react";
import type { IPlace } from "../types/interface/IPlace";
export const useGeolocation = () => {
  const [locating, setLocating] = useState(false);
  const locate = () =>
    new Promise<IPlace>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is unavailable."));
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLocating(false);
          resolve({
            label: "Current location",
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
                : "Could not determine your location.",
            ),
          );
        },
        { timeout: 12000, maximumAge: 60000 },
      );
    });
  return { locating, locate };
};
