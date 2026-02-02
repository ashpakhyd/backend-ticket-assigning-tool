const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/ticket.controller");

// 🔐 RBAC
const permit = require("../middlewares/permission.middleware");
const P = require("../constants/permissions");

/**
 * CREATE TICKET
 * ADMIN + CUSTOMER
 */
router.post(
  "/",
  auth,
  permit(P.CREATE_TICKET),
  ctrl.createTicket
);

/**
 * ADMIN → Assign technician
 */
router.patch(
  "/:id/assign",
  auth,
  permit(P.ASSIGN_TECHNICIAN),
  ctrl.assignTechnician
);

/**
 * TECHNICIAN → Update status
 */
router.patch(
  "/:id/status",
  auth,
  permit(P.UPDATE_STATUS),
  ctrl.updateStatus
);

/**
 * ADMIN → View all tickets
 */
router.get(
  "/",
  auth,
  permit(P.VIEW_ALL_TICKETS),
  ctrl.getAllTickets
);

/**
 * TECHNICIAN → View assigned tickets
 */
router.get(
  "/my",
  auth,
  permit(P.VIEW_ASSIGNED_TICKETS),
  ctrl.getMyTickets
);

/**
 * CUSTOMER → View own tickets
 */
router.get(
  "/customer/my",
  auth,
  permit(P.VIEW_OWN_TICKETS),
  ctrl.getCustomerTickets
);

/**
 * GET SINGLE TICKET
 */
router.get(
  "/:id",
  auth,
  ctrl.getSingleTicket
);

module.exports = router;
