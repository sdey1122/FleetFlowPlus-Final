import DynamicForm from "../forms/DynamicForm";
import { email } from "./fields";
import { forgotSchema } from "../../services/validation/schemas";
import { authApi } from "../../services/api/authApi";
import { useAuthModal } from "../../hooks/useAuthModal";
import { toast } from "sonner";
import ModalLink from "./ModalLink";
export default function ForgotPasswordModal() {
  const modal = useAuthModal();
  return (
    <>
      <DynamicForm
        fields={[email]}
        schema={forgotSchema}
        initial={{ email: "" }}
        submitLabel="Send reset code"
        onSubmit={async (v) => {
          const started = Date.now();
          const r = await authApi.forgot(v.email);
          modal.reset(v.email, started + r.expiresIn * 1000);
          modal.open("reset");
          toast.success(
            "If the account is eligible, a reset code will arrive shortly.",
          );
        }}
      />
      <ModalLink label="Back to sign in" to="login" />
    </>
  );
}
