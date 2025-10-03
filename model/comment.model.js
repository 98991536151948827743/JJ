import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userType: {
      type: String,
      enum: ["Student", "Member"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userType", // dynamically references either Student or Member
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // optional limit for comment length
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video", "pdf", "doc", "other"],
          default: "other",
        },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment", // for threaded comments/replies
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
