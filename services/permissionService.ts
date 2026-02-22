
import { SystemPermission, ApiResponse, PermissionGroupResponse } from '../types';

const BASE_URL = 'https://superadmin-532d.onrender.com/api/permission';
// const BASE_URL = 'http://localhost:5000/api/permission';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export const fetchAllPermissions = async (): Promise<ApiResponse<PermissionGroupResponse[]>> => {
  const res = await fetch(BASE_URL, { headers: getHeaders() });
  return await res.json();
};

export const createPermission = async (data: { name: string; label: string; group: string }): Promise<ApiResponse<SystemPermission>> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const updatePermission = async (id: string, data: { label: string; group: string }): Promise<ApiResponse<SystemPermission>> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const deletePermission = async (id: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};
