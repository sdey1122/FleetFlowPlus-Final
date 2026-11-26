import { Box, TextField, FormHelperText } from "@mui/material";
import { useRef } from "react";
export default function OTPInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Box>
      <Box
        onClick={() => ref.current?.focus()}
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 1,
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Box
            key={i}
            sx={{
              height: 52,
              border: 1,
              borderColor: error
                ? "error.main"
                : i === value.length
                  ? "primary.main"
                  : "divider",
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              fontWeight: 700,
              bgcolor: "background.paper",
            }}
          >
            {value[i] || "–"}
          </Box>
        ))}
        <TextField
          inputRef={ref}
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          slotProps={{
            htmlInput: {
              "aria-label": "Six digit verification code",
              inputMode: "numeric",
              autoComplete: "one-time-code",
              maxLength: 6,
            },
          }}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.01,
            "& .MuiInputBase-root": { height: "100%" },
          }}
        />
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
