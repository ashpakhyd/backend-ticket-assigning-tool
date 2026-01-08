// routes/comment.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const upload = require("../utils/upload");
const ctrl = require("../controllers/comment.controller");

router.post("/:id/comment", auth, ctrl.addComment);
router.post("/:id/attachment", auth, upload.single("file"), ctrl.uploadAttachment);
router.get("/:id/comments", auth, ctrl.getComments);

module.exports = router;
