import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/tasks/TaskCard';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';

const Dashboard = () => {
  const { user, isManager } = useAuth();
  const {
    myTasks,
    createdTasks,
    stats,
    loading,
    fetchMyTasks,
    fetchCreatedTasks,
    fetchStats,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
  } = useTask();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchMyTasks(),
        fetchStats(),
        isManager ? fetchCreatedTasks() : Promise.resolve()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleSubmitTask = async (taskData) => {
    if (editingTask) {
      await updateTask(editingTask._id, taskData);
    } else {
      await createTask(taskData);
    }
    setShowTaskModal(false);
    setEditingTask(null);
    loadData();
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.total || 0,
      icon: BarChart3,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Completed',
      value: stats?.byStatus?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'In Progress',
      value: stats?.byStatus?.['in-progress'] || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      lightBg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Pending',
      value: stats?.byStatus?.todo || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      lightBg: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  const recentMyTasks = myTasks.slice(0, 5);
  const recentCreatedTasks = createdTasks.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening with your tasks today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={loadData}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isManager && (
              <Button onClick={() => setShowTaskModal(true)}>
                + New Task
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.lightBg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Tasks Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  My Assigned Tasks
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {myTasks.length} total
                </span>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : recentMyTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentMyTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onStatusChange={updateTaskStatus}
                      showActions={isManager}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No tasks assigned to you
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Created Tasks Section (Manager Only) */}
          {isManager && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tasks Created by Me
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {createdTasks.length} total
                  </span>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                  </div>
                ) : recentCreatedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentCreatedTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={updateTaskStatus}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No tasks created yet
                    </p>
                    <Button
                      variant="ghost"
                      className="mt-4"
                      onClick={() => setShowTaskModal(true)}
                    >
                      Create your first task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Summary (For Users) */}
          {!isManager && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Task Summary
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Priority Breakdown */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      By Priority
                    </h3>
                    <div className="space-y-2">
                      {['urgent', 'high', 'medium', 'low'].map(priority => (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${
                              priority === 'urgent' ? 'bg-red-500' :
                              priority === 'high' ? 'bg-orange-500' :
                              priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {priority}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {stats?.byPriority?.[priority] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.byStatus?.completed || 0}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Completed</p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {(stats?.byStatus?.todo || 0) + (stats?.byStatus?.['in-progress'] || 0)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          size="lg"
        >
          <TaskForm
            task={editingTask}
            onClose={handleCloseModal}
            onSubmit={handleSubmitTask}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;