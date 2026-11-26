import DynamicForm from "../forms/DynamicForm";
import { registerFields } from "./fields";
import { registerSchema } from "../../services/validation/schemas";
import { authApi } from "../../services/api/authApi";
import { useAuthModal } from "../../hooks/useAuthModal";
import type { IRegister } from "../../types/interface/IRegister";
import { toast } from "sonner";
import ModalLink from "./ModalLink";
export default function RegisterModal() {
  const modal = useAuthModal();
  return (
    <>
      <DynamicForm
        fields={registerFields}
        schema={registerSchema}
        initial={{
          name: "",
          email: "",
          phone: "",
          role: "customer",
          password: "",
          confirmPassword: "",
        }}
        submitLabel="Create my account"
        onSubmit={async (v) => {
          const started = Date.now();
          const r = await authApi.register(v as unknown as IRegister);
          modal.pending({
            email: r.user.email,
            reverifyToken: r.reverifyToken,
            expiresAt: started + r.expiresIn * 1000,
            resendAt:
              started +
              (r.otpSent
                ? Number(import.meta.env.VITE_OTP_COOLDOWN || 60) * 1000
                : 0),
          });
          if (r.otpSent) toast.success("Check your email for the code.");
          else
            toast.error(
              "Account created, but email delivery failed. Request a new code.",
            );
          modal.open("verify");
        }}
      />
      <ModalLink text="Already have an account?" label="Sign in" to="login" />
    </>
  );
}
