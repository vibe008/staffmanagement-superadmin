
import { ContactSupport } from '../types';

const API_BASE = 'http://localhost:5000/api';
const TICKET_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...getHeaders()
});

// CORE CONTACT OPERATIONS
export const fetchAllContacts = async (page: number = 1, limit: number = 20): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts?page=${page}&limit=${limit}`, { headers: getJsonHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to fetch support signals');
  return result;
};

export const fetchContactById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}`, { headers: getJsonHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Signal not found');
  return result;
};

export const deleteContact = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}`, {
    method: 'DELETE',
    headers: getJsonHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Purge protocol failed');
  return result;
};

// LOCK MECHANISM
export const lockContact = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}/lock`, {
    method: 'POST',
    headers: getJsonHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Lock failed');
  return result;
};

export const unlockContact = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}/unlock`, {
    method: 'POST',
    headers: getJsonHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Unlock failed');
  return result;
};

// HISTORY & ELIGIBILITY
export const fetchContactHistory = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}/tickets`, { headers: getJsonHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'History synchronization failed');
  return result;
};

export const checkCanCreateTicket = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}/can-create-ticket`, { headers: getJsonHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Eligibility check failed');
  return result;
};

// REPLY OPERATIONS
export const sendContactReply = async (contactId: string, formData: FormData): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${contactId}/replies`, {
    method: 'POST',
    headers: getHeaders(), // Let browser set boundary for multipart
    body: formData
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Reply dispatch failed');
  return result;
};

export const fetchContactReplies = async (contactId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${contactId}/replies`, { headers: getJsonHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Reply history unreachable');
  return result;
};

export const resendReplyEmail = async (replyId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/replies/${replyId}/resend`, {
    method: 'POST',
    headers: getJsonHeaders()
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Relay failed');
  return result;
};

// CONVERSION
export const convertContactToTicket = async (data: { contactId: string; subject: string; description: string; priority: string; userSource?: string; userType?: string }): Promise<any> => {
  const res = await fetch(`${TICKET_BASE_URL}/convert-contact`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify(data)
  });
  const result = await res.json();
  
  if (!res.ok) {
    if (res.status === 409) {
      throw new Error(result.message || 'Escalation conflict detected');
    }
    throw new Error(result.message || 'Failed to convert contact to ticket');
  }
  return result;
};

export const updateContactStatus = async (id: string, status: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/contacts/${id}/status`, {
    method: 'PATCH',
    headers: getJsonHeaders(),
    body: JSON.stringify({ status })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Status update failed');
  return result;
};
