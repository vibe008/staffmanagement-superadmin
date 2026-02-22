
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Search, Filter, Clock, AlertTriangle, CheckCircle2, 
  MoreVertical, Calendar, User, Flag, ArrowRight, Loader2, MessageSquare, 
  ChevronRight, Trash2, Edit, ListTodo, Shield, ExternalLink, RefreshCw,
  Target, Zap, Mail, MessageCircle, MoreHorizontal, Tag, Globe, Share2, 
  X, Image as ImageIcon, Download, Eye, FileText
} from 'lucide-react';
import { Ticket as TicketType, TicketStatus, TicketPriority } from '../types';
import { fetchAllTickets, updateTicketStatus, deleteTicket } from '../services/ticketService';
import { toast } from 'react-toastify';
import { ChatHistoryModal } from './ChatHistoryModal';
import { Select } from './UI';

interface TicketManagerProps {
  onConvertToTask: (ticket: TicketType) => void;
  user: any;
}

const TicketContactDetailModal: React.FC<{ ticket: TicketType; onClose: () => void }> = ({ ticket, onClose }) => {
  const contact = ticket.sourceContact;
  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand rounded-[1.5rem] shadow-lg shadow-brand/20">
              <Mail className="text-slate-900 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Form Signal Detail</h3>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Ref ID: {ticket.id.slice(0, 12)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
              <p className="font-bold text-slate-900 dark:text-white">{contact.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
              <p className="font-bold text-slate-900 dark:text-white">{contact.email}</p>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Subject</p>
            <p className="text-xl font-black text-slate-900 dark:text-brand">{contact.subject || ticket.subject}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Message Body</p>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">"{contact.message || ticket.description}"</p>
            </div>
          </div>

          {contact.attachments && (
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Media</p>
              <div className="relative group overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg">
                <img src={contact.attachments} alt="Evidence" className="w-full h-auto max-h-[400px] object-contain bg-slate-100 dark:bg-slate-900" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                  <a href={contact.attachments} target="_blank" rel="noreferrer" className="p-4 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform"><Eye size={24} /></a>
                  <a href={contact.attachments} download className="p-4 bg-brand text-slate-900 rounded-full hover:scale-110 transition-transform"><Download size={24} /></a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button onClick={onClose} className="px-12 py-3.5 bg-slate-900 dark:bg-brand text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Close Signal View</button>
        </div>
      </motion.div>
    </div>
  );
};

export const TicketManager: React.FC<TicketManagerProps> = ({ onConvertToTask, user }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedContactTicket, setSelectedContactTicket] = useState<TicketType | null>(null);

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canUpdateTickets = user?.permissions?.includes('UPDATE_TICKETS') || isSuperAdmin;
  const canCreateTasks = user?.permissions?.includes('CREATE_TASKS') || isSuperAdmin;

  const statuses = [
    { label: 'All', value: 'all' },
    { label: 'Unassigned', value: TicketStatus.UNASSIGNED },
    { label: 'Assigned', value: TicketStatus.ASSIGNED },
    { label: 'In Progress', value: TicketStatus.IN_PROGRESS },
    { label: 'Waiting', value: TicketStatus.WAITING_CUSTOMER },
    { label: 'Resolved', value: TicketStatus.RESOLVED },
    { label: 'Closed', value: TicketStatus.CLOSED },
  ];

  const sourceTabs = [
    { label: 'Total Logs', value: 'all', icon: Target },
    { label: 'Chat Streams', value: 'CHAT', icon: MessageCircle },
    { label: 'Contact Forms', value: 'CONTACT', icon: Mail },
  ];

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchAllTickets();
      setTickets(res.data || []);
    } catch (err) {
      toast.error('Failed to retrieve ticket records');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
    try {
      await updateTicketStatus(ticketId, status);
      toast.success(`Ticket escalated to ${status}`);
      loadTickets();
    } catch (err) {
      toast.error('Escalation failed');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to permanently erase this ticket?")) return;
    
    try {
      await deleteTicket(ticketId);
      toast.success('Ticket purged from system');
      loadTickets();
    } catch (err) {
      toast.error('Deletion protocol failed');
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toUpperCase();
    if (p.includes('CRITICAL') || p.includes('URGENT')) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (p.includes('HIGH')) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (p.includes('MEDIUM')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.CLOSED: return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
      case TicketStatus.RESOLVED: return 'bg-green-500/10 text-green-500 border-green-500/20';
      case TicketStatus.UNASSIGNED: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case TicketStatus.WAITING_CUSTOMER: return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-brand/10 text-brand border-brand/20';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    const nameMatch = t.source === 'CHAT' 
      ? t.chatUser?.name?.toLowerCase().includes(term) 
      : t.sourceContact?.fullName?.toLowerCase().includes(term);
    
    const subjectMatch = t.subject.toLowerCase().includes(term);
    const typeMatch = t.userType?.toLowerCase().includes(term);
    const userSourceMatch = t.userSource?.toLowerCase().includes(term);
    const idMatch = t.ticketNumber?.toString().includes(term) || t.id.toLowerCase().includes(term);

    return (nameMatch || subjectMatch || idMatch || typeMatch || userSourceMatch) &&
      (statusFilter === 'all' || t.status === statusFilter) &&
      (priorityFilter === 'all' || t.priority.toUpperCase() === priorityFilter.toUpperCase()) &&
      (sourceFilter === 'all' || t.source === sourceFilter);
  });

  return (
    <div className="space-y-8">
      {/* Source Classification Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          {sourceTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSourceFilter(tab.value)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                sourceFilter === tab.value
                  ? 'bg-white dark:bg-brand text-slate-900 shadow-xl shadow-brand/10'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${sourceFilter === tab.value ? 'bg-slate-900/10' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {tab.value === 'all' ? tickets.length : tickets.filter(t => t.source === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter signals..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-brand shadow-sm font-bold text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={loadTickets}
            className="p-3 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand rounded-xl transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Secondary Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              statusFilter === status.value
                ? 'bg-slate-900 dark:bg-brand text-white dark:text-slate-900 border-slate-900 dark:border-brand shadow-lg'
                : 'bg-white dark:bg-darkCard text-slate-500 border-slate-200 dark:border-slate-800 hover:border-brand/40'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Main Ticket Grid */}
      <div className="bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identification</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Channel Origins</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status & Priority</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto w-10 h-10 text-brand" />
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Signals...</p>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active signals match the current filter.</p>
                  </td>
                </tr>
              ) : filteredTickets.map((ticket) => {
                const profileName = ticket.source === 'CHAT' ? ticket.chatUser?.name : ticket.sourceContact?.fullName;
                const profileEmail = ticket.source === 'CHAT' ? ticket.chatUser?.email : ticket.sourceContact?.email;

                return (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate max-w-[280px]">
                          {ticket.subject}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-md">#{ticket.ticketNumber || 'PENDING'}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                            <Clock size={10}/> {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-brand font-black border transition-colors ${
                          ticket.source === 'CHAT' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10' : 'bg-purple-50/50 border-purple-100 dark:bg-purple-900/10'
                        }`}>
                          {profileName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-900 dark:text-white text-xs truncate max-w-[150px]">{profileName || 'Anonymous'}</span>
                          <span className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">{profileEmail || 'No email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        {/* User Source - Origin Platform / User Code */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                             <Globe size={12} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                              {ticket.source === 'CHAT' ? 'User Code' : 'Origin Source'}
                            </span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[120px]">
                              {ticket.userSource || 'Internal'}
                            </span>
                          </div>
                        </div>
                        {/* Ticket Source - Internal Channel */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                             <Share2 size={12} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">System Channel</span>
                            <span className={`text-[10px] font-black uppercase ${
                              ticket.source === 'CHAT' ? 'text-blue-500' : 'text-purple-500'
                            }`}>
                              {ticket.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`w-fit px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Tag size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ticket.userType || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* View Signal / Message Icon - Unified for both sources */}
                        {ticket.source === 'CHAT' ? (
                          <button 
                            onClick={() => setSelectedSessionId(ticket.chatSessionId!)}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-brand hover:border-brand border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                            title="View Chat Transcript"
                          >
                            <MessageSquare size={16}/>
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedContactTicket(ticket)}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-brand hover:border-brand border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                            title="View Contact Signal"
                          >
                            <FileText size={16}/>
                          </button>
                        )}
                        
                        <button
                          onClick={() => onConvertToTask(ticket)}
                          disabled={!canCreateTasks}
                          className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          title={canCreateTasks ? "Convert to Task" : "Permission Denied"}
                        >
                          <Target size={16}/>
                        </button>

                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          disabled={!canUpdateTickets}
                          className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          title={canUpdateTickets ? "Purge Record" : "Permission Denied"}
                        >
                          <Trash2 size={16}/>
                        </button>

                        <div className="relative inline-block ml-2">
                          <select
                            value={ticket.status}
                            disabled={!canUpdateTickets}
                            onChange={(e) => handleStatusUpdate(ticket.id, e.target.value as TicketStatus)}
                            className="px-4 py-3 bg-slate-900 dark:bg-slate-800 border-none text-white dark:text-brand rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand appearance-none pr-8 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {/* Fix: Explicitly cast to string[] to allow .replace() on each element */}
                            {(Object.values(TicketStatus) as string[]).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRight size={14} className="rotate-90 text-white dark:text-brand opacity-50"/>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSessionId && (
          <ChatHistoryModal 
            chatSessionId={selectedSessionId} 
            onClose={() => setSelectedSessionId(null)} 
          />
        )}
        {selectedContactTicket && (
          <TicketContactDetailModal 
            ticket={selectedContactTicket} 
            onClose={() => setSelectedContactTicket(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
