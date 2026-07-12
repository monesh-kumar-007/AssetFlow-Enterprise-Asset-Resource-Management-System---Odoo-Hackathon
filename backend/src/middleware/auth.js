const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path based on your User model location

// 1. Core Authentication Middleware (Protects routes from unauthenticated users)
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Format: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from string
      token = req.headers.authorization.split(' ')[1];

      // Verify token signatures using your JWT Secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

      // Fetch user data from DB (excluding password) and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User account not found.' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

// 2. Role Authorization Middleware (Specifically tailored for your Screen 4 actions)
const isAssetManagerOrAdmin = (req, res, next) => {
  // Checks if user exists and holds either 'Asset Manager' or 'Admin' privileges
  if (req.user && (req.user.role === 'Asset Manager' || req.user.role === 'Admin')) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Only Asset Managers or Admins can register inventory resources.' 
  });
};

module.exports = { protect, isAssetManagerOrAdmin };