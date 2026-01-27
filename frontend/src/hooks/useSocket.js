import { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../services/authService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = authService.getToken();
    
    if (token && !socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinTask = useCallback((taskId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinTask', taskId);
    }
  }, []);

  const leaveTask = useCallback((taskId) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveTask', taskId);
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribe,
    emit,
    joinTask,
    leaveTask
  };
};