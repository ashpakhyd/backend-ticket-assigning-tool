// routes/address.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/address.controller");

router.get("/", auth, ctrl.getAddresses);
router.post("/", auth, ctrl.addAddress);
router.put("/:id", auth, ctrl.updateAddress);
router.delete("/:id", auth, ctrl.deleteAddress);
router.get("/search", auth, ctrl.searchAddresses);
router.post("/current-location", auth, ctrl.getCurrentLocation);

module.exports = router;