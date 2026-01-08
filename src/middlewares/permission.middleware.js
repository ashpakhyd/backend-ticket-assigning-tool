// src/middlewares/permission.middleware.js
const ROLE_PERMISSIONS = require("../constants/roles");

module.exports = (requiredPermission) => {
  return (req, res, next) => {
    const role = req.user.role;
    const permissions = ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: "Permission denied"
      });
    }

    next();
  };
};
