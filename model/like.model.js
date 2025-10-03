import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["Student", "Member"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userType", // dynamically points to Student or Member
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment"], // can like posts or comments
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // dynamically points to Post or Comment
    },
  },
  { timestamps: true }
);

// Optional: Prevent duplicate likes by same user on same target
likeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);
export default Like;
