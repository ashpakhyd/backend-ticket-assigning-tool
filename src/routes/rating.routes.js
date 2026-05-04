// src/routes/rating.routes.js
const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/rating.controller");

// 🔐 RBAC
const permit = require("../middlewares/permission.middleware");
const P = require("../constants/permissions");

/**
 * CUSTOMER → Rate technician (after ticket completed)
 */
router.post(
  "/ratings/tickets/:id/rate",
  auth,
  permit(P.RATE_TECHNICIAN),
  ctrl.rateTicket
);

/**
 * ADMIN → View all ratings
 */
router.get(
  "/admin/ratings",
  auth,
  permit(P.VIEW_DASHBOARD),
  ctrl.getRatings
);

/**
 * TECHNICIAN → View own ratings
 */
router.get(
  "/technician/ratings",
  auth,
  permit(P.VIEW_ASSIGNED_TICKETS),
  ctrl.getMyRatings
);

/**
 * CUSTOMER → View own given ratings
 */
router.get(
  "/customer/ratings",
  auth,
  permit(P.VIEW_OWN_TICKETS),
  ctrl.getMyGivenRatings
);

module.exports = router;
