import { Button, Typography } from "@mui/material";
import { useAuthModal } from "../../hooks/useAuthModal";
import type { AuthModalType } from "../../types/type/AuthModalType";
export default function ModalLink({
  text,
  label,
  to,
}: {
  text?: string;
  label: string;
  to: AuthModalType;
}) {
  const { open } = useAuthModal();
  return (
    <Typography
      component="div"
      variant="body2"
      sx={{ textAlign: "center", mt: 1 }}
    >
      {text}{" "}
      <Button
        size="small"
        onClick={() => open(to)}
        sx={{ minHeight: 28, color: "error.main", p: 0.5 }}
      >
        {label}
      </Button>
    </Typography>
  );
}
