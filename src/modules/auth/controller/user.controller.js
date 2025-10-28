import User from '../model/user.model.js';
import jwt from 'jsonwebtoken';

// Register new user
export const registerUser = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { ...req.body, password: '[REDACTED]' });
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Registration failed: Email already exists:', email);
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'user',
      isVerified: true // For now, auto-verify
    });

    const savedUser = await user.save();
    console.log('✅ User registered successfully:', { 
      id: savedUser._id, 
      email: savedUser.email,
      role: savedUser.role
    });

    res.status(201).json({ 
      message: 'User registered successfully.',
      userId: savedUser._id 
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    console.log('🔑 Login attempt for:', req.body.email);
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('❌ Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log('🔍 Found user:', {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
      hasPassword: !!user.password
    });

    const isMatch = await user.matchPassword(password);
    console.log('🔐 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Login failed: Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Auto-verify the user if needed (for development)
    if (!user.isVerified) {
      console.log('🔄 Auto-verifying user for development:', email);
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', { 
      userId: user._id, 
      email: user.email,
      role: user.role
    });

    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // For development, we'll just verify the user directly
    user.isVerified = true;
    await user.save();

    res.json({ 
      message: 'Email verified successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification.', error: err.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile.', error: err.message });
  }
};
