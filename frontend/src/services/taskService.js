import api from './api';

export const taskService = {
  async getTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async getMyTasks(params = {}) {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  async getCreatedTasks(params = {}) {
    const response = await api.get('/tasks/created-by-me', { params });
    return response.data;
  },

  async getTask(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  async updateTaskStatus(id, status) {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  async getTaskStats() {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  async getActivityLogs(params = {}) {
    const response = await api.get('/tasks/activity-logs', { params });
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  }
};