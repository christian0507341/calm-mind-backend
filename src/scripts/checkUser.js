// src/scripts/checkUser.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/auth/model/user.model.js';

dotenv.config();

const checkUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      hasPassword: !!user.password,
      createdAt: user.createdAt
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address as argument');
  process.exit(1);
}

checkUser(email);