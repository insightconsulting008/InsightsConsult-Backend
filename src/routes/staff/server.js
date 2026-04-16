const express = require("express");
const router = express.Router();


router.use("/settings",  require("../staff/staffAccountSetting.routes"));  
router.use("/payments",  require("../staff/payments.routes"));  
router.use("/applications",  require("../staff/applications.routes"));  
router.use("/steps",        require("../staff/steps.routes"));
router.use("/documents",    require("../staff/documents.routes")); 


module.exports = router;  