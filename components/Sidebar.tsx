
import React, { useState } from 'react';
import { 
  Home, LayoutDashboard, Package, Receipt, TrendingUp, Users, Wallet, 
  Settings2, Megaphone, LifeBuoy, CheckSquare, Settings, Trophy, 
  Database, LogOut, ChevronLeft, ChevronRight, Menu, X, UserPlus, ChevronDown, 
  ListTodo, PlusCircle, UserCheck, MessageCircle, HelpCircle, Ticket, Mail,
  Building2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView } from '../types';

interface SidebarProps {
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
  user: any;
  activeTab: AppView;
  chatUnreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, onNavigate, user, activeTab, chatUnreadCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hrExpanded, setHrExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const hasPermission = (p: string) => user?.permissions?.includes(p) || isSuperAdmin;

  const navItems: any[] = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: LayoutDashboard, label: 'Business Dashboard', id: 'business', isPermitted: hasPermission('VIEW_REPORTS') },
    { icon: Package, label: 'Products Manager', id: 'products', subLabel: 'MySmartPG & MyStrax', isPermitted: hasPermission('VIEW_CUSTOMERS') },
    { icon: Receipt, label: 'Expenses', id: 'expenses', isPermitted: hasPermission('VIEW_REPORTS') },
    { icon: TrendingUp, label: 'Sales', id: 'sales', isPermitted: hasPermission('VIEW_REPORTS') },
    { 
      icon: Users, 
      label: 'HR & Employee Manager', 
      id: 'hr_group',
      isPermitted: hasPermission('MANAGE_USERS'),
      subItems: [
        { icon: ListTodo, label: 'Employee List', id: 'hr' },
        { icon: UserPlus, label: 'Add Employee', id: 'create_staff' },
        { icon: Building2, label: 'Organization Units', id: 'department_manager' },
        { icon: ShieldAlert, label: 'System Permissions', id: 'system_permissions' }
      ]
    },
    { 
      icon: CheckSquare, 
      label: 'Task Manager', 
      id: 'tasks_group',
      isPermitted: hasPermission('VIEW_TASKS'),
      subItems: [
        { icon: UserCheck, label: 'My Tasks', id: 'my_tasks' },
        { icon: ListTodo, label: 'All Tasks', id: 'task_list', isPermitted: hasPermission('VIEW_TASKS') },
        { icon: PlusCircle, label: 'Create New Task', id: 'create_task', isPermitted: hasPermission('CREATE_TASKS') }
      ]
    },
    { 
      icon: LifeBuoy, 
      label: 'Support', 
      id: 'support_group',
      isPermitted: hasPermission('VIEW_CHAT') || hasPermission('VIEW_TICKETS') || hasPermission('CONTACT_SUPPORT'),
      badge: chatUnreadCount,
      subItems: [
        { 
          icon: MessageCircle, 
          label: 'Live Chat', 
          id: 'live_chat',
          isPermitted: hasPermission('VIEW_CHAT') || hasPermission('RESPOND_CHAT'),
          badge: chatUnreadCount
        },
        { 
          icon: Ticket, 
          label: 'Support Tickets', 
          id: 'tickets',
          isPermitted: hasPermission('VIEW_TICKETS')
        },
        { 
          icon: Mail, 
          label: 'Contact Support Feed', 
          id: 'contact_support_list',
          isPermitted: hasPermission('CONTACT_SUPPORT')
        }
      ]
    },
    { icon: Wallet, label: 'Account Manager', id: 'account', isPermitted: hasPermission('VIEW_REPORTS') },
    { icon: Settings2, label: 'Operations Manager', id: 'operations', isPermitted: isSuperAdmin },
    { icon: Megaphone, label: 'Advertisement', id: 'ads', isPermitted: isSuperAdmin },
    { icon: Trophy, label: 'CRM Lead Board', id: 'crm', isPermitted: hasPermission('VIEW_CUSTOMERS') },
    { icon: Database, label: 'Backup and Restore', id: 'backup', isPermitted: isSuperAdmin },
    { icon: Settings, label: 'Setting', id: 'setting' },
  ];

  const handleNavClick = (item: any) => {
    if (item.subItems) {
      if (item.id === 'hr_group') setHrExpanded(!hrExpanded);
      if (item.id === 'tasks_group') setTasksExpanded(!tasksExpanded);
      if (item.id === 'support_group') setSupportExpanded(!supportExpanded);
    } else {
      onNavigate(item.id as AppView);
      if (window.innerWidth < 1024) setMobileOpen(false);
    }
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 bg-brand text-slate-900 rounded-lg shadow-lg">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[50]" />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={mobileOpen ? { x: 0 } : (window.innerWidth < 1024 ? { x: -300 } : (collapsed ? { width: 80 } : { width: 280 }))}
        className="fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-darkCard border-r border-slate-200 dark:border-slate-800 z-[55] flex flex-col shadow-xl lg:shadow-none transition-colors duration-300"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-brand rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-brand/20">
              <Package className="text-slate-900 w-6 h-6" />
            </div>
            {!collapsed && <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white truncate">Shivom <span className="text-brand">Group</span></span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-brand/20">
                <Users className="w-5 h-5 text-brand" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{user?.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold truncate">{user?.role}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (item.isSuperOnly && !isSuperAdmin) return null;
              if (item.isPermitted === false) return null;

              const isExpanded = item.id === 'hr_group' ? hrExpanded : (item.id === 'tasks_group' ? tasksExpanded : (item.id === 'support_group' ? supportExpanded : false));

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative ${
                      (activeTab === item.id || (item.subItems && item.subItems.some((sub: any) => sub.id === activeTab)))
                      ? 'bg-brand text-slate-900 shadow-md shadow-brand/10' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand'
                    }`}
                  >
                    <div className="relative">
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${(activeTab === item.id || (item.subItems && item.subItems.some((sub: any) => sub.id === activeTab))) ? 'text-slate-900' : 'group-hover:text-brand'}`} />
                      {item.badge !== undefined && item.badge > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }}
                          className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-brand text-slate-900 text-[9px] font-black rounded-full border-2 border-white dark:border-darkCard shadow-lg ${activeTab === item.id ? 'bg-slate-900 text-brand' : ''}`}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold text-sm truncate">{item.label}</span>
                          {item.subLabel && <span className={`text-[10px] leading-tight opacity-70 ${(activeTab === item.id || (item.subItems && item.subItems.some((sub: any) => sub.id === activeTab))) ? 'text-slate-900' : 'text-slate-400'}`}>{item.subLabel}</span>}
                        </div>
                        {item.subItems && <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {item.subItems && isExpanded && !collapsed && (
                      <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-6 mt-1 space-y-1 overflow-hidden">
                        {item.subItems.map(sub => {
                          if (sub.isPermitted === false) return null;
                          return (
                            <li key={`${item.id}-${sub.id}`}>
                              <button
                                onClick={() => {
                                  onNavigate(sub.id as AppView);
                                  if (window.innerWidth < 1024) setMobileOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-all ${
                                  activeTab === sub.id ? 'text-brand' : 'text-slate-500 dark:text-slate-400 hover:text-brand'
                                }`}
                              >
                                <sub.icon className="w-4 h-4" />
                                {sub.label}
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 mt-auto">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-semibold">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
