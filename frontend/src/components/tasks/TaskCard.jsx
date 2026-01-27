import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { STATUS_LABELS } from '../../utils/constants';

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  isDragging = false
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-500',
    high: 'border-l-orange-500',
    urgent: 'border-l-red-500'
  };

  const statusIcons = {
    'todo': <Clock className="w-4 h-4 text-gray-500" />,
    'in-progress': <AlertCircle className="w-4 h-4 text-blue-500" />,
    'review': <AlertCircle className="w-4 h-4 text-yellow-500" />,
    'completed': <CheckCircle className="w-4 h-4 text-green-500" />
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 
        ${priorityColors[task.priority]}
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-3' : ''}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {task.title}
          </h3>
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <button
                      onClick={() => {
                        onEdit(task);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(task._id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {/* Status */}
            <div className="flex items-center">
              {statusIcons[task.status]}
              <span className="ml-1 text-xs text-gray-500">
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center text-xs ${
              new Date(task.dueDate) < new Date() && task.status !== 'completed'
                ? 'text-red-500'
                : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(task.dueDate), 'MMM dd')}
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignedTo && (
          <div className="flex items-center mt-3">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
              {task.assignedTo.name}
            </span>
          </div>
        )}
      </div>

      {/* Status change buttons */}
      {onStatusChange && task.status !== 'completed' && (
        <div className="px-4 pb-3">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default TaskCard;