// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

router.get('/', authorize('manager'), getUsers);
router.get('/:id', getUser);
router.put('/:id/role', authorize('manager'), updateUserRole);

module.exports = router;