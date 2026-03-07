const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ctrl = require("../controllers/customer-offer.controller");

/**
 * CUSTOMER → Browse Offers (Available + My Redeemed)
 * Query params: ?type=available OR ?type=my-offers
 */
router.get(
  "/",
  auth,
  role("CUSTOMER"),
  ctrl.browseOffers
);

/**
 * CUSTOMER → Get My Redemption Details by Code
 * IMPORTANT: This route must come BEFORE /:id route
 */
router.get(
  "/redemptions/:redemptionCode",
  auth,
  role("CUSTOMER"),
  ctrl.getMyRedemption
);

/**
 * CUSTOMER → Get Single Offer Details
 */
router.get(
  "/:id",
  auth,
  role("CUSTOMER"),
  ctrl.getSingleOffer
);

/**
 * CUSTOMER → Offer Actions (Redeem/Like/Share)
 */
router.post(
  "/:id/action",
  auth,
  role("CUSTOMER"),
  ctrl.offerAction
);

module.exports = router;