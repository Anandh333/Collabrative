import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, isManager } = useAuth();
  const { subscribe } = useSocket();
  
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeCreated = subscribe('taskCreated', (task) => {
      setTasks(prev => [task, ...prev]);
      toast.success('New task created');
    });

    const unsubscribeUpdated = subscribe('taskUpdated', (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      setMyTasks(prev => prev.map(t => t._id === task._id ? task : t));
      setCreatedTasks(prev => prev.map(t => t._id === task._id ? task : t));
    });

    const unsubscribeDeleted = subscribe('taskDeleted', ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setMyTasks(prev => prev.filter(t => t._id !== taskId));
      setCreatedTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    });

    const unsubscribeStatus = subscribe('taskStatusUpdated', ({ taskId, status }) => {
      const updateTaskStatus = (tasks) =>
        tasks.map(t => t._id === taskId ? { ...t, status } : t);
      setTasks(updateTaskStatus);
      setMyTasks(updateTaskStatus);
      setCreatedTasks(updateTaskStatus);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStatus();
    };
  }, [isAuthenticated, subscribe]);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await taskService.getTasks(params);
      setTasks(response.tasks);
      setPagination({
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage
      });
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to fetch tasks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await taskService.getMyTasks(params);
      setMyTasks(response.tasks);
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to fetch your tasks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCreatedTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await taskService.getCreatedTasks(params);
      setCreatedTasks(response.tasks);
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to fetch created tasks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await taskService.getTaskStats();
      setStats(response.stats);
      return response.stats;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchUsers = useCallback(async (params = {}) => {
    try {
      const response = await taskService.getUsers(params);
      setUsers(response.users);
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      setTasks(prev => [response.task, ...prev]);
      setCreatedTasks(prev => [response.task, ...prev]);
      toast.success('Task created successfully');
      return response.task;
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      const response = await taskService.updateTask(id, taskData);
      const updateInList = (list) =>
        list.map(t => t._id === id ? response.task : t);
      setTasks(updateInList);
      setMyTasks(updateInList);
      setCreatedTasks(updateInList);
      toast.success('Task updated successfully');
      return response.task;
    } catch (error) {
      toast.error(error.message || 'Failed to update task');
      throw error;
    }
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      const response = await taskService.updateTaskStatus(id, status);
      const updateInList = (list) =>
        list.map(t => t._id === id ? response.task : t);
      setTasks(updateInList);
      setMyTasks(updateInList);
      setCreatedTasks(updateInList);
      toast.success('Task status updated');
      return response.task;
    } catch (error) {
      toast.error(error.message || 'Failed to update task status');
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await taskService.deleteTask(id);
      const filterFromList = (list) => list.filter(t => t._id !== id);
      setTasks(filterFromList);
      setMyTasks(filterFromList);
      setCreatedTasks(filterFromList);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
      throw error;
    }
  }, []);

  const value = {
    tasks,
    myTasks,
    createdTasks,
    loading,
    stats,
    users,
    pagination,
    fetchTasks,
    fetchMyTasks,
    fetchCreatedTasks,
    fetchStats,
    fetchUsers,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};