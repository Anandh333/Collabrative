// models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'completed']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  taskTitle: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);