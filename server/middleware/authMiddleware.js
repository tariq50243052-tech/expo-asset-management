const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, secret);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Determine active store context
      if (req.user.role === 'Super Admin') {
        const activeStoreId = req.headers['x-active-store'];
        if (activeStoreId && activeStoreId !== 'undefined' && activeStoreId !== 'null' && activeStoreId !== 'all') {
          req.activeStore = activeStoreId;
        }
      } else if (req.user.assignedStore) {
        req.activeStore = req.user.assignedStore.toString();
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a super admin' });
  }
};

module.exports = { protect, admin, superAdmin };
