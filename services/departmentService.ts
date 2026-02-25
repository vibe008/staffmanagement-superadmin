// services/departmentService.ts
import { Department, SubDepartment, Designation, ApiResponse } from '../types';
import { superadminurl } from '../api';


const BASE_URL = `${superadminurl}/api/department`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export const fetchHierarchy = async (): Promise<ApiResponse<Department[]>> => {
  try {
    const res = await fetch(`${BASE_URL}/hierarchy`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return {
      success: res.ok,
      data: data.data || data,
      message: data.message
    };
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return {
      success: false,
      data: [],
      message: 'Failed to fetch departments'
    };
  }
};

export const createDepartment = async (name: string): Promise<ApiResponse<Department>> => {
  const res = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  return await res.json();
};

export const updateDepartment = async (id: string, name: string): Promise<ApiResponse<Department>> => {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  return await res.json();
};

export const deleteDepartment = async (id: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

export const createSubDepartment = async (name: string, departmentId: string): Promise<ApiResponse<SubDepartment>> => {
  const res = await fetch(`${BASE_URL}/sub-departments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, departmentId })
  });
  return await res.json();
};

export const updateSubDepartment = async (id: string, name: string, departmentId: string): Promise<ApiResponse<SubDepartment>> => {
  const res = await fetch(`${BASE_URL}/sub-departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name, departmentId })
  });
  return await res.json();
};

export const deleteSubDepartment = async (id: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${BASE_URL}/sub-departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

export const createDesignation = async (title: string, subDepartmentId: string): Promise<ApiResponse<Designation>> => {
  const res = await fetch(`${BASE_URL}/designations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, subDepartmentId })
  });
  return await res.json();
};

export const updateDesignation = async (id: string, title: string, subDepartmentId: string): Promise<ApiResponse<Designation>> => {
  const res = await fetch(`${BASE_URL}/designations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ title, subDepartmentId })
  });
  return await res.json();
};

export const deleteDesignation = async (id: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${BASE_URL}/designations/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

// Helper function to get all departments with hierarchy
export const fetchAllDepartments = async (): Promise<Department[]> => {
  const response = await fetchHierarchy();
  return response.data || [];
};