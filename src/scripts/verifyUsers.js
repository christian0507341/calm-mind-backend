// src/scripts/verifyUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/auth/model/user.model.js';

dotenv.config();

const verifyAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users to be verified
    const result = await User.updateMany(
      { isVerified: false },
      { $set: { isVerified: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to verified status`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyAllUsers();