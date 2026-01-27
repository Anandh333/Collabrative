// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks,
  getTask,
  getMyTasks,
  getCreatedTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
  getActivityLogs
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize, isManager } = require('../middleware/roleCheck');
const { taskCreationLimiter } = require('../middleware/rateLimiter');

// Validation rules
const taskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot be more than 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('assignedTo')
    .notEmpty().withMessage('Assignee is required')
    .isMongoId().withMessage('Invalid assignee ID'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

// All routes require authentication
router.use(protect);

// Stats and logs
router.get('/stats', getTaskStats);
router.get('/activity-logs', getActivityLogs);

// User-specific task routes
router.get('/my-tasks', getMyTasks);
router.get('/created-by-me', authorize('manager'), getCreatedTasks);

// Main task routes
router.route('/')
  .get(getTasks)
  .post(authorize('manager'), taskCreationLimiter, taskValidation, createTask);

router.route('/:id')
  .get(getTask)
  .put(taskValidation, updateTask)
  .delete(authorize('manager'), deleteTask);

router.patch('/:id/status', updateTaskStatus);

module.exports = router;