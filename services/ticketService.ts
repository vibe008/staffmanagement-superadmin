
import { ApiResponse, Ticket, TicketStatus } from '../types';
import { chaturl, superadminurl } from '../api';

// const BASE_URL = 'https://superadmin-532d.onrender.com/api/ticket';
const BASE_URL = `${superadminurl}/api/ticket`;
// const CHAT_INTERNAL_URL = 'https://superadmin-532d.onrender.com/api/internal/chat';
const CHAT_INTERNAL_URL = `${chaturl}/api/internal/chat`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`
});

export const fetchAllTickets = async (params: any = {}): Promise<ApiResponse<Ticket[]>> => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/getallticket?${query}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return await res.json();
};

export const updateTicket = async (ticketId: string, data: Partial<Ticket>): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update ticket');
  return await res.json();
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${ticketId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update ticket status');
  return await res.json();
};

export const deleteTicket = async (ticketId: string): Promise<any> => {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete ticket');
  return await res.json();
};

export const fetchChatSessionHistory = async (chatSessionId: string): Promise<any> => {
  const res = await fetch(`${CHAT_INTERNAL_URL}/${chatSessionId}`, { 
    headers: {
       'Content-Type': 'application/json'
    } 
  });
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return await res.json();
};
