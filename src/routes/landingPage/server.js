const express = require("express");
const router = express.Router();


router.use("/blogs",  require("../landingPage/blogs.routes"));  
router.use("/forms",  require("../landingPage/forms.routes"));
router.use("/service",  require("../landingPage/service.routes"));  


module.exports = router;  