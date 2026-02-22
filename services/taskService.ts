
import { Task, TaskStatus, TaskPriority } from '../types';
import { superadminurl } from './api';

// const BASE_URL = 'https://superadmin-532d.onrender.com/api/tasks';
const BASE_URL = `${superadminurl}/api/tasks`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export const fetchAllTasks = async (filters: any = {}): Promise<any> => {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}?${query}`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch tasks');
  return result;
};

export const fetchMyTasks = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/my-tasks`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch your tasks');
  return result;
};

export const fetchTaskStats = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/stats`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch stats');
  return result;
};

export const fetchTaskById = async (id: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Task not found');
  return result;
};

export const createTask = async (data: any): Promise<any> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create task');
  return result;
};

export const convertTicketToTask = async (ticketId: string, data: any): Promise<any> => {
  const res = await fetch(`${BASE_URL}/from-ticket/${ticketId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to convert ticket to task');
  return result;
};

export const updateTask = async (id: string, data: any): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update task');
  return result;
};

export const deleteTask = async (id: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to delete task');
  return result;
};

export const assignTask = async (id: string, data: any): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}/assign`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to assign task');
  return result;
};

export const updateTaskStatus = async (id: string, data: { status: TaskStatus; note?: string }): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update status');
  return result;
};

export const addTaskNote = async (id: string, data: { note: string }): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to add note');
  return result;
};
