const express = require("express");
const router = express.Router();

router.use("/category",  require("../admin/category.routes"));  
router.use("/subcategory",  require("../admin/subCategory.routes"));  
router.use("/service",  require("../admin/service.routes"));  
router.use("/master-fields", require("../admin/masterFields.routes"))
router.use("/bundle",  require("../admin/bundleService.routes"));  
router.use("/department",  require("../admin/department.routes"));  
router.use("/employee",  require("../admin/employee.routes"));  
router.use("/blogs",  require("../admin/blogs.routes"));  
router.use("/payments",  require("../admin/payments.routes"));  
router.use("/service-requests",  require("../admin/serviceRequest.routes"));  
router.use("/applications",  require("../admin/applications.routes"));
router.use("/application-history", require("../admin/applicationHistory.routes"))  
router.use("/utm", require("../admin/utm.routes"))
router.use("/email",require("../../email/routes/emailRoutes"))
router.use("/settings",require("../../paymentSetting/PaymentSetting"))


module.exports = router;  