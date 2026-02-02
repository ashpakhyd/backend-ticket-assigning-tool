const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate");
const ctrl = require("../controllers/ticket.controller");

// 🔐 RBAC
const permit = require("../middlewares/permission.middleware");
const P = require("../constants/permissions");

// Validators
const { createTicketSchema, updateStatusSchema, assignTechnicianSchema } = require("../validators/ticket.validator");

/**
 * CREATE TICKET
 * ADMIN + CUSTOMER
 */
router.post(
  "/",
  auth,
  permit(P.CREATE_TICKET),
  validate(createTicketSchema),
  ctrl.createTicket
);

/**
 * ADMIN → Assign technician
 */
router.patch(
  "/:id/assign",
  auth,
  permit(P.ASSIGN_TECHNICIAN),
  validate(assignTechnicianSchema),
  ctrl.assignTechnician
);

/**
 * TECHNICIAN → Update status
 */
router.patch(
  "/:id/status",
  auth,
  permit(P.UPDATE_STATUS),
  validate(updateStatusSchema),
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
