import { useState } from "react";
import { Autocomplete, Box, TextField } from "@mui/material";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
const names = new Intl.DisplayNames(["en"], { type: "region" });
const countries = getCountries()
  .map((code) => ({
    code,
    label: `${names.of(code) || code} (+${getCountryCallingCode(code)})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
export default function PhoneInput({
  value,
  onChange,
  error,
  helperText,
  label = "Phone number",
}: {
  value: string;
  onChange: (v: string) => void;
  error: boolean;
  helperText?: string;
  label?: string;
}) {
  const parsed = parsePhoneNumberFromString(value || "");
  const [country, setCountry] = useState<CountryCode>(parsed?.country || "IN");
  const [national, setNational] = useState<string>(
    parsed?.nationalNumber || "",
  );
  const emit = (code: CountryCode, number: string) => {
    const p = parsePhoneNumberFromString(number, code);
    onChange(
      number
        ? p?.number ||
            `+${getCountryCallingCode(code)}${number.replace(/\D/g, "")}`
        : "",
    );
  };
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(100px, 0.8fr) minmax(0,1.2fr)",
        gap: 1,
      }}
    >
      <Autocomplete
        disableClearable
        options={countries}
        value={countries.find((c) => c.code === country)!}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.code === b.code}
        onChange={(_, o) => {
          setCountry(o.code);
          emit(o.code, national);
        }}
        renderInput={(params) => <TextField {...params} label="Country code" />}
      />
      <TextField
        label={label}
        value={national}
        onChange={(e) => {
          const n = e.target.value.replace(/[^0-9 ()-]/g, "");
          setNational(n);
          emit(country, n);
        }}
        error={error}
        helperText={helperText}
        slotProps={{
          htmlInput: { inputMode: "tel", autoComplete: "tel-national" },
        }}
      />
    </Box>
  );
}
