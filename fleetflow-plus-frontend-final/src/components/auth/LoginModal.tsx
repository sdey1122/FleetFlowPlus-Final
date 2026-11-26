import DynamicForm from "../forms/DynamicForm";
import { email, loginPassword } from "./fields";
import { loginSchema } from "../../services/validation/schemas";
import { authApi } from "../../services/api/authApi";
import { useAuthModal } from "../../hooks/useAuthModal";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { sessionReceived } from "../../redux/slices/authSlice";
import { invalidateSessionRequests } from "../../services/api/axiosInstance";
import { apiError } from "../../services/helper/errors";
import { toast } from "sonner";
import ModalLink from "./ModalLink";
import { Box } from "@mui/material";
export default function LoginModal() {
  const modal = useAuthModal(),
    dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.modal.pending);
  return (
    <>
      <DynamicForm
        fields={[email, loginPassword]}
        schema={loginSchema}
        initial={{ email: pending?.email || "", password: "" }}
        submitLabel="Sign in"
        extra={
          <Box sx={{ justifySelf: "end" }}>
            <ModalLink label="Forgot password?" to="forgot" />
          </Box>
        }
        onSubmit={async (v) => {
          try {
            const r = await authApi.login({
              email: v.email,
              password: v.password,
            });
            invalidateSessionRequests();
            dispatch(sessionReceived(r));
            modal.pending(null);
            modal.close();
            toast.success(`Welcome back, ${r.user.name}.`);
          } catch (e) {
            const a = apiError(e);
            if (a.code === "EMAIL_NOT_VERIFIED") {
              const d = a.details as
                | {
                    email: string;
                    reverifyToken: string;
                  }
                | undefined;
              modal.pending({
                email: d?.email || v.email,
                reverifyToken: d?.reverifyToken,
                resendAt: pending?.email === v.email ? pending.resendAt : 0,
                expiresAt: pending?.email === v.email ? pending.expiresAt : 0,
              });
              modal.open("verify");
              return;
            }
            throw e;
          }
        }}
      />
      <ModalLink text="Don't have an account?" label="Sign up" to="register" />
    </>
  );
}
