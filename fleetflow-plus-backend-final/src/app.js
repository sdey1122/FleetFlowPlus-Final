require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { randomBytes } = require("node:crypto");

const { getEnv } = require("./config/env");
const { apiError } = require("./utils/apiResponse");
const swagger = require("./config/swagger");

const app = express();
const env = getEnv();

// Disable Express identification
app.disable("x-powered-by");

// Trust reverse proxy
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));

// Normalize configured backend origins
const backendOrigins = [
  env.backend,
  process.env.RENDER_BACKEND_URL,
  process.env.VERCEL_BACKEND_URL,
  process.env.EMAIL_SERVICE_URL,

  ...(!env.production
    ? ["http://localhost:6050"]
    : []),
]
  .filter((value) => value?.trim())
  .map((value) => new URL(value.trim()).origin);

// Allowed CORS origins
const allowed = new Set([
  // Frontend origin
  env.frontend,

  // Localhost, Render and Vercel backend origins
  ...backendOrigins,

  // Local frontend development origins
  ...(!env.production
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
      ]
    : []),
]);

// Generate CSP nonce
app.use((req, res, next) => {
  res.locals.nonce = randomBytes(16).toString("base64");

  next();
});

// Helmet security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          (req, res) => `'nonce-${res.locals.nonce}'`,
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https://unpkg.com",
        ],

        // Allow Swagger to connect to trusted backends
        connectSrc: [
          "'self'",
          ...new Set(backendOrigins),
        ],

        upgradeInsecureRequests: env.production
          ? []
          : null,
      },
    },
  }),
);

// Interactive email OTP resend route
app.use(
  "/auth/email-resend",
  require("./routes/email.routes"),
);

// Private Render-to-Vercel mail relay
// Must remain before CORS and body parsers
app.use(
  "/internal/email/send-otp",
  require("./routes/mailRelay.routes"),
);

// Global CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests, Swagger,
      // Postman and explicitly trusted browser origins
      if (!origin || allowed.has(origin)) {
        return callback(null, true);
      }

      return callback(
        apiError(
          403,
          "CORS_DENIED",
          "Origin not allowed.",
        ),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-FleetFlow-Client",
    ],

    optionsSuccessStatus: 204,
  }),
);

// JSON body parser
app.use(
  express.json({
    limit: "1mb",
  }),
);

// URL-encoded body parser
app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

// Cookie parser
app.use(cookieParser());

// Server status
app.get("/", (req, res) =>
  res.json({
    success: true,

    message: "FleetFlow Plus Server Working!",

    available_routes: [
      "/health",
      "/api-docs",
      "/auth/register",
      "/auth/verify-email",
      "/auth/resend-otp",
      "/auth/email-resend",
      "/auth/login",
      "/auth/refresh-token",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/logout",
      "/auth/me",
    ],
  }),
);

// Swagger JSON
app.get("/api-docs.json", (req, res) =>
  res.json(swagger),
);

// Swagger UI
app.get("/api-docs", (req, res) =>
  res.send(`
    <!doctype html>

    <html lang="en">

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>FleetFlow Plus API</title>

        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        >

      </head>

      <body>

        <div id="swagger-ui"></div>

        <script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js">
        </script>

        <script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js">
        </script>

        <script nonce="${res.locals.nonce}">

          window.onload = () => {

            window.ui = SwaggerUIBundle({

              url: "/api-docs.json",

              dom_id: "#swagger-ui",

              deepLinking: true,

              withCredentials: true,

              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset,
              ],

              layout: "StandaloneLayout",

            });

          };

        </script>

      </body>

    </html>
  `),
);

// Application routes
app.use(require("./routes/index"));

// Route not found
app.use((req, res, next) =>
  next(
    apiError(
      404,
      "NOT_FOUND",
      "Requested route not found.",
    ),
  ),
);

// Global error middleware
app.use(require("./middleware/error.middleware"));

module.exports = app;