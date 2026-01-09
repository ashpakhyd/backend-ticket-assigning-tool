// routes/comment.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const permit = require("../middlewares/permission.middleware");
const P = require("../constants/permissions");
const upload = require("../utils/upload");
const ctrl = require("../controllers/comment.controller");

router.post("/:id/comment", auth, ctrl.addComment);
router.post("/:id/attachment", auth, upload.single("file"), ctrl.uploadAttachment);
router.get("/:id/comments", auth, ctrl.getComments);
router.delete("/:id/comments/:commentId", auth, permit(P.DELETE_COMMENT), ctrl.deleteComment);

module.exports = router;
