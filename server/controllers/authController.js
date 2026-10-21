import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'predictamaint_super_secret_jwt_key_2026_industrial';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const normalizedRole = role ? role.toUpperCase() : 'ENGINEER';

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: normalizedRole,
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password credentials.' });
    }

    const normalizedRole = (user.role || 'ENGINEER').toUpperCase();
    const token = jwt.sign({ id: user._id, role: normalizedRole }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        department: user.department,
        shift: user.shift,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: (user.role || 'ENGINEER').toUpperCase(),
        department: user.department,
        shift: user.shift,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email role department shift activeOrdersCount _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEngineers = async (req, res) => {
  try {
    const engineers = await User.find(
      { role: { $in: ['ENGINEER', 'engineer'] } },
      'name email role department shift activeOrdersCount _id'
    ).sort({ name: 1 });
    res.json(engineers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
