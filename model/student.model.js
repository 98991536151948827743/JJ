import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    year: { type: Number, required: true }, // 1,2,3,4
    department: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
