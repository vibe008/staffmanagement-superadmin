
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Trash2, Ticket, History, Mail, User, Clock, 
  Loader2, RefreshCw, AlertCircle, ShieldCheck,
  Eye, Zap, Target, Reply, Send, X, Tag,
  Lock, Unlock, ShieldAlert, Timer, Info,
  Calendar, ExternalLink, ChevronRight, UserCircle,
  FileText, Paperclip, CheckCircle, UploadCloud, File,
  MailCheck, MailWarning, User2, MessageSquare, Shield,
  ChevronDown, ArrowRight
} from 'lucide-react';
import { ContactSupport, ContactReply } from '../types';
import { 
  fetchAllContacts, 
  deleteContact, 
  updateContactStatus, 
  lockContact,
  unlockContact,
  checkCanCreateTicket,
  fetchContactHistory,
  sendContactReply,
  fetchContactReplies,
  resendReplyEmail
} from '../services/contactService';
import { toast } from 'react-toastify';

interface ContactSupportManagerProps {
  onConvertToTicket: (contact: ContactSupport) => void;
  user: any;
}

const TimelineHistoryModal: React.FC<{ contact: ContactSupport; onClose: () => void }> = ({ contact, onClose }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'REPLIES'>('TICKETS');

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const [historyRes, repliesRes] = await Promise.all([
          fetchContactHistory(contact.id),
          fetchContactReplies(contact.id)
        ]);
        if (historyRes.success) setTickets(historyRes.tickets || []);
        if (repliesRes.success) setReplies(repliesRes.replies || []);
      } catch (err) {
        toast.error("Timeline failed to synchronize");
      } finally {
        setLoading(false);
      }
    };
    loadTimeline();
  }, [contact.id]);

  const handleResend = async (id: string) => {
    try {
      await resendReplyEmail(id);
      toast.success("Email redelivered successfully");
    } catch (err) {
      toast.error("Redelivery failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand rounded-2xl shadow-lg shadow-brand/20">
                <History className="text-slate-900 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Uplink Audit</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Full history for {contact.fullName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
             <button onClick={() => setActiveTab('TICKETS')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'TICKETS' ? 'bg-white dark:bg-brand text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Ticket size={14}/> Escalated Tickets ({tickets.length})
             </button>
             <button onClick={() => setActiveTab('REPLIES')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'REPLIES' ? 'bg-white dark:bg-brand text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Reply size={14}/> Communication Logs ({replies.length})
             </button>
          </div>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand w-12 h-12 mb-4" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Scanning History...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'TICKETS' ? (
                tickets.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    {/* Fixed: Replaced ShieldInfo with Shield */}
                    <Shield size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black text-[10px] uppercase tracking-widest">No tickets generated for this signal</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="relative pl-10 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 last:before:hidden">
                       <div className="absolute left-2.5 top-4 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-white dark:border-darkCard shadow-sm" />
                       <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 uppercase">#{ticket.ticketNumber}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>{ticket.status}</span>
                             </div>
                             <span className="text-[10px] font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</span>
                          </div>
                          <h4 className="font-black text-slate-900 dark:text-white mb-2">{ticket.subject}</h4>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                             <div className="flex items-center gap-1.5"><User2 size={12}/> {ticket.createdBy?.name}</div>
                             {ticket.assignedTo && <div className="flex items-center gap-1.5"><ArrowRight size={12}/> {ticket.assignedTo.name}</div>}
                          </div>
                       </div>
                    </div>
                  ))
                )
              ) : (
                replies.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black text-[10px] uppercase tracking-widest">No replies dispatched yet</p>
                  </div>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className="relative pl-10 before:absolute before:left-4 before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 last:before:hidden">
                       <div className="absolute left-2.5 top-4 w-3.5 h-3.5 rounded-full bg-brand border-4 border-white dark:border-darkCard shadow-sm" />
                       <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-slate-900 dark:text-white">{reply.staff.name}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest bg-brand/10 text-brand px-1.5 py-0.5 rounded">Dispatch</span>
                             </div>
                             <div className="flex items-center gap-3">
                                {reply.emailSent ? <MailCheck size={14} className="text-green-500" /> : <MailWarning size={14} className="text-red-500" />}
                                <span className="text-[10px] font-bold text-slate-400">{new Date(reply.createdAt).toLocaleString()}</span>
                             </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{reply.message}</p>
                          
                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                               {reply.attachments.map((att, i) => (
                                 <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black text-slate-500 uppercase hover:text-brand transition-colors">
                                   <Paperclip size={10} /> {att.fileName}
                                 </a>
                               ))}
                            </div>
                          )}
                          
                          {!reply.emailSent && (
                            <button onClick={() => handleResend(reply.id)} className="mt-4 text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5 hover:underline">
                              <RefreshCw size={10} /> Redeliver Official Email
                            </button>
                          )}
                       </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button onClick={onClose} className="px-12 py-3.5 bg-slate-900 dark:bg-brand text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Close Dashboard</button>
        </div>
      </motion.div>
    </div>
  );
};

