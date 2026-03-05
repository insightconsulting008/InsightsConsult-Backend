const jwt = require('jsonwebtoken');
const config = require('../../src/utils/config')


function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      message: "Token Not Found",
    });
  }

const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Token Malformed",
    });
  }


jwt.verify(token, config.ACCESS_SECRET, (err, decoded) => {

 
    if (err) {
      console.log(err)
      return res.status(401).json({
        message: "Token Invalid",
        error: err.message,
      });
    }

    req.user = decoded; // ✅ IMPORTANT
    

    next();
  });
}

function authorizeRoles(...requiredRoles) {
  return (req, res, next) => {
    // console.log(requiredRoles)
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (requiredRoles && !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied: Insufficient Permissions",
      });
    }

    next();
  };
}

/* ======================
   EXPORT BOTH
====================== */
module.exports = {
  authenticate,
  authorizeRoles
};
