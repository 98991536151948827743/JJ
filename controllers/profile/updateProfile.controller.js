import Student from "../../model/student.model.js"
import Member from "../../model/postHolder.model.js";

// Define allowed fields per role
const allowedStudentFields = ["fullName", "profilePic", "expectedPassoutDate", "department"];
const allowedMemberFields = ["fullName", "profilePic", "designation", "currentPosition", "previousAchievements", "documents"];

export const updateProfile = async (req, res) => {
  try {
    const { email, role } = req.user;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No update data provided" });
    }

    let filteredData = {};

    if (role === "student") {
      // Filter out only allowed fields
      for (const key of allowedStudentFields) {
        if (updateData[key] !== undefined && updateData[key] !== "") {
          filteredData[key] = typeof updateData[key] === "string" ? updateData[key].trim() : updateData[key];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields provided for student update" });
      }

      const updatedProfile = await Student.findOneAndUpdate(
        { email },
        filteredData,
        { new: true }
      ).select("fullName email profilePic expectedPassoutDate department role");

      if (!updatedProfile) {
        return res.status(404).json({ success: false, message: "Student profile not found" });
      }

      return res.status(200).json({ success: true, data: updatedProfile });

    } else if (role === "member") {
      for (const key of allowedMemberFields) {
        if (updateData[key] !== undefined && updateData[key] !== "") {
          filteredData[key] = typeof updateData[key] === "string" ? updateData[key].trim() : updateData[key];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields provided for member update" });
      }

      const updatedProfile = await Member.findOneAndUpdate(
        { email },
        filteredData,
        { new: true }
      ).select("fullName email profilePic designation currentPosition previousAchievements documents");

      if (!updatedProfile) {
        return res.status(404).json({ success: false, message: "Member profile not found" });
      }

      // Determine if frontend should show document upload
      const responseData = updatedProfile.toObject();
      responseData.showDocument = !(responseData.documents && responseData.documents.length > 0);

      return res.status(200).json({ success: true, data: responseData });

    } else {
      return res.status(400).json({ success: false, message: "Invalid user role" });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
