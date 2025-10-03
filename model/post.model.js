import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [
      {
        url: { type: String, required: true }, // file link
        type: {
          type: String,
          enum: ["image", "video", "pdf", "doc", "other"],
          default: "other",
        },
      },
    ],
    externalLink: {
      type: String, // e.g. YouTube link, website, etc.
      trim: true,
    },
    postType: {
      type: String,
      enum: ["text", "media", "text+media", "empty"],
      default: "empty",
    },
  },
  { timestamps: true }
);

// ✅ Auto-derive postType before save
postSchema.pre("save", function (next) {
  if (this.content && this.attachments.length > 0) {
    this.postType = "text+media";
  } else if (this.content && this.content.trim() !== "") {
    this.postType = "text";
  } else if (this.attachments && this.attachments.length > 0) {
    this.postType = "media";
  } else {
    this.postType = "empty"; // block if you don’t want empty
  }
  next();
});

const Post = mongoose.model("Post", postSchema);
export default Post;