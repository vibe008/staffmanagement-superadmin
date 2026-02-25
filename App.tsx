
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { Department, AppView, Staff, User, ChatMessage, MessageType, Ticket } from './types';
import { fetchDepartments, logoutUser } from './services/apiService';
import { superadminurl } from './api';
import { ThemeToggle } from './components/ThemeToggle';
import { Sidebar } from './components/Sidebar';
import { StaffManager } from './components/StaffManager';
import { StaffForm } from './components/StaffForm';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { TaskForm } from './components/TaskForm';
import { TaskDetails } from './components/TaskDetails';
import { LiveChat } from './components/LiveChat';
import { TicketManager } from './components/TicketManager';
import { TicketForm } from './components/TicketForm';
import { ContactSupportManager } from './components/ContactSupportManager';
import { DepartmentManager } from './components/DepartmentManager';
import { SystemPermissionManager } from './components/SystemPermissionManager';
import { socketService } from './socket';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Modal & Selection States
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [sourceTicket, setSourceTicket] = useState<Ticket | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSource, setTicketSource] = useState<{ chat?: any, contact?: any } | null>(null);

  // Chat States
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      socketService.emit("joinChat", { chatId: selectedChatId });
      
      setChats(prev => prev.map(chat => {
        if (chat.id === selectedChatId) {
          return { ...chat, unreadCount: 0 };
        }
        return chat;
      }));
      setChatUnreadCount(prev => {
        const chat = chats.find(c => c.id === selectedChatId);
        return Math.max(0, prev - (chat?.unreadCount || 0));
      });
    }
  }, [selectedChatId]);

  useEffect(() => {
    const init = async () => {
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('token');
      const chatToken = sessionStorage.getItem('chatToken');
      
      if (storedUser && token) {
        const u = JSON.parse(storedUser);
        setUser(u);
        setIsLoggedIn(true);
        if (chatToken) socketService.connect(u.id, chatToken);
      }
      
      try {
        const response = await fetchDepartments();
        if (response.success) setDepartments(response.data);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Socket Listeners
    const handleActiveChats = (data: any) => {
      setChats(data);
      const totalUnread = data.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
      setChatUnreadCount(totalUnread);
      if (totalUnread > 0) notificationSound.current?.play().catch(() => {});
    };

    const handleNewChatAssigned = (data: any) => {
      setChats(prev => {
        const exists = prev.find(c => c.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });
      notificationSound.current?.play().catch(() => {});
      toast.info(`New chat assigned: ${data.userName}`);
    };

    const handleReceiveMessage = (data: any) => {
      const chatId = data.chatSessionId;
      const normalizedMessage: ChatMessage = {
        id: data.id,
        content: data.message,
        type: data.type,
        senderId: data.senderId,
        senderType: data.senderType.toLowerCase() as 'staff' | 'user',
        timestamp: data.createdAt
      };

      if (chatId === selectedChatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === normalizedMessage.id)) return prev;
          const filtered = prev.filter(m => {
            const isOptimistic = m.id?.toString().startsWith('opt-');
            const contentMatch = m.content === normalizedMessage.content;
            const senderMatch = m.senderType === normalizedMessage.senderType;
            if (isOptimistic && contentMatch && senderMatch) return false;
            return true;
          });
          return [...filtered, normalizedMessage];
        });
        socketService.emit("markAsRead", { chatId });
      } else {
        notificationSound.current?.play().catch(() => {});
      }

      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: data.message,
            lastMessageType: data.type,
            lastMessageTime: data.createdAt,
            unreadCount: chatId === selectedChatId ? 0 : (chat.unreadCount || 0) + 1
          };
        }
        return chat;
      }));
    };

    const handleChatHistory = (data: any) => {
      if (data.messages && Array.isArray(data.messages)) {
        const normalizedMessages = data.messages.map((m: any) => ({
          id: m.id,
          content: m.message,
          type: m.type,
          senderId: m.senderId,
          senderType: m.senderType.toLowerCase() as 'staff' | 'user',
          timestamp: m.createdAt
        }));
        setMessages(normalizedMessages);
      }
    };

    const handleUnreadCountUpdated = (data: any) => {
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === data.chatId) {
            return { ...chat, unreadCount: data.unreadCount };
          }
          return chat;
        });
        const total = updated.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setChatUnreadCount(total);
        return updated;
      });
    };

    const handleChatRemoved = (data: any) => {
      setChats(prev => prev.filter(c => c.id !== data.chatId));
      if (selectedChatId === data.chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
    };

    socketService.on("myActiveChats", handleActiveChats);
    socketService.on("newChatAssigned", handleNewChatAssigned);
    socketService.on("receiveMessage", handleReceiveMessage);
    socketService.on("chatHistory", handleChatHistory);
    socketService.on("unreadCountUpdated", handleUnreadCountUpdated);
    socketService.on("chatRemoved", handleChatRemoved);

    return () => {
      socketService.off("myActiveChats", handleActiveChats);
      socketService.off("newChatAssigned", handleNewChatAssigned);
      socketService.off("receiveMessage", handleReceiveMessage);
      socketService.off("chatHistory", handleChatHistory);
      socketService.off("unreadCountUpdated", handleUnreadCountUpdated);
      socketService.off("chatRemoved", handleChatRemoved);
    };
  }, [selectedChatId]);

  const handleLogout = async () => {
    await logoutUser();
    socketService.disconnect();
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
    toast.info('Securely signed out');
  };

  const handleSendMessage = (content: string, type: MessageType) => {
    if (!selectedChatId || !user) return;
    const optimisticMessage: ChatMessage = {
      id: `opt-${Date.now()}`,
      content: content,
      type: type,
      senderId: user.id,
      senderType: 'staff',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    socketService.emit("staffSendMessage", {
      chatId: selectedChatId,
      message: content,
      type
    });
  };

  const handleEndChat = (chatId: string) => {
    socketService.emit("staffEndChat", { chatId });
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/hr')) return 'hr';
    if (path === '/departments') return 'department_manager';
    if (path === '/permissions') return 'system_permissions';
    if (path === '/tasks/my') return 'my_tasks';
    if (path.startsWith('/tasks')) return 'task_list';
    if (path === '/chat') return 'live_chat';
    if (path === '/tickets') return 'tickets';
    if (path === '/support-feed') return 'contact_support_list';
    return 'home';
  };

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg"><Loader2 className="w-12 h-12 text-brand animate-spin" /></div>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" aria-label="Notifications" />
      <AnimatePresence mode="wait">
        <Routes location={location}>
          {!isLoggedIn ? (
            <Route path="*" element={
              <Login departments={departments} onLoginSuccess={(u, t, ct) => { 
                sessionStorage.setItem('token', t); 
                sessionStorage.setItem('user', JSON.stringify(u)); 
                if (ct) {
                  sessionStorage.setItem('chatToken', ct);
                  socketService.connect(u.id, ct);
                }
                setUser(u); 
                setIsLoggedIn(true); 
                navigate('/');
              }} />
            } />
          ) : (
            <Route path="*" element={
              <div className="flex min-h-screen bg-slate-50 dark:bg-darkBg">
                <Sidebar 
                  onLogout={handleLogout} 
                  onNavigate={(view) => {
                    const viewToPath: Record<string, string> = {
                      'home': '/',
                      'hr': '/hr',
                      'create_staff': '/hr/create',
                      'department_manager': '/departments',
                      'system_permissions': '/permissions',
                      'my_tasks': '/tasks/my',
                      'task_list': '/tasks',
                      'create_task': '/tasks/create',
                      'live_chat': '/chat',
                      'tickets': '/tickets',
                      'contact_support_list': '/support-feed'
                    };
                    if (view === 'create_task') {
                      setEditingTask(null);
                      setShowTaskForm(true);
                    } else {
                      navigate(viewToPath[view] || '/');
                    }
                  }} 
                  user={user} 
                  activeTab={getActiveTab() as any} 
                  chatUnreadCount={chatUnreadCount}
                />
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                  <header className="flex items-center justify-between mb-8">
                    {location.pathname !== '/hr' && location.pathname !== '/permissions' ? (
                      <h1 className="text-4xl font-black text-slate-900 dark:text-white capitalize">
                        {location.pathname === '/' ? 'Home' : location.pathname.substring(1).replace(/\//g, ' ').replace(/_/g, ' ')}
                      </h1>
                    ) : <div />}
                    <ThemeToggle />
                  </header>
                  
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/hr" element={
                      <StaffManager 
                        departments={departments} 
                        onEdit={(staff) => { setSelectedStaff(staff); navigate(`/hr/edit/${staff.id}`); }} 
                        onAdd={() => { setSelectedStaff(null); navigate('/hr/create'); }}
                        onManagePermissions={(staff) => { setSelectedStaff(staff); }}
                        selectedStaffForPermissions={selectedStaff} 
                        onClosePermissions={() => setSelectedStaff(null)}
                        user={user}
                      />
                    } />
                    <Route path="/hr/create" element={
                      <StaffForm 
                        departments={departments} 
                        staffId={null} 
                        onBack={() => navigate('/hr')} 
                        onSuccess={() => navigate('/hr')} 
                      />
                    } />
                    <Route path="/hr/edit/:id" element={<StaffFormWrapper departments={departments} onBack={() => navigate('/hr')} onSuccess={() => navigate('/hr')} />} />
                    <Route path="/departments" element={<DepartmentManager />} />
                    <Route path="/permissions" element={<SystemPermissionManager />} />
                    <Route path="/tasks" element={
                      <TaskManager 
                        viewMode="all" 
                        departments={departments}
                        onCreateNew={() => { setEditingTask(null); setShowTaskForm(true); }}
                        onViewDetails={(id) => navigate(`/tasks/${id}`)}
                        onEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }}
                        user={user}
                      />
                    } />
                    <Route path="/tasks/my" element={
                      <TaskManager 
                        viewMode="my" 
                        departments={departments}
                        onCreateNew={() => { setEditingTask(null); setShowTaskForm(true); }}
                        onViewDetails={(id) => navigate(`/tasks/${id}`)}
                        onEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }}
                        user={user}
                      />
                    } />
                    <Route path="/tasks/:id" element={<TaskDetailsWrapper user={user} onDeleted={() => navigate('/tasks')} onEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }} onBack={() => navigate(-1)} />} />
                    <Route path="/chat" element={
                      <LiveChat 
                        chats={chats}
                        selectedChatId={selectedChatId}
                        onSelectChat={setSelectedChatId}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onEndChat={handleEndChat}
                        onCreateTicket={() => {
                          const chat = chats.find(c => c.id === selectedChatId);
                          setTicketSource({ chat });
                          setShowTicketForm(true);
                        }}
                        user={user}
                      />
                    } />
                    <Route path="/tickets" element={<TicketManager onConvertToTask={(ticket) => { setSourceTicket(ticket); setShowTaskForm(true); }} user={user} />} />
                    <Route path="/support-feed" element={<ContactSupportManager onConvertToTicket={(contact) => { setTicketSource({ contact }); setShowTicketForm(true); }} user={user} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            } />
          )}
        </Routes>
      </AnimatePresence>

      {/* Global Overlays */}
      <AnimatePresence>
        {showTaskForm && (
          <TaskForm 
            departments={departments}
            editingTask={editingTask}
            sourceTicket={sourceTicket}
            onClose={() => { setShowTaskForm(false); setEditingTask(null); setSourceTicket(null); }}
            onSuccess={() => { setShowTaskForm(false); setEditingTask(null); setSourceTicket(null); }}
          />
        )}
        {showTicketForm && ticketSource && (
          <TicketForm 
            chat={ticketSource.chat}
            contact={ticketSource.contact}
            onClose={() => { setShowTicketForm(false); setTicketSource(null); }}
            onSuccess={() => { setShowTicketForm(false); setTicketSource(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const StaffFormWrapper: React.FC<{ departments: Department[], onBack: () => void, onSuccess: () => void }> = ({ departments, onBack, onSuccess }) => {
  const { id } = useParams();
  return <StaffForm departments={departments} staffId={id || null} onBack={onBack} onSuccess={onSuccess} />;
};

const TaskDetailsWrapper: React.FC<{ user: any, onDeleted: () => void, onEdit: (task: any) => void, onBack: () => void }> = ({ user, onDeleted, onEdit, onBack }) => {
  const { id } = useParams();
  return <TaskDetails taskId={id!} onBack={onBack} onDeleted={onDeleted} onEdit={onEdit} user={user} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
