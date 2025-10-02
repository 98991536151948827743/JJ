import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  registerUser,
  checkLogin,
  logoutUser,
  refreshAuthToken,
} from "../controllers/authcontroller/auth.js";

const router = Router();

// ---------------- AUTH ROUTES ---------------- //
router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/register", registerUser);

router.get("/check-login", checkLogin);

router.post("/logout", logoutUser);

router.get("/refresh-token", refreshAuthToken);

// ---------------- HEALTH CHECK ---------------- //
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ---------------- ERROR HANDLING ---------------- //
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message || err,
  });
});

export default router;
