# FleetFlow Plus — Part 1: Backend Authentication

This is the first implementation increment. It includes auth only; no frontend, Cloudinary upload, shipment, payment or Socket.IO implementation is claimed. Profile fields are included in the user model for the next increment. CommonJS / MVC-service architecture; Node.js 22.16+ (prefer current Node LTS).

## 1. Install

```powershell
npm install
Copy-Item .env.example .env
```

On macOS/Linux use `cp .env.example .env`. The dependency ranges target compatible stable majors, not verified latest patch releases. `npm install` resolves them and creates a lockfile; commit that lockfile. If you want to inspect current package versions, use `npm outdated` after installation. Do not blindly upgrade major versions.

## 2. Environment

- Set `MONGODB_URI` to a MongoDB Atlas connection string (database name `fleetflow` recommended). Allow the relevant network access and create a least-privilege database user. URL-encode special characters in the DB password.
- Set `REDIS_URL` to the Upstash TCP/TLS connection string (`rediss://...`), not the REST URL. Local Redis works if `REDIS_URL` is empty. `ioredis` is used to match the supplied project pattern; Upstash recommends its REST client on serverless runtimes, so monitor connections in deployment.
- Run `node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"` four separate times. Paste different results into the three JWT secrets and `OTP_SECRET`.
- Set Gmail SMTP host/port 587, `EMAIL_SECURE=false`, `EMAIL_USER` to your Gmail account and `EMAIL_PASS` to an app password (requires eligible Google account with two-step verification). Set `EMAIL_FROM` to `FleetFlow Plus <your-email@gmail.com>`. For port 465 use `EMAIL_SECURE=true`. Nodemailer awaits SMTP acceptance. Inbox delivery is not guaranteed; a 60-second OTP can expire before the email arrives.
- Set a strong unique `ADMIN_PASSWORD`, and use an email you actually control for production. The Yopmail example is only a development placeholder; public mailboxes are inappropriate for privileged account recovery.
- Optional `ADMIN_PHONE` must be an E.164 valid phone if supplied; normal registration always requires a phone.
- `DEFAULT_PROFILE_IMAGE_URL` may contain your public Cloudinary image URL; uploads arrive in Part 2.
- The web client will be `http://localhost:5173`, backend `http://localhost:6050`. Do not mix localhost and 127.0.0.1 for cookie testing.
- Do not commit `.env` or use real secrets in `.env.example`.

## 3. Seed admin (once per database)

```powershell
npm run seed:admin
```

Idempotent; no public route can create admins. A preexisting non-admin with the seed email causes the script to fail rather than promote it. Admin email is reserved from public registration. Run this from a trusted local terminal with the target database credentials before making the API public. The script does not reset existing admin passwords.

## 4. Start & test

```powershell
npm test
npm run dev
```

Open http://localhost:6050/health (requires MongoDB and Redis) and http://localhost:6050/api-docs. Use Postman or Swagger UI. The current source has syntax and built-in helper tests checked in the generation environment; npm dependencies and live integrations must be checked locally.

## 5. API sequence

Use `Content-Type: application/json` on POST requests and `X-FleetFlow-Client: web` on refresh/logout. Postman should retain the refresh cookie. Browser Axios must use `withCredentials: true`, and send the custom header on those routes. Login and refresh return `data.accessToken` in JSON; the refresh JWT is HttpOnly cookie only. For protected requests use `Authorization: Bearer <accessToken>`.

| Method | Path | JSON body |
|---|---|---|
| POST | /auth/register | name, email, phone (E.164), role, password, confirmPassword |
| POST | /auth/verify-email | email, otp (string) |
| POST | /auth/resend-otp | reverifyToken |
| POST | /auth/login | email, password |
| GET | /auth/me | none; bearer token |
| POST | /auth/refresh-token | {} and cookie + custom header |
| POST | /auth/forgot-password | email |
| POST | /auth/reset-password | email, otp, password, confirmPassword |
| POST | /auth/logout | {} and cookie + custom header |

