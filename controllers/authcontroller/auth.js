import Student from "../../model/student.model.js";
import Member from "../../model/postHolder.model.js";
import OTP from "../../model/otp.model.js";
import sendOtpToUser from "../../nodemailer/SendOTP.js";
import jwt from "jsonwebtoken";
import { validateInput } from "../../utils/validator/generalValidator.js";
import { isValidInstituteEmail } from "../../utils/validator/emailValidator.js";

/* Helper: create a signed cookie token to carry otpSession (not raw email) */
const signOtpSession = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });

const signVerifiedEmailToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // short window to complete registration

const signAuthToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" }); // shorter than 30d

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  // do not set maxAge here; set per-cookie where needed
};

/** ------------------ Helper: Generate Tokens ------------------ **/
const generateTokens = (payload) => {
  const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { authToken, refreshToken };
};

/** ------------------ Check Login ------------------ **/
export const checkLogin = async (req, res) => {
  try {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(200).json({ loggedIn: false });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(200).json({ loggedIn: false });
    }

    const { email, isVerified, role } = decoded;
    if (!isVerified || !email || !role) {
      return res.status(200).json({ loggedIn: false });
    }

    // Find user by role
    let user;
    if (role === "student") {
      user = await Student.findOne({ email });
    } else if (role === "member") {
      user = await Member.findOne({ email });
    }

    if (!user) {
      return res.status(200).json({ loggedIn: false });
    }

    return res.status(200).json({
      loggedIn: true,
      redirectTo: "/homepage",
      user,
      role,
    });
  } catch (error) {
    return res.status(200).json({ loggedIn: false });
  }
};

// 1. Send OTP to email
export const sendOTP = async (req, res) => {
  try {
    //validating the input from user
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    const { valid, errors } = validateInput({ email });
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }
    if (!isValidInstituteEmail(email)) {
      return res
        .status(400)
        .json({ message: "Enter your institute email only" });
    }

    // Send OTP
    try {
      await sendOtpToUser(email);
      console.log("OTP sent successfully!");
    } catch (error) {
      console.error("Failed to send OTP:", error.message || error);
      // You can also send error response if this is in a controller
      return res.status(500).json({
        success: false,
        message: "Something went wrong while sending OTP",
        error: error.message || error,
      });
    }
    // Sign a temporary token with isVerified = false
    const otpSessionToken = signOtpSession({ email });
    res.cookie("otpSession", otpSessionToken, {
      ...COOKIE_OPTIONS, // Prevent CSRF
      maxAge: 10 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("sendOTP error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

//verify Otp scene from here
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    // Read session cookie to know which email this OTP is for
    const otpSessionToken = req.cookies?.otpSession;
    if (!otpSessionToken) {
      return res
        .status(400)
        .json({ success: false, message: "OTP session missing or expired" });
    }
    let session;
    try {
      session = jwt.verify(otpSessionToken, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "OTP session invalid or expired" });
    }
    const email = session.email;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "OTP session invalid" });
    }
    const { valid, errors } = validateInput({ email, otp });
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email (cookie) and OTP (body) are required",
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // ✅ Nullify OTP instead of deleting doc
    otpRecord.otp = null;
    await otpRecord.save();

    // ✅ Check both Student and Member
    let existingUser = await Student.findOne({ email });
    let role = "student";

    if (!existingUser) {
      existingUser = await Member.findOne({ email });
      if (existingUser) {
        role = "member";
      }
    }
    if (existingUser) {
      //clear existing session
      res.clearCookie("otpSession");
      // Create signed JWT for verified session
      const { authToken, refreshToken } = generateTokens({
        email,
        isVerified: true,
        role,
      });

      // Set HttpOnly cookie
      res.cookie("authToken", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, // 15 days
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "User verified and logged in",
        userExists: true,
        role,
        redirectTo: "/homepage",
      });
    } else {
      // user does not exist --- create short-lived "verifiedEmail" token to allow registration
      const verifiedEmailToken = signVerifiedEmailToken({
        email,
        verified: true,
      });
      res.cookie("verifiedEmail", verifiedEmailToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1 * 60 * 60 * 1000, // 1 hour to complete registration
      });

      // clear otpSession cookie
      res.clearCookie("otpSession");

      return res.status(200).json({
        success: true,
        message: "OTP verified. Please complete registration.",
        userExists: false,
        redirectTo: "/register",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};

// 3. Register new user
const DEFAULT_PROFILE_IMAGE = ""; // we have to replace it --- take a array of link and randomly allot

export const registerUser = async (req, res) => {
  try {
    const { role, fullName, year, department, designation, profileImage } =
      req.body;

    if (!role || !["student", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ROLE",
          message: "Role must be either 'student' or 'member'",
        },
      });
    }

    // Get verified email from token (set earlier during OTP verification)
    const verifiedToken = req.cookies?.verifiedEmail;
    if (!verifiedToken) {
      return res.status(401).json({
        success: false,
        message: "Email not verified or verification expired",
      });
    }

    let payload;
    try {
      payload = jwt.verify(verifiedToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Verification token invalid or expired",
      });
    }

    const email = payload.email;
    if (!email || !payload.verified) {
      return res.status(401).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    // Check if already exists
    const existingStudent = await Student.findOne({ email });
    const existingMember = await Member.findOne({ email });

    if (existingStudent || existingMember) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Use provided profile image or default
    const profileImg = profileImage || DEFAULT_PROFILE_IMAGE;

    let newUser;

    if (role === "student") {
      if (!year || !department) {
        return res.status(400).json({
          success: false,
          message: "Year and department are required for students",
        });
      }

      newUser = await Student.create({
        fullName,
        email,
        expectedPassoutDate: year,
        department,
        profileImage: profileImg,
      });
    } else if (role === "member") {
      if (!designation || !department) {
        return res.status(400).json({
          success: false,
          message: "Designation and department are required for members",
        });
      }

      newUser = await Member.create({
        fullName,
        email,
        designation,
        department,
        profileImage: profileImg,
      });
    }

    // Create signed JWT for authenticated session
    const { authToken, refreshToken } = generateTokens({
      email,
      isVerified: true,
      role,
    });

    // Set HttpOnly cookie
    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Clear the verifiedEmail cookie
    res.clearCookie("verifiedEmail");

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: newUser,
      redirectTo: "/homepage",
    });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/** ------------------ Logout ------------------ **/
export const logoutUser = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
