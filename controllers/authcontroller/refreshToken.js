const refreshAuthToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: "NO_REFRESH", message: "No refresh token provided" },
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const { authToken } = generateTokens({
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified,
    });

    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    return res
      .status(200)
      .json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: "INVALID_REFRESH", message: "Invalid refresh token" },
    });
  }
};

export default refreshAuthToken;
