import mongoose from "mongoose";

const getStartedProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: { type: String, required: true },
    yearLevel: { type: String, required: true },
    studentNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("GetStartedProfile", getStartedProfileSchema);
