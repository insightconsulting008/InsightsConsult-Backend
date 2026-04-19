const express = require("express");
const router = express.Router();


router.use("/V1",        require("./auth.routes"));        // refresh, logout
router.use("/setup",        require("./adminSetup.routes"));        // refresh, logout
router.use("/staff",  require("./staff.auth.routes"));  // staff login
router.use("/user",   require("./user.auth.routes"));   // user login


module.exports = router;  