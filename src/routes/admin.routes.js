// routes/admin.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const ctrl = require("../controllers/admin.controller");

/**
 * ADMIN → Manually verify technician
 */
router.patch(
  "/technicians/:technicianId/verify",
  auth,
  role("ADMIN"),
  ctrl.verifyTechnician
);

/**
 * ADMIN → Deactivate technician
 */
router.patch(
  "/technicians/:technicianId/deActivate",
  auth,
  role("ADMIN"),
  ctrl.deactivateTechnician
);

/**
 * ADMIN → Activate technician
 */
router.patch(
  "/technicians/:technicianId/activate",
  auth,
  role("ADMIN"),
  ctrl.activateTechnician
);

/**
 * ADMIN → Get all customers list
 */
router.get(
  "/customers",
  auth,
  role("ADMIN"),
  ctrl.getAllCustomers
);

/**
 * ADMIN → Manually verify customer
 */
router.patch(
  "/customers/:customerId/verify",
  auth,
  role("ADMIN"),
  ctrl.verifyCustomer
);

/**
 * ADMIN → Deactivate customer
 */
router.patch(
  "/customers/:customerId/deactivate",
  auth,
  role("ADMIN"),
  ctrl.deactivateCustomer
);

/**
 * ADMIN → Activate customer
 */
router.patch(
  "/customers/:customerId/activate",
  auth,
  role("ADMIN"),
  ctrl.activateCustomer
);

module.exports = router;