export const ContactSupportManager: React.FC<ContactSupportManagerProps> = ({ onConvertToTicket, user }) => {
  const [contacts, setContacts] = useState<ContactSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactSupport | null>(null);
  const [replyingTo, setReplyingTo] = useState<ContactSupport | null>(null);
  const [historyContact, setHistoryContact] = useState<ContactSupport | null>(null);

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canRespondChat = user?.permissions?.includes('RESPOND_CHAT') || isSuperAdmin;
  const canContactSupport = user?.permissions?.includes('CONTACT_SUPPORT') || isSuperAdmin;
  const canCreateTickets = user?.permissions?.includes('CREATE_TICKETS') || isSuperAdmin;
  
  // Reply Form Logic
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format seconds to duration string
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const loadContacts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetchAllContacts();
      setContacts(res.contacts || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync support sector');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Real-time timer for locks and cooldowns
  useEffect(() => {
    const timer = setInterval(() => {
      setContacts(prev => prev.map(contact => {
        const newLockTime = contact.lockTimeRemaining > 0 ? contact.lockTimeRemaining - 1 : 0;
        const newCooldownTime = contact.cooldownRemaining > 0 ? contact.cooldownRemaining - 1 : 0;
        
        // If lock just expired, we might want to refresh from server or just update locally
        const isLocked = newLockTime > 0;
        const isInCooldown = newCooldownTime > 0;

        return {
          ...contact,
          lockTimeRemaining: newLockTime,
          lockTimeRemainingFormatted: formatDuration(newLockTime),
          isLocked: isLocked,
          cooldownRemaining: newCooldownTime,
          cooldownRemainingFormatted: formatDuration(newCooldownTime),
          isInCooldown: isInCooldown,
          // Update canCreateTicket if lock or cooldown expired
          canCreateTicket: contact.status !== 'CONVERTED' && !isInCooldown && (!isLocked || contact.lockedBy?.id === JSON.parse(sessionStorage.getItem('user') || '{}').id)
        };
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadContacts();
    const interval = setInterval(() => loadContacts(false), 30000); // Refresh every 30s instead of 15s since we have local timers
    return () => clearInterval(interval);
  }, [loadContacts]);

  const handleEscalate = async (contact: ContactSupport) => {
    try {
      const check = await checkCanCreateTicket(contact.id);
      if (!check.canCreate) {
        toast.warning(check.message || "Escalation restricted");
        return;
      }
      const res = await lockContact(contact.id);
      if (res.success) {
        // Update local state immediately
        setContacts(prev => prev.map(c => c.id === contact.id ? { 
          ...c, 
          isLocked: true, 
          lockedBy: res.contact.lockedBy,
          lockTimeRemaining: 600, // 10 minutes
          lockTimeRemainingFormatted: '10m 0s'
        } : c));
        onConvertToTicket(contact);
      }
    } catch (err: any) {
      toast.error(err.message || "Lock protocol violation");
    }
  };

  const handleUnlockAsset = async (id: string) => {
    try {
      await unlockContact(id);
      toast.success('Asset session released');
      // Update local state immediately
      setContacts(prev => prev.map(c => c.id === id ? { 
        ...c, 
        isLocked: false, 
        lockedBy: undefined,
        lockTimeRemaining: 0,
        lockTimeRemainingFormatted: '0s'
      } : c));
    } catch (err: any) {
      toast.error(err.message || "Unlock failed");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateContactStatus(id, newStatus);
      toast.success(`Asset status shifted to ${newStatus}`);
      loadContacts();
    } catch (err) {
      toast.error('Protocol update failed');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyMessage.trim()) return;
    
    setSendingReply(true);
    const formData = new FormData();
    formData.append('message', replyMessage);
    replyFiles.forEach(file => formData.append('attachments', file));

    try {
      await sendContactReply(replyingTo.id, formData);
      toast.success('Communication dispatched to user');
      setReplyingTo(null);
      setReplyMessage('');
      setReplyFiles([]);
      loadContacts();
    } catch (err: any) {
      toast.error(err.message || 'Relay synchronization failure');
    } finally {
      setSendingReply(false);
    }
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (replyFiles.length + selected.length > 5) {
      toast.warning("Transmission limit: 5 artifacts per relay");
      return;
    }
    setReplyFiles([...replyFiles, ...selected]);
  };

  const removeFile = (idx: number) => setReplyFiles(replyFiles.filter((_, i) => i !== idx));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'REPLIED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CONVERTED': return 'bg-slate-900 text-brand border-slate-900 shadow-lg';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800';
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="Filter incoming signals..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-brand shadow-sm font-bold text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-slate-800">
             System Active • {contacts.length} Records
           </div>
           <button 
            onClick={() => loadContacts()}
            className="p-4 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand rounded-2xl transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Grid Interface */}
      <div className="bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Signal Integrity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Guard</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <Loader2 className="animate-spin mx-auto w-12 h-12 text-brand" />
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Decrypting Signals...</p>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center flex flex-col items-center">
                    <Zap className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No signals mapped in current vector.</p>
                  </td>
                </tr>
              ) : filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/5 border border-brand/20 flex items-center justify-center text-brand font-black relative shadow-sm transition-transform group-hover:scale-105">
                        {contact.fullName.charAt(0)}
                        {contact.status === "CONVERTED" && (
                           <div className="absolute -top-1 -right-1 p-1 bg-blue-500 text-white rounded-lg border-2 border-white dark:border-darkCard">
                             <ShieldCheck size={8} />
                           </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 dark:text-white truncate">{contact.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-bold truncate tracking-tight">{contact.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1 text-xs">{contact.subject}</span>
                        {contact.isInCooldown && (
                           <span className="text-[8px] font-black text-orange-500 uppercase bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1 shadow-sm">
                             <Timer size={8} /> Redundant
                           </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          disabled={contact.status === "CONVERTED"}
                          value={contact.status}
                          onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border appearance-none outline-none cursor-pointer shadow-sm transition-all ${getStatusBadge(contact.status)}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="REPLIED">REPLIED</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CONVERTED" disabled>CONVERTED</option>
                        </select>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                          <Calendar size={10}/> {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      {contact.isLocked ? (
                        <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all shadow-md ${contact.lockedBy?.id === JSON.parse(sessionStorage.getItem('user') || '{}').id ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                          <div className="flex items-center gap-3">
                            {contact.lockedBy?.id === JSON.parse(sessionStorage.getItem('user') || '{}').id ? <Unlock size={14} className="animate-pulse" /> : <Lock size={14} />}
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase leading-none mb-1">
                                {contact.lockedBy?.id === JSON.parse(sessionStorage.getItem('user') || '{}').id ? 'Your Session' : `Busy: ${contact.lockedBy?.name}`}
                              </span>
                              <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">
                                {contact.lockTimeRemaining > 0 ? `Expires: ${contact.lockTimeRemainingFormatted}` : 'Expiring...'}
                              </span>
                            </div>
                          </div>
                          {contact.lockedBy?.id === JSON.parse(sessionStorage.getItem('user') || '{}').id && (
                            <button onClick={() => handleUnlockAsset(contact.id)} className="p-1 hover:bg-green-100 rounded-lg text-green-700 transition-colors" title="Release Session">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ) : contact.isInCooldown ? (
                        <div className="flex items-center gap-3 p-3 rounded-2xl border bg-orange-50 border-orange-200 text-orange-600 shadow-sm">
                          <ShieldAlert size={14} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase leading-none mb-1">Cooldown Sequence</span>
                            <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">
                              Available in: {contact.cooldownRemainingFormatted}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEscalate(contact)}
                          disabled={contact.status === 'CONVERTED'}
                          className="flex items-center justify-center gap-2.5 text-slate-400 hover:text-brand px-3 py-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand transition-all w-full group"
                        >
                          <Lock size={14} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Lock to handle</span>
                        </button>
                      )}
                      
                      {contact.actionMessage && !contact.isLocked && !contact.isInCooldown && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1.5 line-clamp-1">{contact.actionMessage}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setReplyingTo(contact)}
                        disabled={!canRespondChat}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title={canRespondChat ? "Draft Relay" : "Permission Denied"}
                      >
                        <Reply size={16}/>
                      </button>

                      <button 
                        onClick={() => setSelectedContact(contact)}
                        className="p-3 bg-white dark:bg-brand/10 text-slate-400 hover:text-brand hover:bg-brand/10 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                        title="Intel Preview"
                      >
                        <Eye size={16}/>
                      </button>

                      <button 
                        onClick={() => setHistoryContact(contact)}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
                        title="View Full History"
                      >
                        <History size={16}/>
                      </button>

                      <button
                        onClick={() => handleEscalate(contact)}
                        disabled={!contact.canCreateTicket || contact.status === "CONVERTED" || !canCreateTickets}
                        className={`p-3 border rounded-xl transition-all shadow-sm ${
                          !contact.canCreateTicket || contact.status === "CONVERTED" || !canCreateTickets
                            ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-green-500 hover:bg-green-500/10 border-slate-200 dark:border-slate-700'
                        }`}
                        title={!canCreateTickets ? "Permission Denied" : (contact.cannotCreateReason || "Convert to Operational Ticket")}
                      >
                        <Ticket size={16}/>
                      </button>
                      
                      <button
                        onClick={() => { if(window.confirm('Delete signal?')) deleteContact(contact.id).then(loadContacts) }}
                        disabled={!canContactSupport}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title={canContactSupport ? "Purge Signal" : "Permission Denied"}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPLIES & ATTACHMENTS MODAL */}
      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setReplyingTo(null); setReplyFiles([]); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
              
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20"><Reply className="text-white w-6 h-6" /></div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Strategic Relay</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{replyingTo.fullName} • {replyingTo.email}</p>
                      </div>
                   </div>
                   <button onClick={() => { setReplyingTo(null); setReplyFiles([]); }} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X size={24}/></button>
                </div>
                
                {/* Visual Context: Contact Title/Subject */}
                <div className="bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                   <div className="flex items-center gap-2 mb-1">
                      <Tag size={10} className="text-brand" />
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Protocol Signal: {replyingTo.subject}</span>
                   </div>
                   <p className="text-xs text-slate-500 italic line-clamp-2 font-medium">"{replyingTo.message}"</p>
                </div>
              </div>

              <form onSubmit={handleReplySubmit} className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Communication Payload</label>
                   <textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                    className="w-full min-h-[160px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 outline-none focus:ring-2 focus:ring-brand font-bold text-sm transition-all resize-none shadow-inner"
                    placeholder="Draft official protocol response..."
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Artifact Uplink (Attachments)</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <AnimatePresence>
                         {replyFiles.map((file, i) => (
                           <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative group bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm">
                              <FileText className="text-slate-400 mb-2" />
                              <span className="text-[8px] font-black text-slate-500 truncate w-full px-2">{file.name}</span>
                              <button type="button" onClick={() => removeFile(i)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                           </motion.div>
                         ))}
                      </AnimatePresence>
                      {replyFiles.length < 5 && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-brand hover:text-brand transition-all hover:bg-slate-50">
                           <UploadCloud size={20} className="mb-2" />
                           <span className="text-[8px] font-black uppercase">Attach File</span>
                        </button>
                      )}
                   </div>
                   <input type="file" multiple ref={fileInputRef} onChange={addFiles} className="hidden" />
                </div>
              </form>

              <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                 <button type="button" onClick={() => { setReplyingTo(null); setReplyFiles([]); }} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm">Discard</button>
                 <button 
                  type="submit" 
                  onClick={handleReplySubmit}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex-[2] bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand/20 disabled:opacity-50 hover:scale-[1.02] transition-all"
                 >
                    {sendingReply ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
                    Authorize Dispatch
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTEL PREVIEW MODAL */}
      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedContact(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand rounded-2xl shadow-lg shadow-brand/20"><Mail className="text-slate-900 w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Signal Intel</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Ref ID: {selectedContact.id.slice(0, 12)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24}/></button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject Vector</p>
                    <p className="text-lg font-black text-slate-900 dark:text-brand">{selectedContact.subject}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Origin</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedContact.fullName}</p>
                    <p className="text-xs text-slate-400 font-bold tracking-tight">{selectedContact.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload Data</p>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-bold italic">"{selectedContact.message}"</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button 
                  disabled={!selectedContact.canCreateTicket || selectedContact.status === "CONVERTED"}
                  onClick={() => { handleEscalate(selectedContact); setSelectedContact(null); }}
                  className="flex-1 bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 hover:scale-[1.02] transition-all"
                >
                  <Ticket size={16}/> {selectedContact.status === "CONVERTED" ? 'Asset Scaled' : 'Escalate Signal'}
                </button>
                <button onClick={() => setSelectedContact(null)} className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50">Close Intel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY DASHBOARD MODAL */}
      <AnimatePresence>
        {historyContact && (
          <TimelineHistoryModal contact={historyContact} onClose={() => setHistoryContact(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
