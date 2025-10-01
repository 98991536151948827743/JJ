import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, default: Date.now, expires: 600 }, // TTL 10 min
    lastOtpSent: { type: Date, default: Date.now },
    dailyCount: { type: Number, default: 0 },
    dailyCountDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
