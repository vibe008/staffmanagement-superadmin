
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, Type, AlignLeft, Flag, Ticket, Info, Tag, Code, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input, Select } from './UI';
import { convertContactToTicket } from '../services/contactService';
import { superadminurl } from '@/services/api';

interface TicketFormProps {
  chat?: {
    id: string;
    userId: string;
    userName?: string;
    lastMessage?: string;
    userType?: string;
    userSource?: string;
    userCode?: string;
  };
  contact?: {
    id: string;
    fullName: string;
    email: string;
    subject: string;
    message: string;
    type: string;
    source: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ chat, contact, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialSubject = contact ? contact.subject : (chat ? `Signal from ${chat.userName}` : '');
  const initialDescription = contact ? contact.message : (chat ? chat.lastMessage || "Source: Live Terminal" : '');

  const userSource = contact ? contact.source : (chat?.userCode || 'CHAT');
  const userType = contact ? contact.type : (chat?.userType || 'user');

  const [formData, setFormData] = useState({
    subject: initialSubject,
    description: initialDescription,
    priority: "MEDIUM"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (contact) {
        await convertContactToTicket({
          contactId: contact.id,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          userSource: userSource, 
          userType: userType     
        });
      } else if (chat) {
        const res = await fetch(`${superadminurl}/api/ticket/convert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            chatSessionId: chat.id,
            chatUserId: chat.userId,
            subject: formData.subject,
            description: formData.description,
            priority: formData.priority,
            userSource: userSource, 
            userType: userType
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
           throw new Error(data.message || "Escalation failed");
        }
      }

      toast.success("Signal successfully escalated to Ticket 🎟️");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Strategic escalation failed");
      toast.error(err.message || "Escalation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-darkCard w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand rounded-2xl shadow-lg shadow-brand/20"><Ticket className="text-slate-900 w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Escalation Terminal</h3>
              <p className="text-slate-500 text-sm mt-1">Converting raw signal to operational ticket.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg"><Code size={14} className="text-slate-400" /></div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origin Source</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate">{userSource}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg"><Tag size={14} className="text-brand" /></div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Type</span>
                <span className="text-xs font-black text-brand uppercase tracking-tight">{userType}</span>
              </div>
            </div>
          </div>

          <Input label="Escalation Subject" icon={<Type className="w-5 h-5"/>} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Signal classification" required />

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Objective Briefing</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand"><AlignLeft className="w-5 h-5" /></div>
              <textarea 
                className="w-full min-h-[140px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-brand transition-all resize-none font-medium"
                placeholder="Detailed case description..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Select label="Escalation Priority" icon={<Flag className="w-5 h-5"/>} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} required>
              <option value="NORMAL">NORMAL</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="URGENT">URGENT</option>
            </Select>
          </div>

          <div className="pt-8 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Abort</button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-brand text-slate-900 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Save className="w-6 h-6" /> Escalate Asset</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
