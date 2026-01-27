// controllers/taskController.js
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// Helper function to create activity log
const createActivityLog = async (action, task, userId, previousValue = null, newValue = null, details = '', ip = '') => {
  try {
    await ActivityLog.create({
      action,
      taskId: task._id,
      taskTitle: task.title,
      performedBy: userId,
      previousValue,
      newValue,
      details,
      ipAddress: ip
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

// @desc    Get all tasks (with pagination and filters)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      assignedTo,
      createdBy
    } = req.query;

    // Build query
    let query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      // Users can only see tasks assigned to them
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      // Managers can see all tasks they created or assigned
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
      if (createdBy) {
        query.createdBy = createdBy;
      }
    }

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    let query = { assignedTo: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your tasks'
    });
  }
};

// @desc    Get tasks created by current user (manager)
// @route   GET /api/tasks/created-by-me
// @access  Private (Manager only)
exports.getCreatedTasks = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    let query = { createdBy: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      tasks
    });
  } catch (error) {
    console.error('Get created tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching created tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const isCreator = task.createdBy._id.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';

    if (!isCreator && !isAssignee && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    // Get activity logs for this task
    const activityLogs = await ActivityLog.find({ taskId: task._id })
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      task,
      activityLogs
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Manager only)
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      tags: tags || []
    });

    // Populate the task
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    // Create activity log
    await createActivityLog(
      'created',
      task,
      req.user._id,
      null,
      task.toObject(),
      `Task "${task.title}" was created`,
      req.ip
    );

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('taskCreated', task);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';

    // Users can only update status
    if (!isManager && !isCreator && isAssignee) {
      // User can only update status
      if (Object.keys(req.body).some(key => key !== 'status')) {
        return res.status(403).json({
          success: false,
          message: 'You can only update the task status'
        });
      }
    }

    const previousTask = task.toObject();

    // Update fields
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'tags'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // If marking as completed, set completedAt
    if (req.body.status === 'completed' && previousTask.status !== 'completed') {
      task.completedAt = new Date();
    } else if (req.body.status !== 'completed') {
      task.completedAt = null;
    }

    await task.save();

    // Populate updated task
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    // Determine action type
    let action = 'updated';
    if (req.body.status && req.body.status !== previousTask.status) {
      action = req.body.status === 'completed' ? 'completed' : 'status_changed';
    }
    if (req.body.assignedTo && req.body.assignedTo !== previousTask.assignedTo.toString()) {
      action = 'assigned';
    }

    // Create activity log
    await createActivityLog(
      action,
      task,
      req.user._id,
      previousTask,
      task.toObject(),
      `Task "${task.title}" was ${action}`,
      req.ip
    );

    // Emit socket event
    if (req.io) {
      req.io.emit('taskUpdated', task);
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['todo', 'in-progress', 'review', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assignee or manager
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';

    if (!isAssignee && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task status'
      });
    }

    const previousStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    // Create activity log
    await createActivityLog(
      status === 'completed' ? 'completed' : 'status_changed',
      task,
      req.user._id,
      { status: previousStatus },
      { status },
      `Task status changed from "${previousStatus}" to "${status}"`,
      req.ip
    );

    // Emit socket event
    if (req.io) {
      req.io.emit('taskStatusUpdated', { taskId: task._id, status });
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Manager only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only creator (manager) can delete
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    // Create activity log before deletion
    await createActivityLog(
      'deleted',
      task,
      req.user._id,
      task.toObject(),
      null,
      `Task "${task.title}" was deleted`,
      req.ip
    );

    await Task.findByIdAndDelete(req.params.id);

    // Emit socket event
    if (req.io) {
      req.io.emit('taskDeleted', { taskId: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    let matchQuery = {};

    if (req.user.role === 'user') {
      matchQuery.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      matchQuery.createdBy = req.user._id;
    }

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform to object format
    const statusCounts = {
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    priorityStats.forEach(stat => {
      priorityCounts[stat._id] = stat.count;
    });

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    res.status(200).json({
      success: true,
      stats: {
        total,
        byStatus: statusCounts,
        byPriority: priorityCounts
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics'
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/tasks/activity-logs
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, taskId } = req.query;

    let query = {};

    if (taskId) {
      query.taskId = taskId;
    }

    // Filter based on role
    if (req.user.role === 'user') {
      const userTasks = await Task.find({ assignedTo: req.user._id }).select('_id');
      query.taskId = { $in: userTasks.map(t => t._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find(query)
      .populate('performedBy', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs'
    });
  }
};