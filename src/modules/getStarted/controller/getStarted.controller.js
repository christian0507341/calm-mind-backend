import multer from 'multer';
import path from 'path';
import GetStartedProfile from '../model/getStarted.model.js';
import User from '../../auth/model/user.model.js';

// Multer storage (same pattern used elsewhere)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image uploads are allowed'), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const createProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId not provided' });

    const {
      course,
      yearLevel,
      studentNumber,
      address,
      contactNumber,
    } = req.body;

    if (!course || !yearLevel || !studentNumber || !address || !contactNumber) {
      return res.status(400).json({ error: 'Missing required profile fields' });
    }

    // Prevent duplicate student numbers
    const existing = await GetStartedProfile.findOne({ studentNumber });
    if (existing) return res.status(409).json({ error: 'Student number already exists' });

    const profileImage = req.file ? req.file.filename : '';

    const profile = new GetStartedProfile({
      userId,
      course,
      yearLevel,
      studentNumber,
      address,
      contactNumber,
      profileImage,
    });

    await profile.save();

    // Optionally mark user's profileCompleted flag
    try {
      await User.findByIdAndUpdate(userId, { profileCompleted: true });
    } catch (e) {
      // not critical
      console.warn('Failed to update user.profileCompleted', e.message);
    }

    res.status(201).json({ success: true, profile });
  } catch (err) {
    console.error('createProfile error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error creating profile' });
  }
};

export const getProfileByStudentNumber = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    if (!studentNumber) return res.status(400).json({ error: 'studentNumber required' });

    const profile = await GetStartedProfile.findOne({ studentNumber });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({ profile });
  } catch (err) {
    console.error('getProfileByStudentNumber error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const profile = await GetStartedProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({ profile });
  } catch (err) {
    console.error('getProfileByUserId error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const updates = { ...req.body };
    if (req.file) updates.profileImage = req.file.filename;

    const profile = await GetStartedProfile.findOneAndUpdate({ userId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({ success: true, profile });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword; // pre-save hook in user model will hash
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('updatePassword error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
