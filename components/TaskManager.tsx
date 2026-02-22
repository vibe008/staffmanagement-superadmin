
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, Search, Filter, Clock, AlertTriangle, CheckCircle2, 
  MoreVertical, Calendar, User, Tag, ArrowRight, Loader2, MessageSquare, 
  ChevronRight, Trash2, Edit, Flag, ListTodo, CheckSquare, Zap, Target,
  Activity, Briefcase, Ticket
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
      {/* Top Stats Banner - All Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Global Stats */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => { setStatusFilter('all'); setSourceFilter('all'); }}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between shadow-sm text-left ${statusFilter === 'all' && sourceFilter === 'all' ? 'bg-slate-900 border-slate-900 text-brand' : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800'}`}
        >
          <div className="p-3 bg-brand/10 rounded-2xl w-fit mb-4"><ListTodo className="w-6 h-6 text-brand"/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Global Ops</p>
            <p className="text-3xl font-black">{stats?.total || tasks.length}</p>
          </div>
        </motion.button>

        {/* Pending Stats */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => { setStatusFilter(TaskStatus.PENDING); setSourceFilter('all'); }}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between shadow-sm text-left ${statusFilter === TaskStatus.PENDING ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800'}`}
        >
          <div className={`p-3 rounded-2xl w-fit mb-4 ${statusFilter === TaskStatus.PENDING ? 'bg-white/20' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'}`}><Clock className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Pending</p>
            <p className="text-3xl font-black">{stats?.byStatus?.[TaskStatus.PENDING] || tasks.filter(t => t.status === TaskStatus.PENDING).length}</p>
          </div>
        </motion.button>

        {/* Source: Internal Stats */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => { setSourceFilter(TaskSource.INTERNAL); setStatusFilter('all'); }}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between shadow-sm text-left ${sourceFilter === TaskSource.INTERNAL ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800'}`}
        >
          <div className={`p-3 rounded-2xl w-fit mb-4 ${sourceFilter === TaskSource.INTERNAL ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}><Activity className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Internal</p>
            <p className="text-3xl font-black">{sourceStats.internal}</p>
          </div>
        </motion.button>

        {/* Source: Ticket Stats */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => { setSourceFilter(TaskSource.TICKET); setStatusFilter('all'); }}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between shadow-sm text-left ${sourceFilter === TaskSource.TICKET ? 'bg-brand border-brand text-slate-900' : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800'}`}
        >
          <div className={`p-3 rounded-2xl w-fit mb-4 ${sourceFilter === TaskSource.TICKET ? 'bg-slate-900/10' : 'bg-brand/10 text-brand'}`}><Ticket className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ticket Source</p>
            <p className="text-3xl font-black">{sourceStats.ticket}</p>
          </div>
        </motion.button>

        {/* Completed Stats */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => { setStatusFilter(TaskStatus.COMPLETED); setSourceFilter('all'); }}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between shadow-sm text-left ${statusFilter === TaskStatus.COMPLETED ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800'}`}
        >
          <div className={`p-3 rounded-2xl w-fit mb-4 ${statusFilter === TaskStatus.COMPLETED ? 'bg-white/20' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}><CheckCircle2 className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Resolved</p>
            <p className="text-3xl font-black">{stats?.byStatus?.[TaskStatus.COMPLETED] || tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</p>
          </div>
        </motion.button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search operational tasks..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-brand shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-slate-800 p-1">
            {['all', TaskSource.INTERNAL, TaskSource.TICKET].map(s => (
              <button 
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sourceFilter === s ? 'bg-brand text-slate-900' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <button 
            onClick={onCreateNew}
            disabled={!canCreateTasks}
            className="bg-brand text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-5 h-5"/>
            New Task
          </button>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-72 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem]" />
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-full py-24 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6">
                <CheckSquare className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Directory Empty</h3>
              <p className="text-slate-500 mt-2 font-medium">No active tasks match your current criteria.</p>
            </div>
          ) : filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onViewDetails(task.id)}
              className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-brand transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    disabled={!canUpdateTasks}
                    className="p-2 bg-blue-500/10 text-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white disabled:opacity-0 disabled:cursor-not-allowed"
                   >
                     <Edit size={14} />
                   </button>
                   <button 
                    onClick={(e) => handleDelete(e, task.id)}
                    disabled={!canDeleteTasks}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:opacity-0 disabled:cursor-not-allowed"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand transition-colors">
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed font-medium">
                  {task.description || 'No strategic briefing provided for this objective.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-brand/20">
                      <User className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {task.assignedTo?.name || task.assignedToDepartment?.name || 'ROOT'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Date</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'NO DEADLINE'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{task.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-full">
                     <Target size={10} className="text-brand" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Source: {task.source || task.assignmentType || 'SYSTEM'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
