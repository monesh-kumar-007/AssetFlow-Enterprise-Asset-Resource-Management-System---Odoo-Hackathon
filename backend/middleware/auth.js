const jwt = require('jsonwebtoken');
const { User, Department } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow_default_secret_key_12345';

// Authenticate user by JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

// Check if user has one of the allowed roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User context not loaded.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' does not have permission to perform this action.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET,
};
