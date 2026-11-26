const swaggerJsDoc = require("swagger-jsdoc");

// Common field schemas
const string = {
  type: "string",
};

const name = {
  type: "string",
  minLength: 3,
  maxLength: 32,
  example: "FleetFlow Customer",
};

const email = {
  type: "string",
  format: "email",
  example: "customer@example.com",
};

const phone = {
  type: "string",
  pattern: "^\\+[1-9]\\d{6,14}$",
  description:
    "International E.164 phone number including country calling code. Supports India (+91), USA (+1), UK (+44), Russia (+7) and other countries.",
  example: "+919876543210",
};

const password = {
  type: "string",
  format: "password",
  minLength: 9,
  maxLength: 32,
  description:
    "Must contain at least one uppercase letter, one lowercase letter and one special character. Maximum 72 UTF-8 bytes.",
  example: "FleetFlow@123",
};

const confirmPassword = {
  ...password,
  description: "Must exactly match the password.",
};

const otp = {
  type: "string",
  pattern: "^[0-9]{6}$",
  description: "Six-digit OTP received by email. Valid for 60 seconds.",
  example: "123456",
};

const role = {
  type: "string",
  enum: ["customer", "dispatcher", "driver"],
  description: "Admin accounts cannot be registered publicly.",
  example: "customer",
};

// JSON request body helper
const json = (properties) => ({
  required: true,

  content: {
    "application/json": {
      schema: {
        type: "object",
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
      },
    },
  },
});

// POST route helper
const route = (summary, fields, options = {}) => ({
  post: {
    tags: ["Authentication"],

    summary,

    requestBody: json(fields),

    ...(options.cookie
      ? {
          security: [{ refreshCookie: [] }],

          parameters: [
            {
              in: "header",
              name: "X-FleetFlow-Client",
              required: true,

              schema: {
                type: "string",
                enum: ["web"],
                example: "web",
              },
            },
          ],
        }
      : {}),

    responses: {
      [options.created ? 201 : 200]: {
        description: "Success",
      },

      400: {
        description: "Invalid request or validation error",
      },

      401: {
        description: "Invalid credentials or expired session",
      },

      403: {
        description: "Forbidden or email not verified",
      },

      409: {
        description: "Conflict, such as duplicate email or phone number",
      },

      429: {
        description: "Too many requests or OTP cooldown",
      },

      500: {
        description: "Internal server error",
      },

      503: {
        description: "Service or email delivery unavailable",
      },
    },
  },
});

// API endpoints
const paths = {
  "/health": {
    get: {
      tags: ["Server"],

      summary: "Database and Redis health",

      responses: {
        200: {
          description: "Healthy",
        },

        500: {
          description: "Unavailable",
        },
      },
    },
  },

  // Registration
  "/auth/register": route(
    "Register a new account",
    {
      name,
      email,
      phone,
      role,
      password,
      confirmPassword,
    },
    { created: true },
  ),

  // Email verification
  "/auth/verify-email": route("Verify email using OTP", {
    email,
    otp,
  }),

  // Resend OTP
  "/auth/resend-otp": route("Resend verification OTP", {
    reverifyToken: {
      ...string,
      description:
        "Reverification token received during registration or an unverified-account login attempt.",
      example: "PASTE_YOUR_REVERIFY_TOKEN",
    },
  }),

  // Login
  "/auth/login": route("Login to FleetFlow Plus", {
    email,
    password,
  }),

  // Refresh access token
  "/auth/refresh-token": route(
    "Refresh access token and rotate refresh cookie",
    {},
    { cookie: true },
  ),

  // Forgot password
  "/auth/forgot-password": route("Request password reset OTP", {
    email,
  }),

  // Reset password
  "/auth/reset-password": route("Reset password using OTP", {
    email,
    otp,

    password: {
      ...password,
      example: "NewFleetFlow@123",
    },

    confirmPassword: {
      ...confirmPassword,
      example: "NewFleetFlow@123",
    },
  }),

  // Logout
  "/auth/logout": route("Logout and revoke session", {}, { cookie: true }),

  // Current authenticated user
  "/auth/me": {
    get: {
      tags: ["Authentication"],

      summary: "Get current authenticated account",

      security: [{ bearerAuth: [] }],

      responses: {
        200: {
          description: "Account retrieved successfully",
        },

        401: {
          description: "Unauthorized or session expired",
        },
      },
    },
  },
};

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "FleetFlow Plus API",
      version: "1.0.0",
      description:
        "FleetFlow Plus — Fleet and Logistics Management System API Documentation",
    },

    servers: [
      {
        url: "/",
        description: "Current Server",
      },
      {
        url: "http://localhost:6050",
        description: "Local Development Server",
      },
      {
        url: "https://fleet-flow-plus-final.vercel.app",
        description: "Vercel Backend Server",
      },
      {
        url: "https://your-service.onrender.com",
        description: "Render Backend Server",
      },
    ],

    tags: [
      {
        name: "Server",
        description: "Server and database health",
      },

      {
        name: "Authentication",
        description: "Registration, verification, login and session management",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        refreshCookie: {
          type: "apiKey",
          in: "cookie",
          name: "fleetflow_refresh",
        },
      },
    },

    paths,
  },

  apis: [],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
