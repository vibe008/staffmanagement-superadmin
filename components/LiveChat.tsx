
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Paperclip, MoreVertical,
  MessageSquare, Clock, PlusCircle, Volume2, VolumeX,
  Loader2, Image as ImageIcon, Video as VideoIcon,
  X, Maximize2, Download, Ticket, Check, CheckCheck, LogOut, Tag, Code
} from 'lucide-react';
import { toast } from 'react-toastify';
import { socketService } from '../socket';
import { ChatMessage, MessageType } from '../types';
import { chaturl } from '@/services/api';

interface Chat {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userCode?: string;
  userType?: string;
  userSource?: string;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  online?: boolean;
  status?: string;
}

interface LiveChatProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  messages: ChatMessage[];
  onCreateTicket: () => void;
  onSendMessage: (msg: string, type: MessageType) => void;
  onEndChat?: (chatId: string) => void;
  user: any;
}

export const LiveChat: React.FC<LiveChatProps> = ({ 
  chats, 
  selectedChatId, 
  onSelectChat, 
  messages, 
  onCreateTicket, 
  onSendMessage,
  onEndChat,
  user
}) => {
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isConnected = socketService.socket?.connected || false;

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canRespondChat = user?.permissions?.includes('RESPOND_CHAT') || isSuperAdmin;
  const canCreateTickets = user?.permissions?.includes('CREATE_TICKETS') || isSuperAdmin;

  const filteredChats = chats.filter(chat => 
    chat.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.userCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.userType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatId) return;
    onSendMessage(message, 'TEXT');
    setMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File exceeds 20MB limit");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${chaturl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const messageType: MessageType = data.type?.toUpperCase() === 'VIDEO' ? 'VIDEO' : 
                         data.type?.toUpperCase() === 'AUDIO' ? 'AUDIO' : 
                         data.type?.toUpperCase() === 'FILE' ? 'FILE' : 'IMAGE';
      
      onSendMessage(data.url, messageType);
      toast.success("Media transmitted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Bridge failure: Media upload timed out");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEndChat = () => {
    if (selectedChatId && onEndChat) {
      onEndChat(selectedChatId);
      setShowEndChatConfirm(false);
      toast.info("Chat ended successfully");
    }
  };

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getMessageIcon = (type?: string) => {
    switch(type) {
      case 'IMAGE': return <ImageIcon size={12} className="inline mr-1" />;
      case 'VIDEO': return <VideoIcon size={12} className="inline mr-1" />;
      case 'AUDIO': return <Volume2 size={12} className="inline mr-1" />;
      case 'FILE': return <Paperclip size={12} className="inline mr-1" />;
      default: return null;
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'IMAGE') {
      return (
        <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <img 
            src={msg.content} 
            alt="Shared media" 
            className="max-w-full max-h-[300px] object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button 
              onClick={() => window.open(msg.content, '_blank')}
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
            >
              <Maximize2 size={16} />
            </button>
            <a href={msg.content} download target="_blank" rel="noreferrer" className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
              <Download size={16} />
            </a>
          </div>
        </div>
      );
    }
    
    if (msg.type === 'VIDEO') {
      return (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black max-w-[320px]">
          <video controls className="w-full">
            <source src={msg.content} />
            Protocol error: Browser unable to render video packet.
          </video>
        </div>
      );
    }

    if (msg.type === 'AUDIO') {
      return (
        <div className="max-w-[250px]">
          <audio controls className="w-full">
            <source src={msg.content} />
          </audio>
        </div>
      );
    }

    if (msg.type === 'FILE') {
      return (
        <a 
          href={msg.content} 
          download 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Paperclip size={16} />
          <span className="text-sm font-medium truncate max-w-[150px]">{msg.fileName || 'File'}</span>
          {msg.fileSize && (
            <span className="text-xs opacity-60">({(msg.fileSize / 1024).toFixed(1)} KB)</span>
          )}
        </a>
      );
    }

    return <p className="text-sm font-semibold leading-relaxed break-words">{msg.content}</p>;
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const EndChatConfirmModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]"
      onClick={() => setShowEndChatConfirm(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-darkCard rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">End Chat</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Are you sure you want to end this chat with {selectedChat?.userName}?
          </p>
          {selectedChat?.userCode && (
            <p className="text-xs text-purple-500 dark:text-purple-400 font-mono mt-2">
              {selectedChat.userCode} • {selectedChat.userType}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowEndChatConfirm(false)}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEndChat}
            className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
          >
            End Chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="h-[calc(100vh-180px)] flex bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
      <div className="w-full max-w-[320px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Feed</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-brand bg-brand/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredChats.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="p-10 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  {searchTerm ? 'No matches found' : 'Awaiting incoming signals...'}
                </p>
              </motion.div>
            ) : (
              filteredChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  layout
                  onClick={() => {
                    onSelectChat(chat.id);
                    socketService.emit("loadMessages", { chatId: chat.id });
                    socketService.emit("markAsRead", { chatId: chat.id });
                  }}
                  className={`w-full p-6 flex gap-4 transition-all border-b border-slate-50 dark:border-slate-800/50 group relative ${
                    selectedChatId === chat.id
                      ? 'bg-brand/10 dark:bg-brand/5 border-l-4 border-l-brand shadow-sm'
                      : 'hover:bg-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                      selectedChatId === chat.id 
                        ? 'bg-brand text-slate-900 scale-105' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {chat.userName?.charAt(0).toUpperCase()}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white dark:border-darkCard rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                    {chat.userType && chat.userType !== 'user' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 border-2 border-white dark:border-darkCard rounded-full flex items-center justify-center">
                        <Tag size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {chat.userName}
                        </span>
                        {chat.userType && chat.userType !== 'user' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[8px] font-black uppercase">
                            {chat.userType}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-black shrink-0 ml-2">
                        {formatMessageTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-medium flex items-center">
                      {getMessageIcon(chat.lastMessageType)}
                      <span className="truncate">{chat.lastMessage}</span>
                    </p>
                    {chat.userCode && (
                      <p className="text-[8px] text-purple-500 dark:text-purple-400 font-mono mt-1 flex items-center gap-1">
                        <Code size={8} />
                        {chat.userCode}
                      </p>
                    )}
                    
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <motion.span
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className={`absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[24px] h-[24px] px-1.5 text-slate-900 text-[10px] font-black rounded-full shadow-lg border-2 border-white dark:border-darkCard transition-colors ${
                          selectedChatId === chat.id 
                            ? 'bg-slate-900 text-brand' 
                            : 'bg-brand animate-pulse'
                        }`}
                      >
                        {chat.unreadCount}
                      </motion.span>
                    ) : (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <CheckCheck size={16} className="text-brand/50" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-darkBg/5">
        {selectedChatId ? (
          <>
            <div className="p-6 bg-white dark:bg-darkCard border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/5 flex items-center justify-center text-brand font-black text-lg border border-brand/20">
                    {selectedChat?.userName?.charAt(0).toUpperCase()}
                  </div>
                  {selectedChat?.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-darkCard rounded-full" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg">{selectedChat?.userName}</h4>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-sm' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {isConnected ? 'Secure Uplink' : 'Terminal Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      {selectedChat?.userType && selectedChat.userType !== 'user' && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                          <Tag size={10} />
                          {selectedChat.userType}
                        </span>
                      )}
                      {selectedChat?.userCode && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md font-mono text-[10px] font-black flex items-center gap-1">
                          <Code size={10} />
                          {selectedChat.userCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onCreateTicket} 
                  disabled={!canCreateTickets}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-brand text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title={canCreateTickets ? "Convert to Ticket" : "Permission Denied"}
                >
                  <Ticket size={14} /> Ticket
                </button>
                <button 
                  onClick={() => setShowEndChatConfirm(true)}
                  disabled={!canRespondChat}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title={canRespondChat ? "End Chat" : "Permission Denied"}
                >
                  <LogOut size={14} /> End Chat
                </button>
                <button className="p-3 text-slate-400 hover:text-brand transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="flex justify-center">
                <span className="px-5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700">
                  Protocol AES-256 Enabled
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {messages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700"
                  >
                    <MessageSquare size={48} className="mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-20">Bridge Ready • No activity</p>
                  </motion.div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 max-w-[80%] ${msg.senderType === 'staff' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm border ${
                        msg.senderType === 'staff' 
                          ? 'bg-slate-900 text-brand border-slate-800' 
                          : 'bg-white dark:bg-slate-800 text-brand border-slate-200 dark:border-slate-700'
                      }`}>
                        {msg.senderType === 'staff' ? 'ME' : 'ID'}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.senderType === 'staff' 
                          ? 'bg-brand text-slate-900 rounded-tr-none' 
                          : 'bg-white dark:bg-darkCard text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800'
                      }`}>
                        {renderMessageContent(msg)}
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                          {msg.senderType === 'staff' && (
                            <Check size={12} className="opacity-40" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {isUploading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 ml-auto flex-row-reverse max-w-[80%]"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[9px] font-black text-brand border border-slate-800 animate-pulse">
                    ME
                  </div>
                  <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl rounded-tr-none flex items-center gap-3">
                    <Loader2 className="animate-spin text-brand w-4 h-4" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                      Uploading Media Packet...
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-8 bg-white dark:bg-darkCard border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*,audio/*,application/*" 
                    onChange={handleFileUpload} 
                    disabled={isUploading || !isConnected || !canRespondChat}
                  />
                  <button 
                    type="button" 
                    disabled={isUploading || !isConnected || !canRespondChat}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canRespondChat ? "Attach media" : "Permission Denied"}
                  >
                    <Paperclip size={24} />
                  </button>
                </div>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={!canRespondChat ? "Read-only access" : (isConnected ? "Compose secure response..." : "Link synchronizing...")}
                  disabled={!isConnected || isUploading || !canRespondChat}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  type="submit" 
                  disabled={!message.trim() || !isConnected || isUploading || !canRespondChat} 
                  className="p-4 bg-brand text-slate-900 rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                  title={canRespondChat ? "Send message" : "Permission Denied"}
                >
                  <Send size={24} className="group-disabled:opacity-50" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/10 dark:bg-darkBg/5">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ duration: 0.3 }}
              className="w-32 h-32 bg-white dark:bg-darkCard rounded-[3rem] flex items-center justify-center mb-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            >
              <MessageSquare className={`w-14 h-14 relative z-10 ${isConnected ? 'text-brand' : 'text-slate-200'}`} />
              {isConnected && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-darkCard"
                />
              )}
            </motion.div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
              {isConnected ? 'Communications Online' : 'Communications Offline'}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">
              {isConnected 
                ? 'Select an active session from the left directory to initialize the terminal interface.'
                : 'Attempting to establish secure connection...'}
            </p>
            {!isConnected && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="mt-8"
              >
                <Loader2 size={24} className="text-brand" />
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEndChatConfirm && <EndChatConfirmModal />}
      </AnimatePresence>
    </div>
  );
};
