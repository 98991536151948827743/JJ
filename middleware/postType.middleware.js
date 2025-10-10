// Middleware to determine postType before creating post
export const postTypeMiddleware = (req, res, next) => {
  try {
    const { content, attachments } = req.body;

    let postType;

    if (content && attachments && attachments.length > 0) {
      postType = "text+media";
    } else if (content && content.trim() !== "") {
      postType = "text";
    } else if (attachments && attachments.length > 0) {
      postType = "media";
    } else {
      postType = "empty"; // ❌ block empty posts if required
    }

    // Attach postType to request body
    req.body.postType = postType;

    // Optionally: prevent saving "empty" posts
    if (postType === "empty") {
      return res.status(400).json({
        success: false,
        message: "Cannot create an empty post",
      });
    }

    next();
  } catch (error) {
    console.error("Error in postType middleware:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
