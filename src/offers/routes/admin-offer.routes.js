const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ctrl = require("../controllers/admin-offer.controller");

/**
 * ADMIN → Create Offer
 */
router.post(
  "/",
  auth,
  role("ADMIN"),
  ctrl.createOffer
);

/**
 * ADMIN → Get All Offers (with filters, search, pagination)
 */
router.get(
  "/",
  auth,
  role("ADMIN"),
  ctrl.getAllOffers
);

/**
 * ADMIN → Get Single Offer
 */
router.get(
  "/:id",
  auth,
  role("ADMIN"),
  ctrl.getSingleOffer
);

/**
 * ADMIN → Update Offer
 */
router.put(
  "/:id",
  auth,
  role("ADMIN"),
  ctrl.updateOffer
);

/**
 * ADMIN → Delete Offer
 */
router.delete(
  "/:id",
  auth,
  role("ADMIN"),
  ctrl.deleteOffer
);

/**
 * ADMIN → Update Offer Status (Activate/Deactivate/Publish)
 */
router.patch(
  "/:id/status",
  auth,
  role("ADMIN"),
  ctrl.updateOfferStatus
);

/**
 * ADMIN → Get Offer Complete Details (Analytics + Redemptions + Activity)
 */
router.get(
  "/:id/details",
  auth,
  role("ADMIN"),
  ctrl.getOfferDetails
);

/**
 * ADMIN → Verify Redemption Code & Mark as Used
 */
router.post(
  "/redemptions/verify",
  auth,
  role("ADMIN"),
  ctrl.verifyRedemption
);

/**
 * ADMIN → Get All Redemptions (across all offers)
 */
router.get(
  "/redemptions/all",
  auth,
  role("ADMIN"),
  ctrl.getAllRedemptions
);

/**
 * ADMIN → Bulk Operations on Offers
 */
router.post(
  "/bulk-actions",
  auth,
  role("ADMIN"),
  ctrl.bulkOfferActions
);

module.exports = router;