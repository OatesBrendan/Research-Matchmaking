const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Token } = require('../models/userModel');
const Researcher = require('../models/researcherModel');
const { authorizeUser, authorizeAdmin } = require('../middleware/authMiddleware');
const emailValidator = require('email-validator');
const { validateId, validateRequestBody, validateParams, rejectQueryParams, cleanString } = require('../middleware/validateMiddleware');

const crypto = require('crypto');
const { validateName } = require('../middleware/validateMiddleware');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// @desc    Get all users (paginated)
// @route   GET /api/users/all
// @access  Admin
const getUsers = [
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    if (!validateParams(['name', 'isAdmin', 'limit', 'page'], req, res) || !validateRequestBody([], req, res)) return;
    const { name, isAdmin, limit = 50, page = 1 } = req.query;

    const filter = {};
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      select: "-password"
    };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (isAdmin) {
      filter.isAdmin = isAdmin === "true";
    }

    const result = await User.paginate(filter, options);
    return res.status(200).json({
      success: true,
      data: result.docs,
      totalCount: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage
    });
  })
];

const checkForExistingUser = asyncHandler(async (req, res) => {
  if (!validateRequestBody(['userEmail', 'userName'], req, res) || !validateParams([], req, res) || rejectQueryParams(req, res)) return;
  const { userEmail, userName } = req.body;
  if (!userEmail || emailValidator.validate(userEmail) === false) {
    return res.status(400).json({ success: false, message: 'Valid user email is required' });
  }

  if (!userName) {
    return res.status(400).json({ success: false, message: 'Valid user name is required' });
  }

  const existingUserByEmail = await User.findOne({ email: userEmail });
  if (existingUserByEmail) {
    return res.status(409).json({ success: false, message: 'User email already exists' });
  }

  const existingUserByName = await User.findOne({ name: userName });
  if (existingUserByName) {
    return res.status(409).json({ success: false, message: 'User by that name already exists' });
  }

  res.status(200).json({ success: true, message: 'User does not exist' });
});


// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  if (!validateName(req.body.userName, res) || !validateRequestBody(['userName', 'userEmail', 'userPassword'], req, res) || !validateParams([], req, res) || rejectQueryParams(req, res)) return;
  const { userName, userEmail, userPassword } = req.body;

  if (!userName || !userEmail || !userPassword) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  if (!emailValidator.validate(userEmail) && userEmail) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const userExists = await User.findOne({ email: userEmail });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const associatedResearcher = await Researcher.findOne({ name: userName });
  if (!associatedResearcher) {
    res.status(400);
    throw new Error('Associated researcher not found');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userPassword, salt);

  const user = await User.create({
    name: cleanString(userName),
    email: userEmail,
    researcherId: associatedResearcher ? associatedResearcher._id : null,
    password: hashedPassword
  });


  if (user) {
    // short lived access token
    res.cookie('access_token', generateToken(user._id), {
      httpOnly: true,
      secure: true, //process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 1000 * 60 * 15,
    });

    // create long lived refresh token to regen access token
    const refresh_token = crypto.randomBytes(40).toString('hex');
    const hashed_refresh_token = await bcrypt.hash(refresh_token, 10);

    await Token.create({
      token: hashed_refresh_token,
      user: user._id
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(200).json({ message: 'Registration successful' });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  if (!validateRequestBody(['userEmail', 'userPassword'], req, res) || !validateParams([], req, res)) return;
  try {

    const { userEmail, userPassword } = req.body;

    // Check for user email
    const user = await User.findOne({ email: userEmail });
    console.log(user);

    if (user && (await bcrypt.compare(userPassword, user.password))) {
      // short lived access token
      res.cookie('access_token', generateToken(user._id), {
        httpOnly: true,
        secure: true, //process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 1000 * 60 * 15,
      });

      // create long lived refresh token to regen access token
      const refresh_token = crypto.randomBytes(40).toString('hex');
      const hashed_refresh_token = await bcrypt.hash(refresh_token, 10);

      await Token.create({
        token: hashed_refresh_token,
        user: user._id
      });

      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });

      return res.status(200).json({ message: 'Login successful' });

    } else {
      res.status(401).json({ message: "Invalid credentials." });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// @desc    Refresh a users auth token using their refresh token
// @route   POST /api/users/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {

  const oldRefreshToken = req.cookies.refresh_token;
  if (!oldRefreshToken) return res.sendStatus(401);

  const tokens = await Token.find().populate('user');
  let token = null;

  for (const candidate of tokens) {
    const match = await bcrypt.compare(oldRefreshToken, candidate.token);
    if (match) {
      token = candidate;
      break;
    }
  }

  if (!token) return res.sendStatus(403);

  const newAccessToken = generateToken(token.user._id);
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newHashedToken = await bcrypt.hash(newRefreshToken, 10);

  await Token.create({
    token: newHashedToken,
    user: token.user._id
  });
  await token.deleteOne();

  // short lived access token
  res.cookie('access_token', newAccessToken, {
    httpOnly: true,
    secure: true, //process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 1000 * 60 * 15,
  });

  // long lived refresh_token
  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  res.sendStatus(204);
})

// @desc    Update user's password
// @route   POST /api/users/change-password
// @access  Private
const changePassword = [authorizeUser, asyncHandler(async (req, res) => {
  if (!validateRequestBody(['newPassword'], req, res) || !validateParams([], req, res) || rejectQueryParams(req, res)) return;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Please provide a new password' });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.status(400).json({ message: 'New password must be different from old password' });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  return res.status(200).json({ message: 'Password changed successfully' });
})];



// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = [
  authorizeUser,
  asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
  })
];

