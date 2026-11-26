# FleetFlow Plus — Frontend / Phase 1

React 19.3.x • TypeScript 6.0.3 • Vite • MUI • Redux Toolkit • React Router • Axios • React Hook Form + Yup • Lucide • Socket.IO • Leaflet.

## Start locally

1. Apply the companion `FleetFlow-Notification-Backend-Patch.zip` to the **backend project root** (the folder containing `server.js` and `package.json`). Back up first, and merge if you changed any listed file after supplying the original ZIP. Keep your private `.env`. Run `npm install`, `npm test`, then `npm run dev` in the backend.
2. Extract this frontend into a separate `fleetflow-plus-frontend` folder. Use Node 22.12+ (Node 24 LTS recommended). Copy `.env.example` to `.env` and keep `BACKEND_PROXY_URL=http://localhost:6050`, `VITE_SOCKET_URL=http://localhost:6050` and `VITE_SOCKET_PATH=/socket.io`.
3. Backend local `.env`: `NODE_ENV=development`, `FRONTEND_URL=http://localhost:5173`, `BACKEND_URL=http://localhost:6050`, `COOKIE_SAME_SITE=lax`, `EMAIL_DELIVERY_MODE=smtp`, `EMAIL_RELAY_ENABLED=false`. Retain database, Redis, SMTP and JWT settings. Use `VITE_OTP_COOLDOWN=5` in the frontend if your local backend cooldown is 5 seconds.
4. Run `npm install`, `npm run typecheck`, `npm run dev` in the frontend. Open http://localhost:5173. Vite proxies REST to your local backend. `npm run build` produces `dist`.

The new frontend contains a standard Vite `main.tsx`; providers, theme and router are configured in `App.tsx`. If integrating into an existing standard Vite scaffold, your existing main.tsx can remain unchanged.

## Production

- Push the backend patch to the existing GitHub backend repository. Redeploy both Render and the existing Vercel SMTP backend. Do **not** change their existing SMTP/remote modes or shared secrets. Set `SOCKET_PATH=/socket.io` on Render.
- Push the frontend as a new folder/repository and create a **separate Vercel frontend project**, not the existing Vercel SMTP backend. Root directory must contain this frontend's package.json. Framework Vite; build `npm run build`; output `dist`; Node 24.x where available.
- Set frontend Vercel `VITE_SOCKET_URL=https://fleetflowplus-final.onrender.com`, `VITE_SOCKET_PATH=/socket.io`, `VITE_OTP_COOLDOWN=60` (optional). No database credentials, SMTP secrets or JWT keys belong in frontend variables.
- Set `FRONTEND_URL=https://<actual-new-frontend-domain>` on BOTH backend deployments and redeploy. This enables browser origin checks, Socket.IO and correct email links. Do not include a trailing slash or `/api-docs`. Do not change the existing `BACKEND_URL` and `EMAIL_SERVICE_URL` values.
- `vercel.json` proxies `/auth/*`, `/notifications` and `/notifications/*`, and `/contact` to the known Render backend. This preserves the `/auth` refresh cookie path on the frontend origin, and avoids relying on third-party cookies. Confirm Set-Cookie/refresh behavior in the deployed browser; the proxy hasn't been live-tested. Socket.IO connects directly to Render, not the frontend or Vercel SMTP project. Use the actual Render domain if it changes.
- Do not deploy preview URLs as trusted production frontend origins unless intentionally configured. SPA fallback handles direct dashboard URLs and the 404 page.

## Features and structure

`src/components` reusable views; `src/pages` landing page and role folders; `src/layouts` shells; `src/wrappers` role guards; `src/routes` route definitions; `src/types/interface` and `src/types/type` individual domain declarations; `src/services/api`, `validation`, `helper`; `src/hooks`; `src/redux`; `src/theme`.

- The four dashboards are intentionally welcome placeholders. Admin registration is backend-seed-only. Frontend route wrappers are UX protection; backend authorization must protect any future privileged endpoints.
- All five auth flows are modals. Email `/#verify-email` and `/#reset-password` links work across devices by accepting email and OTP. Pending verification (including the scoped reverify token) is stored in per-tab sessionStorage, never the password or OTP. Access tokens are memory-only. Refresh cookies are HttpOnly. Login can recover expired/missing reverify tokens via the backend's EMAIL_NOT_VERIFIED response.
- OTP timers are conservative UI estimates (based on request start); the server is authoritative. Resend cooldown matches backend defaults and accepts server retryAfter when supplied.
- Notification events contain only invalidation signals. Private content comes from bearer-authenticated REST. Guest verification confirmation is an in-memory notification; the persistent welcome notification is available after sign-in. Admins receive registration, verification, sign-in, password-reset and contact events. Socket.IO reconnects, plus polling reconciles missed events and changes made by the Vercel backend.
- Journey planner uses explicit, user-triggered Nominatim searches (not autocomplete), OpenStreetMap tiles and the public FOSSGIS routing endpoint. Search and coordinates go to those providers. Driving estimates are not live traffic or truck-specific. Public services may be unavailable/rate limited; do not use them as a high-volume production service. Select a commercial or self-hosted provider before scaling. The map is lazy loaded. No real shipments or payments are created in this phase.
- Contact form writes enquiries to MongoDB and notifies admins; no email reply workflow or admin enquiry viewer yet.
- MUI Data Grid and Recharts are deferred until dashboard functionality requires them. No unused dependency or fake dashboard data.

## Verification checklist

1. Local registration for each role, invalid phone/password, duplicate email/phone, close/reopen verification, resend, verification, guest bell, login, refresh, logout, password reset, deep links.
2. Open a second browser as seeded admin; verify a new account from another browser. Check admin notifications arrive without page reload. Log in as the customer; confirm only their own records appear, mark all read, reload, verify persisted read state.
3. Test each protected dashboard URL as wrong role, logged out, direct reload and 404 route.
4. Check 320, 576, 768 and 990 px layouts; keyboard access, password visibility, OTP paste, international phone search.
5. Search/select two places and calculate route; test denied location permission, unavailable routing provider and contact form errors.
6. Repeat on deployed frontend with browser Network tab: `/auth/login` sends Set-Cookie, `/auth/refresh-token` retains session, notifications return 200, Socket.IO connects to Render, Render registration sends real email via Vercel.

## Validation status

Source files passed TypeScript 5.8.3 syntax transpilation and relative import resolution; not a full TypeScript 6.0.3 semantic typecheck. The container could not reach npm registry (EAI_AGAIN), so dependencies, production build, browser visual testing and live deployments could not be verified. Package versions are selected for compatibility with the requested stack but actual peer resolution must be tested on install. No package-lock.json was fabricated; npm install generates it. Commit the generated lockfile after a successful build.
