import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'ENGINEER', 'admin', 'engineer', 'viewer', 'VIEWER'],
      default: 'ENGINEER',
      set: (v) => (v ? v.toUpperCase() : 'ENGINEER'),
      index: true,
    },
    department: {
      type: String,
      default: 'Reliability Engineering',
    },
    shift: {
      type: String,
      default: 'Day Shift (Bay 1-4)',
    },
    activeOrdersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
