// middlewares/appAccess.middleware.js
const validateAppAccess = (req, res, next) => {
  const appType = req.headers['x-app-type'] || req.body.appType;
  const user = req.user;
  
  if (!user || !appType) {
    return next();
  }
  
  const roleAppMap = {
    'ADMIN': 'admin',
    'TECHNICIAN': 'technician',
    'CUSTOMER': 'customer'
  };
  
  if (roleAppMap[user.role] !== appType) {
    return res.status(403).json({ 
      message: "Access denied for this app",
      allowedApp: roleAppMap[user.role]
    });
  }
  
  next();
};

module.exports = { validateAppAccess };