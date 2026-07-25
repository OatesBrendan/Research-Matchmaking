const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const {User} = require('../models/userModel');

// Ensure the user is authorized before continuing
const authorizeUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Not authorized, no token' });
  } else {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const user = await User.findOne({ _id: decoded.id });

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      // Add user to request object (without password)
      const userWithoutPassword = {
        _id: user._id,
        name: user.name,
        email: user.email,
        researcherId: user.researcherId,
        isAdmin: user.isAdmin === true ? user.isAdmin : false,
      };
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
});

// authorize that the user is valid and that they are an admin
const authorizeAdmin = [
    authorizeUser,
    asyncHandler(async (req, res, next) => {
        if (!req.user.isAdmin) return res.status(403).json({ message: "User is not an Admin." });
        next();
    })
]

module.exports = { authorizeUser, authorizeAdmin };