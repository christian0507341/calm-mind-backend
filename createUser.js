import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/modules/auth/model/user.model.js"; // ✅ fixed path

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

async function createUser(name, email, password, role) {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ User with email ${email} already exists.`);
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    console.log(`✅ ${role} created successfully: ${email}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// Example usage:
createUser("Registrar Admin", "admin@calmmind.com", "admin123", "admin");
// Or createUser("Prof. John Doe", "profjohn@calmmind.com", "prof123", "professor");
