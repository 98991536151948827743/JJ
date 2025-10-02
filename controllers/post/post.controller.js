import Post from "../models/post.model.js";

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      // Sort latest first
      { $sort: { createdAt: -1 } },

      // Lookup author (Member collection)
      {
        $lookup: {
          from: "members", // collection name in MongoDB
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },

      // Lookup likes
      {
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$targetId", "$$postId"] }, { $eq: ["$targetType", "Post"] }] } } }
          ],
          as: "likes",
        },
      },

      // Lookup comments
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
      },

      // Add counts
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
        },
      },

      // Remove heavy arrays (keep only counts)
      {
        $project: {
          "author.password": 0, // hide sensitive
          "author.__v": 0,
          likes: 0,
          comments: 0,
        },
      },
    ]);

    res.json({ success: true, posts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching posts",
      error: err.message,
    });
  }
};
