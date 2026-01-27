import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Grid,
  List,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/constants';

const TaskManagement = () => {
  const { isManager } = useAuth();
  const {
    tasks,
    loading,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    fetchUsers
  } = useTask();

  const [view, setView] = useState('kanban');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadTasks();
    if (isManager) {
      fetchUsers();
    }
  }, [filters.page]);

  const loadTasks = async () => {
    await fetchTasks(filters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadTasks();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: '',
      page: 1,
      limit: 20
    });
    setTimeout(loadTasks, 0);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      loadTasks();
    }
  };

  const handleStatusChange = async (taskId, status) => {
    await updateTaskStatus(taskId, status);
  };

  const handleSubmitTask = async (taskData) => {
    if (editingTask) {
      await updateTask(editingTask._id, taskData);
    } else {
      await createTask(taskData);
    }
    setShowTaskModal(false);
    setEditingTask(null);
    loadTasks();
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDragEnd = async (taskId, newStatus) => {
    const statusMap = {
      'todo': 'todo',
      'in-progress': 'in-progress',
      'review': 'review',
      'completed': 'completed'
    };
    
    if (statusMap[newStatus]) {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {pagination.total} total tasks
            </p>
          </div>
          <div className="flex gap-3">
            {isManager && (
              <Button onClick={() => setShowTaskModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status}
                onChange={(e) => {
                  handleFilterChange('status', e.target.value);
                  setTimeout(loadTasks, 0);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => {
                  handleFilterChange('priority', e.target.value);
                  setTimeout(loadTasks, 0);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">All Priority</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {(filters.status || filters.priority || filters.search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 ${
                  view === 'kanban'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${
                  view === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="secondary"
              onClick={loadTasks}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            view={view}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && view === 'list' && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

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

export default TaskManagement;