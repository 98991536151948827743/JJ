import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";

export const getPostWithDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // current logged-in user
    const userType = req.user.role === "student" ? "Student" : "Member";

    // 1. Get post
    const post = await Post.findById(postId).populate("author", "fullName profilePic");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // 2. Get comments for this post
    const comments = await Comment.find({ postId }).populate("authorId", "fullName profilePic");

    // 3. Get likes count for this post
    const likesCount = await Like.countDocuments({ targetType: "Post", targetId: postId });

    // 4. Check if current user liked this post
    const likedByMe = await Like.exists({
      targetType: "Post",
      targetId: postId,
      userId,
      userType,
    });

    res.json({
      post,
      comments,
      likesCount,
      likedByMe: !!likedByMe,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
