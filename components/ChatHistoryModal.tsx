
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader2, Calendar, User, Shield } from 'lucide-react';
import { fetchChatSessionHistory } from '../services/ticketService';
import { ChatMessage } from '../types';

interface ChatHistoryModalProps {
  chatSessionId: string;
  onClose: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ chatSessionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchChatSessionHistory(chatSessionId);
        setChatData(data);
      } catch (err) {
        setError("Failed to retrieve chat transcript.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [chatSessionId]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh]"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand rounded-2xl shadow-lg shadow-brand/20">
              <MessageSquare className="text-slate-900 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate max-w-[300px]">
                {loading ? 'Archived Session' : `Transcript: ${chatData?.userName || 'User'}`}
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Protocol AES-Archived</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
            <X size={24}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 bg-slate-50/10">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-brand w-12 h-12" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Decrypting Signal...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500">
              <X size={48} className="mb-4 opacity-20" />
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <>
               <div className="flex justify-center">
                  <span className="px-5 py-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-300/30">
                    Session Start: {new Date(chatData.createdAt).toLocaleString()}
                  </span>
               </div>

               {chatData.messages?.map((msg: any, idx: number) => {
                 const isStaff = msg.senderType === 'AGENT' || msg.senderType === 'STAFF';
                 return (
                   <motion.div
                     key={msg.id || idx}
                     initial={{ opacity: 0, x: isStaff ? 20 : -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`flex gap-3 max-w-[85%] ${isStaff ? 'ml-auto flex-row-reverse' : ''}`}
                   >
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm border ${isStaff ? 'bg-slate-900 text-brand border-slate-800' : 'bg-white dark:bg-slate-800 text-brand border-slate-200 dark:border-slate-700'}`}>
                        {isStaff ? 'AG' : 'US'}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm ${isStaff ? 'bg-brand text-slate-900 rounded-tr-none' : 'bg-white dark:bg-darkCard text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800'}`}>
                        <p className="text-sm font-semibold leading-relaxed break-words">{msg.message}</p>
                        <span className="text-[8px] font-black uppercase tracking-widest block mt-2 opacity-40 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                   </motion.div>
                 );
               })}

               {(!chatData.messages || chatData.messages.length === 0) && (
                 <div className="text-center text-slate-400 py-10">
                    No recorded messages in this session.
                 </div>
               )}
            </>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
};
