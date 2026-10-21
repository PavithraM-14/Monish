import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'predictamaint_super_secret_jwt_key_2026_industrial';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'User record not found.' });
    }
    // Normalize role to uppercase for clean authorization
    user.role = (user.role || 'ENGINEER').toUpperCase();
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        user.role = (user.role || 'ENGINEER').toUpperCase();
        req.user = user;
      }
    } catch (e) {
      // Ignore token failure for optional auth
    }
  }
  next();
};

export const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`,
      });
    }
    next();
  };
};
