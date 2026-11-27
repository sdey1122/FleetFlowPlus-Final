import { useState } from "react";
import {
  Box,
  Paper,
  Avatar,
  Typography,
  Divider,
  Chip,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Camera, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { profileUpdated } from "../../redux/slices/authSlice";
import { dateTime } from "../../constants/shipment";
import { profileSchema } from "../../services/validation/profileSchema";
import { shipmentApi } from "../../services/api/shipmentApi";
import { apiError } from "../../services/helper/errors";
export default function CustomerProfilePage() {
  const u = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const [image, setImage] = useState<string>(),
    [error, setError] = useState("");
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { bio: u.bio || "", dob: u.dob?.slice(0, 10) || "" },
  });
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(u.createdAt)) / 86400000),
  );
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Typography variant="h4" fontWeight={850}>
        My account
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: 3, maxWidth: 720, display: "grid", gap: 2 }}
      >
        <Avatar
          src={image || u.profileImage || undefined}
          sx={{ width: 80, height: 80 }}
        >
          {u.name[0]}
        </Avatar>
        <Typography variant="h5" fontWeight={800}>
          {u.name}
        </Typography>
        <Chip
          label={u.isEmailVerified ? "Email verified" : "Not verified"}
          color={u.isEmailVerified ? "success" : "warning"}
          sx={{ justifySelf: "start" }}
        />
        <Divider />
        {[
          ["Email", u.email],
          ["Phone", u.phone || "Not set"],
          ["Role", "Customer"],
          ["Member since", dateTime(u.createdAt) + " IST"],
          ["Account age", `${ageDays} days`],
        ].map(([k, v]) => (
          <Box key={k}>
            <Typography variant="caption" color="text.secondary">
              {k}
            </Typography>
            <Typography sx={{ overflowWrap: "anywhere" }}>{v}</Typography>
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary">
          Name and email cannot be edited.
        </Typography>
        <Divider />
        <Typography variant="h6" fontWeight={800}>
          Personal details
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(async (v) => {
            setError("");
            try {
              const updated = await shipmentApi.updateProfile({
                bio: v.bio,
                dob: v.dob || null,
                ...(image ? { imageData: image } : {}),
              });
              dispatch(profileUpdated(updated));
              setImage(undefined);
              toast.success("Profile updated.");
            } catch (e) {
              setError(apiError(e).message);
            }
          })}
          sx={{ display: "grid", gap: 2 }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<Camera size={18} />}
            sx={{ justifySelf: "start" }}
          >
            Choose profile image
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (
                  file.size > 600 * 1024 ||
                  !["image/jpeg", "image/png", "image/webp"].includes(file.type)
                ) {
                  setError(
                    "Choose a JPEG, PNG or WebP image of at most 600 KB.",
                  );
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  setImage(String(reader.result));
                  setError("");
                };
                reader.onerror = () => setError("Could not read image.");
                reader.readAsDataURL(file);
              }}
            />
          </Button>
          <Typography variant="caption">
            JPEG, PNG or WebP · max 600 KB
          </Typography>
          <Controller
            control={control}
            name="bio"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Bio"
                multiline
                minRows={3}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Up to 500 characters"}
              />
            )}
          />
          <Controller
            control={control}
            name="dob"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Date of birth"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={<Save size={17} />}
            sx={{ justifySelf: "start" }}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
