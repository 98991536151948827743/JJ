import express from "express";
import  authMiddleware  from "../middleware/authMiddleware.js";
import { getProfile } from "../controllers/profile/profile.controller.js";
import { updateProfile } from "../controllers/profile/updateProfile.controller.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/update-profile", authMiddleware, updateProfile);

export default router;
