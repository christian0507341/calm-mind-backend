import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "professor", "superadmin"],
      default: "user",
    },
    profileCompleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // ---- existing token fields ----
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ---- new fields for 6-digit OTP reset ----
    resetCode: String,
    resetCodeExpire: Date,
  },
  { timestamps: true }
);

// -------------------- PASSWORD HASHING --------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// -------------------- PASSWORD COMPARISON --------------------
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// -------------------- EMAIL VERIFICATION TOKEN --------------------
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return token;
};

// -------------------- PASSWORD RESET TOKEN (URL) --------------------
userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
  return token;
};

// -------------------- NEW: 6-DIGIT CODE GENERATOR --------------------
userSchema.methods.generateResetCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric code
  this.resetCode = code;
  this.resetCodeExpire = Date.now() + 10 * 60 * 1000; // expires in 10 minutes
  return code;
};

// -------------------- OPTIONAL: validate existing reset token --------------------
userSchema.methods.isResetTokenValid = function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return (
    hashedToken === this.resetPasswordToken &&
    this.resetPasswordExpire > Date.now()
  );
};

export default mongoose.model("User", userSchema);
