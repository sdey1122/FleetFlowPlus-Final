import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import type { IDynamicFormProps } from "../../types/interface/IDynamicFormProps";
import { apiError } from "../../services/helper/errors";
import PhoneInput from "./PhoneInput";
import OTPInput from "./OTPInput";
export default function DynamicForm({
  fields,
  schema,
  initial,
  onSubmit,
  submitLabel,
  extra,
}: IDynamicFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues: initial,
    resolver: yupResolver(schema) as unknown as Resolver<
      Record<string, string>
    >,
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [error, setGlobal] = useState("");
  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(async (v) => {
        setGlobal("");
        try {
          await onSubmit(v);
        } catch (e) {
          const a = apiError(e);
          setGlobal(a.message);
          if (Array.isArray(a.details))
            for (const d of a.details) {
              if (
                d &&
                typeof d.field === "string" &&
                fields.some((f) => f.name === d.field)
              )
                setError(d.field, { message: String(d.message) });
            }
          if (a.code === "EMAIL_ALREADY_EXISTS")
            setError("email", { message: a.message });
          if (a.code === "PHONE_ALREADY_EXISTS")
            setError("phone", { message: a.message });
        }
      })}
      sx={{ display: "grid", gap: 1.6 }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {fields.map((f) => (
        <Controller
          key={f.name}
          name={f.name}
          control={control}
          render={({ field, fieldState }) =>
            f.kind === "phone" ? (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            ) : f.kind === "otp" ? (
              <OTPInput
                value={field.value || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            ) : (
              <TextField
                {...field}
                value={field.value || ""}
                label={f.label}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                select={f.kind === "select"}
                multiline={f.kind === "textarea"}
                minRows={f.kind === "textarea" ? 4 : undefined}
                type={
                  f.kind === "password"
                    ? visible[f.name]
                      ? "text"
                      : "password"
                    : f.kind === "email"
                      ? "email"
                      : "text"
                }
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                slotProps={
                  f.kind === "password"
                    ? {
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={
                                  visible[f.name]
                                    ? "Hide password"
                                    : "Show password"
                                }
                                onClick={() =>
                                  setVisible((v) => ({
                                    ...v,
                                    [f.name]: !v[f.name],
                                  }))
                                }
                                edge="end"
                              >
                                {visible[f.name] ? (
                                  <EyeOff size={18} />
                                ) : (
                                  <Eye size={18} />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }
                    : undefined
                }
              >
                {f.options?.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )
          }
        />
      ))}
      {fields.some((f) => f.name === "confirmPassword") && (
        <Typography variant="caption" color="text.secondary">
          9–32 characters · uppercase, lowercase and a special character · max
          72 UTF-8 bytes
        </Typography>
      )}
      {extra}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        endIcon={
          isSubmitting ? (
            <CircularProgress size={17} />
          ) : (
            <ArrowRight size={18} />
          )
        }
        sx={{ py: 1.3 }}
      >
        {isSubmitting ? "Please wait…" : submitLabel}
      </Button>
    </Box>
  );
}
