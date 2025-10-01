import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@nitkkr\.ac\.in$/, "Email must be a valid NIT Kurukshetra address"],
    },
    profilePic: {
      type: String, // Cloud storage URL
      default: "",
    },
    designation: {
      type: String,
      enum: [
        "professor",
        "club_president",
        "club_joint_secratary",
        "club_secretary",
        "club_joint_secretary",
      ],
    },
    role:{type:String,default:"member"},
    department: {
      type: String,
      trim: true,
    },
    currentPosition: {
      type: String,
      trim: true,
      default: "",
    },
    previousAchievements: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    documents: [
      {
        name: { type: String, required: true }, // e.g. "ID Card", "Certificate"
        fileUrl: { type: String, required: true }, // link to S3/Cloudinary
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);
export default Member;
