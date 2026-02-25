
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, Search, Filter, Clock, AlertTriangle, CheckCircle2, 
  MoreVertical, Calendar, User, Tag, ArrowRight, Loader2, MessageSquare, 
  ChevronRight, Trash2, Edit, Flag, ListTodo, CheckSquare, Zap, Target,
  Activity, Briefcase, Ticket, RefreshCw
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Department, TaskSource } from '../types';
import { fetchAllTasks, fetchMyTasks, fetchTaskStats, deleteTask } from '../services/taskService';
import { toast } from 'react-toastify';

interface TaskManagerProps {
  viewMode: 'all' | 'my';
  departments: Department[];
  onCreateNew: () => void;
  onViewDetails: (taskId: string) => void;
  onEdit: (task: Task) => void;
  user: any;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ viewMode, departments, onCreateNew, onViewDetails, onEdit, user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canCreateTasks = user?.permissions?.includes('CREATE_TASKS') || isSuperAdmin;
  const canUpdateTasks = user?.permissions?.includes('UPDATE_TASK') || isSuperAdmin;
  const canDeleteTasks = user?.permissions?.includes('DELETE_TASK') || isSuperAdmin;

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        viewMode === 'all' ? fetchAllTasks() : fetchMyTasks(),
        fetchTaskStats()
      ]);
      setTasks(tasksRes.tasks || []);
      setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
      toast.error("Bridge failure: Could not sync task data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Permanently erase this strategic task?")) return;
    
    try {
      await deleteTask(id);
      toast.success("Task record terminated");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Termination failed");
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case TaskPriority.LOW: return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case TaskStatus.PENDING: return <Clock className="w-4 h-4 text-orange-400" />;
      case TaskStatus.IN_PROGRESS: return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case TaskStatus.CANCELLED: return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const sourceStats = useMemo(() => {
    return {
      internal: tasks.filter(t => t.source === TaskSource.INTERNAL || !t.source).length,
      ticket: tasks.filter(t => t.source === TaskSource.TICKET).length
    };
  }, [tasks]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    let matchesSource = true;
    if (sourceFilter !== 'all') {
      if (sourceFilter === TaskSource.INTERNAL) {
        matchesSource = task.source === TaskSource.INTERNAL || !task.source;
      } else {
        matchesSource = task.source === sourceFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  return (
    <div className="space-y-8">
      {/* Source Classification Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          {[
            { label: 'Global Ops', value: 'all', icon: ListTodo },
            { label: 'Internal', value: TaskSource.INTERNAL, icon: Activity },
            { label: 'Ticket Source', value: TaskSource.TICKET, icon: Ticket },
          ].map((tab) => (
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
                {tab.value === 'all' ? tasks.length : tasks.filter(t => t.source === tab.value || (!t.source && tab.value === TaskSource.INTERNAL)).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter objectives..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-brand shadow-sm font-bold text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={loadData}
            className="p-3 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand rounded-xl transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={onCreateNew}
            disabled={!canCreateTasks}
            className="bg-slate-900 dark:bg-brand text-white dark:text-slate-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={18}/>
            New Task
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: TaskStatus.PENDING },
          { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
          { label: 'Completed', value: TaskStatus.COMPLETED },
          { label: 'Cancelled', value: TaskStatus.CANCELLED },
        ].map((status) => (
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

      {/* Main Task Grid (Table) */}
      <div className="bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Objective Identification</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Source</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status & Priority</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto w-10 h-10 text-brand" />
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Strategic Data...</p>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active tasks match the current filter.</p>
                  </td>
                </tr>
              ) : filteredTasks.map((task) => (
                <tr 
                  key={task.id} 
                  onClick={() => onViewDetails(task.id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate max-w-[280px]">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-md">#{task.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                          <Clock size={10}/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand font-black border border-brand/20">
                        <User size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 dark:text-white text-xs truncate max-w-[150px]">
                          {task.assignedTo?.name || task.assignedToDepartment?.name || 'ROOT'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">
                          {task.assignedTo?.email || (task.assignedToDepartment ? 'Department Unit' : 'System Level')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                           <Target size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Assignment Model</span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                            {task.assignmentType || 'DIRECT'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                           <Briefcase size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">System Source</span>
                          <span className={`text-[10px] font-black uppercase ${
                            task.source === TaskSource.TICKET ? 'text-brand' : 'text-blue-500'
                          }`}>
                            {task.source || TaskSource.INTERNAL}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{task.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                        disabled={!canUpdateTasks}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Edit Objective"
                      >
                        <Edit size={16}/>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, task.id)}
                        disabled={!canDeleteTasks}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Terminate Record"
                      >
                        <Trash2 size={16}/>
                      </button>
                      <div className="p-3 bg-slate-900 dark:bg-slate-800 text-white dark:text-brand rounded-xl">
                        <ChevronRight size={16}/>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