// @desc    Clears users tokens and if found removes the refresh from database
// @route   POST /api/users/logout
// @access  Public
const logout = asyncHandler(async (req, res) => {
  try {
    if (!validateRequestBody([], req, res) || !validateParams([], req, res)) return;
    const refreshToken = req.cookies.refresh_token;
    res.clearCookie('access_token', {sameSite: 'none', secure: true});
    res.clearCookie('refresh_token', {sameSite: 'none', secure: true});

    res.sendStatus(204);

    if (!refreshToken) return;

    const tokens = await Token.find();
    let token = null;

    for (const candidate of tokens) {
      const match = await bcrypt.compare(refreshToken, candidate.token);
      if (match) {
        token = candidate;
        break;
      }
    }

    if (token) await token.deleteOne();
    return;
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

// @desc    Delete a user by object id.
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = [authorizeAdmin, asyncHandler(async (req, res) => {
  if (!validateParams(['id'], req, res) || !validateRequestBody([], req, res) || !validateId(req.params.id, res) || rejectQueryParams(req, res)) return;
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  await User.findByIdAndDelete(id);
  res.status(200).json({ message: 'User deleted successfully' });
})];

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = [authorizeUser, asyncHandler(async (req, res) => {
  if (!validateParams(['id'], req, res) || !validateRequestBody(['name', 'email', 'isAdmin', 'researcherId'], req, res) || !validateId(req.params.id, res)) return;
  if (req.user.isAdmin === false && req.user._id !== req.params.id) {
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
  }

  try {
    const { id } = req.params;
    const { name, email, isAdmin, researcherId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const firstName = name?.trim().split(' ')[0];
    const lastName = name?.trim().split(' ').slice(1).join(' ');

    const sanitizedFirstName = firstName ? cleanString(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase().replace(/[()!@&*#$%^?. ]/g, '')) : '';
    const sanitizedLastName = lastName ? cleanString(lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase().replace(/[()!@&*#$%^?. ]/g, '')) : '';
    const sanitizedFullName = (sanitizedFirstName + (sanitizedLastName ? ' ' + sanitizedLastName : '')).trim();

    if (!emailValidator.validate(email) && email) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const updateData = {
      ...(sanitizedFullName && { name: sanitizedFullName }),
      ...(emailValidator.validate(email) && { email: email.trim() }),
      ...(typeof isAdmin === 'boolean' && { isAdmin }),
      ...(researcherId?.trim() && { researcherId: researcherId.trim() })
    };

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: 'No valid update data provided' });
    }

    await User.findByIdAndUpdate(id, updateData);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})];

// @desc    Checks if a user's tokens are valid
// @route   GET /api/users/check
// @access  Private
const checkTokens = [
  authorizeUser,
  asyncHandler(async (req, res) => {
    res.sendStatus(200);
  })
];

module.exports = {
  registerUser,
  checkForExistingUser,
  loginUser,
  updateUser,
  changePassword,
  logout,
  deleteUser,
  getMe,
  refreshToken,
  checkTokens,
  getUsers
};