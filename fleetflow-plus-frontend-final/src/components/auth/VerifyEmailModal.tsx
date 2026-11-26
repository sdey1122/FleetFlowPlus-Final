import { useState } from 'react';
import { Alert, Button, Typography, Box } from '@mui/material';
import DynamicForm from '../forms/DynamicForm';
import { email, otp } from './fields';
import { verifySchema } from '../../services/validation/schemas';
import { authApi } from '../../services/api/authApi';
import { useAuthModal } from '../../hooks/useAuthModal';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useCountdown } from '../../hooks/useCountdown';
import { apiError } from '../../services/helper/errors';
import { toast } from 'sonner';
import ModalLink from './ModalLink';
export default function VerifyEmailModal() { const modal = useAuthModal(); const p = useAppSelector(s => s.modal.pending); const expires = useCountdown(p?.expiresAt || 0), cooldown = useCountdown(p?.resendAt || 0); const [busy, setBusy] = useState(false); const resend = async () => { if (!p?.reverifyToken)
    return; setBusy(true); const started = Date.now(); try {
    const r = await authApi.resend(p.reverifyToken);
    modal.pending({ email: r.email, reverifyToken: r.reverifyToken, expiresAt: started + r.expiresIn * 1000, resendAt: started + Number(import.meta.env.VITE_OTP_COOLDOWN || 60) * 1000 });
    toast.success('New code sent.');
}
catch (e) {
    const a = apiError(e);
    const details = a.details as {
        retryAfter?: number;
    } | undefined;
    if (a.code === 'OTP_COOLDOWN' && details?.retryAfter)
        modal.pending({ ...p, resendAt: Date.now() + details.retryAfter * 1000 });
    toast.error(a.message);
}
finally {
    setBusy(false);
} }; return <><Alert severity="info" sx={{ mb: 2 }}>Enter the email address and six-digit code from your inbox. Never share your code.</Alert><DynamicForm fields={[email, otp]} schema={verifySchema} initial={{ email: p?.email || '', otp: '' }} submitLabel="Verify my email" onSubmit={async (v) => { await authApi.verify({ email: v.email, otp: v.otp }); modal.pending(null); toast.success('Account verified. Welcome to FleetFlow Plus!'); modal.open('login'); }} extra={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography variant="caption" color="text.secondary">{expires ? `Code timer: ${expires}s` : 'Check your latest code'}</Typography>{p?.reverifyToken ? <Button disabled={busy || cooldown > 0} onClick={resend}>{cooldown ? `Resend in ${cooldown}s` : 'Resend OTP'}</Button> : <ModalLink label="Sign in to request a code" to="login"/>}</Box>}/><ModalLink label="Back to sign in" to="login"/></>; }
