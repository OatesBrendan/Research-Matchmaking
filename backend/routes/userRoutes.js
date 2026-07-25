const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.registerUser);
router.post('/exists', userController.checkForExistingUser);
router.post('/login', userController.loginUser);
router.put('/:id', userController.updateUser);
router.post('/logout', userController.logout);
router.delete('/:id', userController.deleteUser);
router.post('/change-password', userController.changePassword);
router.get('/me', userController.getMe);
router.get('/check', userController.checkTokens);
router.post('/refresh', userController.refreshToken);
router.get('/all', userController.getUsers);

module.exports = router;