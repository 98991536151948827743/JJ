import jwt from "jsonwebtoken";

// Middleware to authenticate user
const authMiddleware = async (req, res, next) => {
  try {
    const authToken = req.cookies?.authToken;
    const refreshToken = req.cookies?.refreshToken;

    // If neither token exists → user not logged in
    if (!authToken && !refreshToken) {
      req.loggedIn = false;
      return res.status(401).json({
        success: false,
        loggedIn: false,
        message: "Not authenticated. Please log in.",
        redirectTo: "/login",
      });
    }

    let decoded;

    // Verify access token first
    if (authToken) {
      try {
        decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decoded;
        req.loggedIn = true;
        return next();
      } catch (err) {
        console.warn("Auth token expired or invalid:", err.message);
      }
    }

    // If access token invalid but refresh token exists → verify refresh token
    if (refreshToken) {
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Optionally: generate new access token here
        const newAuthToken = jwt.sign(
          { email: decoded.email, role: decoded.role, isVerified: decoded.isVerified, loggedIn: true },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        // Set new auth token cookie
        res.cookie("authToken", newAuthToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 15 * 60 * 1000, // 15 min
        });

        req.user = decoded;
        req.loggedIn = true;
        return next();
      } catch (err) {
        console.warn("Refresh token invalid:", err.message);
      }
    }

    // If both tokens invalid
    req.loggedIn = false;
    return res.status(403).json({
      success: false,
      loggedIn: false,
      message: "Session expired or invalid. Please log in again.",
      redirectTo: "/login",
    });
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      loggedIn: false,
      message: "Server error during authentication",
    });
  }
};

export default authMiddleware;
