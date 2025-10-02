import Student from "../../model/student.model.js"
import Member from "../../model/postHolder.model.js";

export const getProfile = async (req, res) => {
  try {
    const { email, role } = req.user; // from auth middleware

    let profileData;
    let responseData = {};

    if (role === "student") {
      profileData = await Student.findOne({ email }).select(
        "fullName email profilePic expectedPassooutDate department role"
      );

      if (!profileData) {
        return res.status(404).json({ success: false, message: "Profile not found" });
      }

      responseData = {
        ...profileData.toObject(),
        showDocument: false, // not applicable for students
      };
    } else if (role === "member") {
      profileData = await Member.findOne({ email }).select(
        "fullName email profilePic designation currentPosition previousAchievements documents"
      );

      if (!profileData) {
        return res.status(404).json({ success: false, message: "Profile not found" });
      }

      responseData = profileData.toObject();

      // Show documents only if none exist
      responseData.showDocument = !(
        responseData.documents && responseData.documents.length > 0
      );
    } else {
      return res.status(400).json({ success: false, message: "Invalid user role" });
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
