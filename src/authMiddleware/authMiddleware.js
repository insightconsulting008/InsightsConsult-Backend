const jwt = require("jsonwebtoken");
const config = require('../utils/config')

/* ======================
   AUTHENTICATION MIDDLEWARE
   (Checks JWT Access Token)
====================== */
const authenticate = (req, res, next) => {
  try {
  const authHeader = req.headers.authorization;

  // No Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token missing or invalid"
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, config.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // decoded = { userId, email, role, iat, exp }
    req.user = decoded;
    next();
  });

} catch (error) {
  return res.status(500).json({
    success: false,
    message: "Authentication failed"
  });
}
};

/* ======================
   ROLE AUTHORIZATION
   (USER / STAFF / ADMIN)
====================== */
const authorizeRoles = (allowedRoles) => {
   
    return (req, res, next) => {

      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }


      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action"
        });
      }
      next();
    };
  };
  

/* ======================
   EXPORT BOTH
====================== */
module.exports = {
  authenticate,
  authorizeRoles
};
