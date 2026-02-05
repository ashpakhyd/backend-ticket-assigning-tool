// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    
    // Real-time active check
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }
    
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
