import { Staff, Role } from '../types';

const BASE_URL = 'http://localhost:5000/api/staff';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export const fetchAllStaff = async (): Promise<Staff[]> => {
  try {
    const res = await fetch(BASE_URL, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch staff');
    const result = await res.json();
    return Array.isArray(result) ? result : (result.data || []);
  } catch (error) {
    console.warn('API connection failed');
    return [];
  }
};

// NEW: Fetch staff with filters
export const fetchStaffByFilters = async (filters: {
  departmentId?: string;
  subDepartmentId?: string;
  designationId?: string;
  role?: string;
  search?: string;
}): Promise<Staff[]> => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
    if (filters.subDepartmentId) queryParams.append('subDepartmentId', filters.subDepartmentId);
    if (filters.designationId) queryParams.append('designationId', filters.designationId);
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.search) queryParams.append('search', filters.search);
    
    const url = `${BASE_URL}/filter?${queryParams.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    
    if (!res.ok) throw new Error('Failed to fetch filtered staff');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to fetch filtered staff:', error);
    return [];
  }
};

// NEW: Fetch staff by department ID
export const fetchStaffByDepartment = async (departmentId: string): Promise<Staff[]> => {
  try {
    const res = await fetch(`${BASE_URL}/department/${departmentId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch department staff');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to fetch department staff:', error);
    return [];
  }
};

// NEW: Fetch staff by sub-department ID
export const fetchStaffBySubDepartment = async (subDepartmentId: string): Promise<Staff[]> => {
  try {
    const res = await fetch(`${BASE_URL}/sub-department/${subDepartmentId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sub-department staff');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to fetch sub-department staff:', error);
    return [];
  }
};

// NEW: Fetch staff by designation ID
export const fetchStaffByDesignation = async (designationId: string): Promise<Staff[]> => {
  try {
    const res = await fetch(`${BASE_URL}/designation/${designationId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch designation staff');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to fetch designation staff:', error);
    return [];
  }
};

// NEW: Fetch staff by role
export const fetchStaffByRole = async (role: string): Promise<Staff[]> => {
  try {
    const res = await fetch(`${BASE_URL}/role/${role}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch staff by role');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to fetch staff by role:', error);
    return [];
  }
};

// NEW: Search staff by name or email
export const searchStaff = async (query: string): Promise<Staff[]> => {
  try {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to search staff');
    const result = await res.json();
    return result.data || result;
  } catch (error) {
    console.warn('Failed to search staff:', error);
    return [];
  }
};

// Registration Management
export const fetchRegistrationSummary = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/registrations/summary`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return await res.json();
};

export const fetchNewRegistrations = async (): Promise<Staff[]> => {
  const res = await fetch(`${BASE_URL}/registrations/new`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error('Failed to fetch new registrations');
  return result.registrations || result;
};

export const fetchPastRegistrations = async (): Promise<Staff[]> => {
  const res = await fetch(`${BASE_URL}/registrations/past`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error('Failed to fetch past registrations');
  return result.registrations || result;
};

export const moveStaffToPast = async (staffId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/move-to-past`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to archive staff member');
  return await res.json();
};

export const moveStaffToNew = async (staffId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/move-to-new`, {
    method: 'PUT',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to restore staff member');
  return await res.json();
};

export const permanentDeleteStaff = async (staffId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/permanent`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Permanent deletion failed');
  }
  return await res.json();
};

export const fetchStaffById = async (id: string): Promise<Staff> => {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Staff member not found');
  return result.staff || result; 
};

// AUTHENTICATION SERVICES
export const getStaffAuth = async (staffId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/auth`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch auth details');
  return result;
};

export const setupStaffAuth = async (staffId: string, data: { password: string; role: Role; permissions: string[]; isSuperAdmin?: boolean }): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/setup-auth`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      ...data,
      isSuperAdmin: data.isSuperAdmin || data.role === 'SUPERADMIN'
    })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Security setup failed');
  return result;
};

export const updateStaffAuth = async (staffId: string, data: { password?: string; role?: Role; permissions?: string[]; isSuperAdmin?: boolean }): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/auth`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Auth update failed');
  return result;
};

export const fetchStaffStatus = async (staffId: string): Promise<any> => {
  try {
    const res = await fetch(`${BASE_URL}/${staffId}/status`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch status');
    return await res.json();
  } catch (error) {
    console.warn('Could not fetch status for staff:', staffId);
    return { currentStatus: 'OFFLINE' };
  }
};

export const createStaff = async (data: FormData): Promise<any> => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
    body: data
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create staff');
  return result;
};

export const updateStaff = async (id: string, data: any): Promise<any> => {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: isFormData ? { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } : getHeaders(),
    body: isFormData ? data : JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update staff');
  return result;
};

export const deleteStaff = async (id: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to delete staff');
  return result;
};

export const fetchStaffPermissions = async (staffId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/permissions`, { headers: getHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch staff permissions');
  return result;
};

export const updateStaffPermissions = async (staffId: string, permissions: string[]): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${staffId}/permissions`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ permissions })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update permissions');
  return result;
};

// NEW: Get staff counts by department
export const getStaffCountsByDepartment = async (): Promise<Record<string, number>> => {
  try {
    const res = await fetch(`${BASE_URL}/counts/departments`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch department counts');
    const result = await res.json();
    return result.data || {};
  } catch (error) {
    console.warn('Failed to fetch department counts:', error);
    return {};
  }
};

// NEW: Get staff counts by role
export const getStaffCountsByRole = async (): Promise<Record<string, number>> => {
  try {
    const res = await fetch(`${BASE_URL}/counts/roles`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch role counts');
    const result = await res.json();
    return result.data || {};
  } catch (error) {
    console.warn('Failed to fetch role counts:', error);
    return {};
  }
};