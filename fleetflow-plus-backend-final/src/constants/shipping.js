const TIERS = {
  lite: { label: "FleetFlow Lite", multiplier: 100 },
  standard: { label: "FleetFlow Standard", multiplier: 125 },
  prime: { label: "FleetFlow Prime", multiplier: 150 },
  express: { label: "FleetFlow Express", multiplier: 185 },
};
const GOODS = ["documents", "personal", "retail", "bulk", "urgent"];
module.exports = {
  TIERS,
  GOODS,
  PLATFORM_FEE: 5000,
  GST: 18,
  QUOTE_MINUTES: 15,
};
