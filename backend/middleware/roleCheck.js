// middleware/roleCheck.js

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is manager
const isManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Only managers can perform this action'
    });
  }
  next();
};

// Check if user owns the resource or is manager
const canModifyTask = async (req, res, next) => {
  const Task = require('../models/Task');
  
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Manager can modify any task they created
    // User can only update status of tasks assigned to them
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isManagerRole = req.user.role === 'manager';

    if (!isCreator && !isAssignee && !isManagerRole) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this task'
      });
    }

    req.task = task;
    req.isCreator = isCreator;
    req.isAssignee = isAssignee;
    next();
  } catch (error) {
    console.error('canModifyTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { authorize, isManager, canModifyTask };