// createSuperadmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/modules/auth/model/user.model.js"; // adjust path if needed

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await User.findOne({ email: "superadmin@example.com" });
    if (existing) {
      console.log("Superadmin already exists ✅");
      process.exit(0);
    }

    const superadmin = new User({
      name: "Super Admin",
      email: "superadmin@example.com",
      password: "SuperSecure123",
      role: "superadmin",
    });
    await superadmin.save();

    console.log("✅ Superadmin created successfully");
    process.exit(0);
  })
  .catch((err) => console.error("Error:", err));
