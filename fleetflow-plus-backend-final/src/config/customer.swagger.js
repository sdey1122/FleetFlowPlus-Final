const string = { type: "string" },
  num = { type: "number" },
  id = { type: "string", pattern: "^[a-fA-F0-9]{24}$" };
const place = {
  type: "object",
  required: ["label", "lat", "lon"],
  properties: {
    label: { type: "string", example: "Kolkata, India" },
    lat: { type: "number", example: 22.5726 },
    lon: { type: "number", example: 88.3639 },
  },
};
const address = {
  type: "string",
  example: "House 12, Sample Street, Kolkata 700001",
};
const phone = { type: "string", example: "+919876543210" };
const body = (properties) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        additionalProperties: false,
        properties,
        required: Object.keys(properties).filter(
          (k) => !["instructions", "imageData"].includes(k),
        ),
      },
    },
  },
});
const param = (name, schema = id, where = "path") => ({
  name,
  in: where,
  required: where === "path",
  schema,
});
const endpoint = (
  summary,
  {
    publicRoute = false,
    requestBody,
    parameters = [],
    pdf = false,
    tag = "Customer shipments",
  } = {},
) => ({
  tags: [tag],
  summary,
  ...(!publicRoute ? { security: [{ bearerAuth: [] }] } : {}),
  ...(requestBody ? { requestBody } : {}),
  ...(parameters.length ? { parameters } : {}),
  responses: {
    200: {
      description: "Success",
      ...(pdf
        ? {
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" },
              },
            },
          }
        : {}),
    },
    201: { description: "Created" },
    400: { description: "Validation or request error" },
    401: { description: "Authentication required" },
    403: { description: "Role forbidden" },
    404: { description: "Not found" },
    409: { description: "State conflict" },
    429: { description: "Rate limited" },
    503: { description: "Provider unavailable" },
  },
});
const shipment = {
  pickup: place,
  destination: place,
  pickupAddress: address,
  deliveryAddress: address,
  senderName: { type: "string", example: "Sender Name" },
  senderPhone: phone,
  recipientName: { type: "string", example: "Recipient Name" },
  recipientPhone: phone,
  category: {
    type: "string",
    enum: ["documents", "personal", "retail", "bulk", "urgent"],
  },
  description: { type: "string", example: "Books" },
  weight: { type: "number", example: 0.5, maximum: 100 },
  length: { type: "number", example: 20 },
  width: { type: "number", example: 15 },
  height: { type: "number", example: 10 },
  instructions: { type: "string", example: "" },
  declaredSafe: { type: "boolean", example: true },
};
module.exports = {
  "/shipments/places": {
    get: endpoint("Search Indian locations", {
      publicRoute: true,
      parameters: [
        param("q", { type: "string", example: "Kolkata" }, "query"),
        param("autocomplete", { type: "boolean" }, "query"),
      ],
    }),
  },
  "/shipments/route": {
    post: endpoint("Calculate a road route", {
      publicRoute: true,
      requestBody: body({ pickup: place, destination: place }),
    }),
  },
  "/shipments/quotes": {
    post: endpoint("Generate a 15-minute shipment quote", {
      requestBody: body(shipment),
    }),
  },
  "/shipments/orders": {
    get: endpoint("List own orders", {
      parameters: [
        param("page", { type: "integer", default: 0 }, "query"),
        param("limit", { type: "integer", default: 10 }, "query"),
        param("search", string, "query"),
        param(
          "payment",
          { type: "string", enum: ["all", "paid", "pending", "failed"] },
          "query",
        ),
        param(
          "sort",
          {
            type: "string",
            enum: ["createdAt", "number", "amount", "paymentStatus", "status"],
          },
          "query",
        ),
        param("direction", { type: "string", enum: ["asc", "desc"] }, "query"),
      ],
    }),
    post: endpoint("Create shipment order / Razorpay checkout", {
      requestBody: body({
        quoteId: id,
        tier: {
          type: "string",
          enum: ["lite", "standard", "prime", "express"],
        },
      }),
    }),
  },
  "/shipments/orders/{id}": {
    get: endpoint("Get own order details", { parameters: [param("id")] }),
  },
  "/shipments/orders/{id}/checkout": {
    post: endpoint("Resume checkout for existing order", {
      parameters: [param("id")],
      requestBody: body({}),
    }),
  },
  "/shipments/orders/{id}/verify": {
    post: endpoint("Verify Razorpay callback and capture status", {
      parameters: [param("id")],
      requestBody: body({
        razorpay_order_id: string,
        razorpay_payment_id: string,
        razorpay_signature: string,
      }),
    }),
  },
  "/shipments/orders/{id}/sync": {
    post: endpoint("Reconcile payment status with Razorpay", {
      parameters: [param("id")],
      requestBody: body({}),
    }),
  },
  "/shipments/orders/{id}/receipts/{paymentId}": {
    get: endpoint("Download paid receipt or failed transaction PDF", {
      parameters: [param("id"), param("paymentId", string)],
      pdf: true,
    }),
  },
  "/shipments/overview": {
    get: endpoint("Customer order and expense aggregation", {
      parameters: [
        param(
          "months",
          {
            type: "integer",
            enum: [0, 3, 6, 12],
            default: 12,
            description:
              "0 = today; otherwise calendar months ending at the selected year anchor",
          },
          "query",
        ),
        param(
          "year",
          {
            type: "integer",
            minimum: 2000,
            description: "Default: current IST year; current year + 2 maximum",
          },
          "query",
        ),
        param(
          "grouping",
          { type: "string", enum: ["daily", "weekly"], default: "weekly" },
          "query",
        ),
      ],
    }),
  },
  "/shipments/profile": {
    patch: endpoint("Update customer bio, DOB and optional profile image", {
      requestBody: body({
        bio: string,
        dob: { type: "string", format: "date", nullable: true },
        imageData: {
          type: "string",
          description: "JPEG/PNG/WebP data URI, maximum 600 KB decoded",
        },
      }),
    }),
  },
  "/notifications": {
    get: endpoint("List own notifications", { tag: "Notifications" }),
  },
  "/notifications/read-all": {
    patch: endpoint("Mark own notifications as read", { tag: "Notifications" }),
  },
  "/notifications/{id}/read": {
    patch: endpoint("Mark one own notification as read", {
      parameters: [param("id")],
      tag: "Notifications",
    }),
  },
  "/contact": {
    post: endpoint("Submit a contact enquiry", {
      publicRoute: true,
      tag: "Contact",
      requestBody: body({
        name: string,
        email: { type: "string", format: "email" },
        message: string,
      }),
    }),
  },
};
