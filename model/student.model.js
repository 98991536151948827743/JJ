import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    profilePic: { type: String, default: "" },
    expectedPassooutDate: { type: Number, default: ""},
    department: { type: String },
    role : {type:String,default:"student"},

  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
