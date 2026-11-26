const ROLES = Object.freeze({
  ADMIN: "admin",
  CUSTOMER: "customer",
  DISPATCHER: "dispatcher",
  DRIVER: "driver",
});
const PUBLIC_ROLES = Object.freeze([
  ROLES.CUSTOMER,
  ROLES.DISPATCHER,
  ROLES.DRIVER,
]);
module.exports = { ROLES, PUBLIC_ROLES };