Example registration (replace email with your own real mailbox):

```json
{"name":"Test Customer","email":"you@example.com","phone":"+919876543210","role":"customer","password":"FleetFlow@123","confirmPassword":"FleetFlow@123"}
```

1. Register. Save `data.reverifyToken`, check `data.otpSent`, and immediately enter the emailed code at `/auth/verify-email`.
2. Verify that login fails before verification with `EMAIL_NOT_VERIFIED`; its `details.reverifyToken` allows recovery. After 60 seconds use `/auth/resend-otp`; use its new code. Email links use `/#verify=...` and are intentionally not functional until the frontend modal is implemented. The frontend must read then remove the fragment with replaceState, and only POST on explicit user action. Resend requires a signed 24-hour purpose-specific token; an expired link is recovered by valid credential login.
3. After verification, login and save the access token. Check `/auth/me`, then refresh, then check the new access token. Reusing a rotated refresh token fails. Serialize refresh requests in the frontend, including across tabs where possible.
4. Logout and verify that the access token no longer works. For reset: request a code, enter it within 60 seconds, and confirm all existing sessions stop working. Forgot-password always gives a generic response, including for unknown accounts. SMTP acceptance and delivery can differ.
5. Try admin registration, password mismatch, invalid phone, incorrect OTP five times, expired OTP, resend before cooldown, and password reset OTP in verification endpoint (must fail).

Response structure: `{success:true,message,data}` or `{success:false,code,message,details?}`. Error `OTP_COOLDOWN` provides `details.retryAfter`; use it to update the frontend countdown. OTP issuance and attempts are atomic in Redis; HMAC-protected OTPs are single-use. If delivery fails, the OTP is cancelled and the account remains unverified. Email/password recovery rate limits are in Redis. Email OTPs expire 60 seconds from generation, not from receipt.

## 6. Vercel (REST authentication)

Use the provided `api/index.js` Express export and rewrite configuration. Set all required environment variables in the Vercel dashboard; `NODE_ENV=production`, `FRONTEND_URL` to the exact deployed HTTPS frontend origin, `BACKEND_URL` to the exact backend origin. Verify `/health` and `/api-docs` after deployment. This deployment configuration is supplied but not live-tested. No `app.listen()` in the serverless entry. SMTP port 587 or 465 is supported by Vercel (port 25 is blocked). Verify actual provider acceptance and duration limits. Consider Vercel's modern Express framework detection if the legacy `/api` entry configuration conflicts; do not deploy two entry points simultaneously.

Cookie strategy: `lax` for same-site deployment, preferably app.example.com and api.example.com. Separate unrelated domains may require `COOKIE_SAME_SITE=none` with HTTPS, but third-party cookie blocking may still prevent login persistence. Prefer same-site domains or a same-origin frontend proxy. Never use wildcard CORS with credentials. `TRUST_PROXY=0` is the safe local default; in a proxied deployment set the correct trusted hop count only after verifying your platform's forwarding behavior. If left at 0 behind a proxy, the IP rate limits can be shared by clients. Do not blindly trust arbitrary forwarded headers.

## 7. Known limits and next increment

- No live MongoDB/Redis/SMTP tests or npm install were possible in the generation environment. Run `npm test` locally; core tests can run before install with `node --test test/core.test.js`.
- Redis and MongoDB writes are not one distributed transaction. A consumed OTP can require reissue if a DB write fails. Account creation can succeed while Redis/email is unavailable; login with valid credentials can resume verification. Old Redis session records expire automatically after password reset, but are immediately unusable because the database session version changes.
- Login/registration indicate duplicate or unverified account state as requested; public forgot-password response avoids direct enumeration but timing can differ. Production abuse protections and monitoring should be reviewed before real user launch.
- Next: profile upload, MongoDB aggregation for account age, durable notifications and Socket.IO. Frontend retains `main.tsx`, uses your design and breakpoints, and implements these API contracts. No frontend files are modified in this increment.
