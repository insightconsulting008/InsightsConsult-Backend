// const express = require("express");
// const cors = require("cors");
// const app = express();
// const cookieParser = require("cookie-parser");


// /* -------------------- MIDDLEWARE -------------------- */
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({
//   origin: [
//     "http://localhost:5173",
//     "https://insightsconsult-frontend.onrender.com",
//     "http://localhost:5174",
//     "http://localhost:5175",
//     "https://insightconsultancy.netlify.app",
//     "https://paatima.netlify.app"
//   ], // frontend URL
//   credentials: true
// }));

// /* -------------------- ROUTES -------------------- */
// app.get("/test", async(req, res) => {
//   res.json({
//     message: "Insight Consulting Project Server is running 🚀"
//   });
// });


// app.use("/api/admin",require("../routes/admin/server"));
// app.use("/api/staff",require("../routes/staff/server"));
// app.use("/api/user",require("../routes/user/server"));
// app.use("/api",require("../routes/landingPage/server"));
// app.use("/api/razorpay",require("../webhook/razorpay.webhook"))

// /* -------------------- SERVER -------------------- */
// app.listen(6001, async  () => {
//   console.log(`✅ Insight Consulting Project Server running on port 6001`);
// });
