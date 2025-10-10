// controllers/post.controller.js
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";

// =============================
// 1. Create a new Post
// =============================
export const createPost = async (req, res) => {
  try {
    const { content, attachments, externalLink } = req.body;

    // User comes from authMiddleware
    const authorId = req.user?._id;// ye au
    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found from token.",
      });
    }

    // postType is injected by postTypeMiddleware
    const postType = req.postType || "text"; // fallback if middleware not used

    const post = await Post.create({
      author: authorId,
      content,
      attachments, // middleware should decide type for each attachment
      externalLink,
      postType,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating post",
    });
  }
};


// =============================
// 1. Get only user post 
// =============================


export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    // Fetch posts created by the user
    const posts = await Post.find({ author: userId })
      .populate("author", "fullName email profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Add likes, comments, isLikedByUser
    const postsWithMeta = await Promise.all(
      posts.map(async (post) => {
        // Count likes
        const likeCount = await Like.countDocuments({
          targetType: "Post",
          targetId: post._id,
        });

        // Check if logged-in user liked this post
        const isLiked = await Like.exists({
          targetType: "Post",
          targetId: post._id,
          userId: userId,
        });

        // Fetch comments (latest first) with author info
        const comments = await Comment.find({ postId: post._id })
          .populate("authorId", "fullName profilePic") // replace authorId with actual user info
          .sort({ createdAt: -1 })
          .lean();

        // Comment count
        const commentCount = comments.length;

        return {
          ...post,
          likeCount,
          commentCount,
          isLikedByUser: Boolean(isLiked),
          comments, // array of comment objects
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: postsWithMeta,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching posts",
    });
  }
};








// =============================
// 2. Get all Posts (with comments + likes count)
// =============================
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullName email profilePic")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============================
// 3. Get a Single Post (with comments + likes)
// =============================
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate("author", "fullName email profilePic");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comments = await Comment.find({ postId }).populate("author", "fullName profilePic");
    const likes = await Like.find({ targetType: "Post", targetId: postId });

    return res.status(200).json({
      success: true,
      data: { post, comments, likesCount: likes.length },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============================
// 4. Update a Post
// =============================
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, attachments } = req.body;

    const post = await Post.findOneAndUpdate(
      { _id: postId, author: req.user._id }, // only author can update
      { content, attachments },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, message: "Post not found or not authorized" });

    res.status(200).json({ success: true, message: "Post updated", data: post });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============================
// 5. Delete a Post
// =============================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOneAndDelete({ _id: postId, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found or not authorized" });

    // Also delete comments & likes linked to this post
    await Comment.deleteMany({ postId });
    await Like.deleteMany({ targetType: "Post", targetId: postId });

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
