const express = require("express");
const router = express.Router();


router.use("/category",  require("../user/category.routes"));  
router.use("/subcategory", require("../user/subCategory.routes"));  
router.use("/service",  require("../user/service.routes"));  
router.use("/bundle",   require("../user/bundleService.routes"))
router.use("/settings",   require("../user/userAccountSetting.routes"))
router.use("/payments",   require("../user/payments.routes"))
router.use("/my-service", require("../user/myServices.routes"))
router.use("/applications", require("../user/applications.routes"))
router.use("/upload-document", require("../user/documents.routes"))


module.exports = router;  