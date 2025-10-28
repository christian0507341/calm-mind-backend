import mongoose from "mongoose";
import User from "../auth/model/user.model.js";
import GetStartedProfile from "../getStarted/model/getStarted.model.js";

/**
 * GET /api/getStarted/profile/:userId
 * Fetch combined user + profile data
 */
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert to ObjectId to ensure proper matching
    const objectId = new mongoose.Types.ObjectId(userId);

    // Find user
    const user = await User.findById(objectId).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Find GetStarted profile
    const profile = await GetStartedProfile.findOne({
      userId: objectId,
    }).lean();
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });

    // Split name into first and last
    const [firstName = "", lastName = ""] = user.name
      ? user.name.split(" ")
      : ["", ""];

    // Return data matching frontend structure
    const data = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      yearLevel: profile.yearLevel,
      course: profile.course,
      studentNumber: profile.studentNumber,
      contactNumber: profile.contactNumber,
      address: profile.address,
      profileImage: profile.profileImage,
      userId: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    };

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * PUT /api/getStarted/update-profile/:userId
 * Update both user and GetStartedProfile data
 */
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      yearLevel,
      course,
      studentNumber,
      contactNumber,
      address,
    } = req.body;

    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);

    // Optional: handle avatar file
    const profileImage = req.file ? req.file.path : req.body.profileImage;

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      objectId,
      {
        name: `${firstName} ${lastName}`.trim(),
        profileCompleted: true,
      },
      { new: true }
    );

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Update GetStartedProfile model
    const updatedProfile = await GetStartedProfile.findOneAndUpdate(
      { userId: objectId },
      {
        yearLevel,
        course,
        studentNumber,
        contactNumber,
        address,
        profileImage,
      },
      { new: true }
    );

    if (!updatedProfile)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });

    const data = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      yearLevel: updatedProfile.yearLevel,
      course: updatedProfile.course,
      studentNumber: updatedProfile.studentNumber,
      contactNumber: updatedProfile.contactNumber,
      address: updatedProfile.address,
      profileImage: updatedProfile.profileImage,
      userId: {
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
