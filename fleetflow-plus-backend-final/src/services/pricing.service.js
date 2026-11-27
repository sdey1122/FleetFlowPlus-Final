const { TIERS, PLATFORM_FEE, GST } = require("../constants/shipping");
const { apiError } = require("../utils/apiResponse");
// Integer paise; chargeable weight rounded UP to the next 0.5 kg.
function price(shipment, distanceMeters) {
  const { weight, length, width, height } = shipment;
  if (
    ![weight, length, width, height, distanceMeters].every(
      (x) => Number.isFinite(x) && x > 0,
    )
  )
    throw apiError(
      400,
      "INVALID_MEASUREMENTS",
      "Positive dimensions, weight and distance are required.",
    );
  const volumetric = (length * width * height) / 5000;
  const chargeable = Math.ceil(Math.max(weight, volumetric) * 2) / 2;
  if (weight > 100 || chargeable > 100)
    throw apiError(
      400,
      "WEIGHT_LIMIT",
      "Actual and chargeable weight must not exceed 100 kg.",
    );
  return Object.entries(TIERS).map(([tier, t]) => {
    const delivery = Math.round(
      ((4000 + (distanceMeters / 1000) * 25 + chargeable * 1500) *
        t.multiplier) /
        100,
    );
    const tax = Math.round(((delivery + PLATFORM_FEE) * GST) / 100);
    return {
      tier,
      label: t.label,
      delivery,
      platformFee: PLATFORM_FEE,
      tax,
      total: delivery + PLATFORM_FEE + tax,
      volumetric,
      chargeable,
      currency: "INR",
    };
  });
}
module.exports = { price };
