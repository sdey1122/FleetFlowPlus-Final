import { Box, Typography } from "@mui/material";
import { Mail, ArrowUpRight } from "lucide-react";
import DynamicForm from "../forms/DynamicForm";
import { contactSchema } from "../../services/validation/schemas";
import { http } from "../../services/api/axiosInstance";
import { toast } from "sonner";
import { useState } from "react";
import { colors as c } from "../../theme/palette";
export default function ContactSection() {
  const [revision, setRevision] = useState(0);
  return (
    <Box
      id="contact"
      sx={{
        scrollMarginTop: 90,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
        gap: { xs: 3, md: 7 },
        py: { xs: 7, md: 10 },
        borderTop: `1px solid ${c.line}`,
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: c.deep, letterSpacing: 2 }}>
          04 / CONTACT
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 48 }, my: 1 }}>
          Let’s talk logistics.
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 360, mb: 3 }}>
          Questions about FleetFlow Plus, or an idea for a smarter way to move?
          Send us a message.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Mail size={22} />
          <Typography variant="body2" fontWeight={700}>
            Your enquiry goes to the FleetFlow team.
          </Typography>
          <ArrowUpRight size={16} />
        </Box>
      </Box>
      <Box
        sx={{
          bgcolor: c.paper,
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          border: `1px solid ${c.line}`,
        }}
      >
        <DynamicForm
          key={revision}
          fields={[
            { name: "name", label: "Your name", kind: "text" },
            { name: "email", label: "Email address", kind: "email" },
            { name: "message", label: "How can we help?", kind: "textarea" },
          ]}
          initial={{ name: "", email: "", message: "" }}
          schema={contactSchema}
          submitLabel="Send message"
          onSubmit={async (v) => {
            await http.post("contact", v);
            toast.success("Your message has been received.");
            setRevision((x) => x + 1);
          }}
        />
      </Box>
    </Box>
  );
}
