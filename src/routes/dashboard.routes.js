// routes/dashboard.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const ctrl = require("../controllers/dashboard.controller");

router.get(
  "/admin/dashboard/stats",
  auth,
  role("ADMIN"),
  ctrl.getDashboardStats
);

router.get(
  "/admin/dashboard/ticket-status",
  auth,
  role("ADMIN"),
  ctrl.ticketStatusChart
);

router.get(
  "/admin/dashboard/technician-performance",
  auth,
  role("ADMIN"),
  ctrl.technicianPerformance
);

router.get(
  "/admin/dashboard/technician-ratings",
  auth,
  role("ADMIN"),
  ctrl.technicianRatings
);

router.get(
  "/admin/technicians",
  auth,
  role("ADMIN"),
  ctrl.getTechnicians
);

module.exports = router;
