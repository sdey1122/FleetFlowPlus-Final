import DynamicForm from "../forms/DynamicForm";
import { email, otp, password, confirm } from "./fields";
import { resetSchema } from "../../services/validation/schemas";
import { authApi } from "../../services/api/authApi";
import { useAuthModal } from "../../hooks/useAuthModal";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { sessionCleared } from "../../redux/slices/authSlice";
import { invalidateSessionRequests } from "../../services/api/axiosInstance";
import { useCountdown } from "../../hooks/useCountdown";
import { Typography } from "@mui/material";
import { toast } from "sonner";
import ModalLink from "./ModalLink";
export default function ResetPasswordModal() {
  const modal = useAuthModal(),
    dispatch = useAppDispatch();
  const { resetEmail, resetExpiresAt } = useAppSelector((s) => s.modal);
  const left = useCountdown(resetExpiresAt);
  return (
    <>
      <DynamicForm
        fields={[email, otp, password, confirm]}
        schema={resetSchema}
        initial={{
          email: resetEmail,
          otp: "",
          password: "",
          confirmPassword: "",
        }}
        submitLabel="Reset password"
        extra={
          <Typography variant="caption">
            {left
              ? `Code timer: ${left}s`
              : "Use the latest reset code from your inbox."}
          </Typography>
        }
        onSubmit={async (v) => {
          await authApi.reset({
            email: v.email,
            otp: v.otp,
            password: v.password,
            confirmPassword: v.confirmPassword,
          });
          invalidateSessionRequests();
          dispatch(sessionCleared());
          modal.reset("", 0);
          toast.success("Password updated. Sign in with your new password.");
          modal.open("login");
        }}
      />
      <ModalLink label="Request another code" to="forgot" />
      <ModalLink label="Back to sign in" to="login" />
    </>
  );
}
