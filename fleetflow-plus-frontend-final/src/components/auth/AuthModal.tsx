import { lazy, Suspense } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAuthModal } from "../../hooks/useAuthModal";
import Logo from "../common/Logo";
import Loading from "../common/Loading";
const views = {
  login: lazy(() => import("./LoginModal")),
  register: lazy(() => import("./RegisterModal")),
  verify: lazy(() => import("./VerifyEmailModal")),
  forgot: lazy(() => import("./ForgotPasswordModal")),
  reset: lazy(() => import("./ResetPasswordModal")),
};
const copy = {
  login: [
    "WELCOME BACK",
    "Good to see you.",
    "Sign in to continue your journey.",
  ],
  register: [
    "YOUR NEXT MOVE",
    "Let’s get moving.",
    "Create your FleetFlow Plus account.",
  ],
  verify: [
    "EMAIL VERIFICATION",
    "Check your inbox.",
    "One last step before you get moving.",
  ],
  forgot: [
    "ACCOUNT SECURITY",
    "Let’s recover access.",
    "Enter your registered email address.",
  ],
  reset: [
    "ACCOUNT SECURITY",
    "A fresh start.",
    "Choose a new password for your account.",
  ],
};
export default function AuthModal() {
  const active = useAppSelector((s) => s.modal.active);
  const { close } = useAuthModal();
  if (!active) return null;
  const View = views[active],
    words = copy[active];
  return (
    <Dialog
      open
      onClose={close}
      fullWidth
      maxWidth="xs"
      scroll="paper"
      aria-labelledby="auth-title"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1, sm: 3 },
            width: { xs: "calc(100% - 16px)", sm: "100%" },
            maxHeight: "calc(100dvh - 16px)",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Logo />
          <IconButton aria-label="Close dialog" onClick={close}>
            <X size={20} />
          </IconButton>
        </Box>
        <Typography
          variant="overline"
          sx={{ color: "error.main", letterSpacing: 2, fontWeight: 700 }}
        >
          {words[0]}
        </Typography>
        <Typography
          id="auth-title"
          component="h2"
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: "-.045em", fontSize: 29 }}
        >
          {words[1]}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {words[2]}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3, pt: "12px !important" }}>
        <Suspense fallback={<Loading />}>
          <View key={active} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
