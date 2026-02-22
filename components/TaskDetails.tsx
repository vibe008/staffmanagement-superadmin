
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Added ArrowRight to imports
import { 
  ChevronLeft, Clock, Calendar, Shield, Building2, User, 
  Flag, MessageSquare, Plus, Loader2, CheckCircle2, AlertTriangle, 
  Send, History, Trash2, Edit2, ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Task, TaskStatus, TaskPriority } from '../types';
import { fetchTaskById, updateTaskStatus, addTaskNote, deleteTask } from '../services/taskService';

interface TaskDetailsProps {
  taskId: string;
  onBack: () => void;
  onDeleted: () => void;
  onEdit: (task: Task) => void;
  user: any;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, onBack, onDeleted, onEdit, user }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canUpdateTaskStatus = user?.permissions?.includes('UPDATE_TASK_STATUS') || isSuperAdmin;
  const canUpdateTask = user?.permissions?.includes('UPDATE_TASK') || isSuperAdmin;
  const canDeleteTask = user?.permissions?.includes('DELETE_TASK') || isSuperAdmin;

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const res = await fetchTaskById(taskId);
      setTask(res.task);
      setNewStatus(res.task.status);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve task intelligence');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note && newStatus === task?.status) return;
    setSubmitting(true);
    try {
      if (newStatus !== task?.status && newStatus !== '') {
        await updateTaskStatus(taskId, { status: newStatus as TaskStatus, note });
        toast.success(`Task status updated to ${newStatus}`);
      } else {
        await addTaskNote(taskId, { note });
        toast.success('Operational note added successfully');
      }
      setNote('');
      loadTask();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Operation update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Erase this task from system records?')) {
      try {
        await deleteTask(taskId);
        toast.success('Task objective terminated successfully');
        onDeleted();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Termination failed');
      }
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-brand w-12 h-12" /></div>;
  if (!task) return <div>Task not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-3 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-sm">
          <ChevronLeft size={20}/> Back to Directory
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(task)} 
            disabled={!canUpdateTask}
            className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Edit2 size={16}/> Modify Task
          </button>
          <button 
            onClick={handleDelete} 
            disabled={!canDeleteTask}
            className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={16}/> Terminate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-brand text-slate-900`}>{task.priority} Priority</span>
              <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{task.status.replace(/_/g, ' ')}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{task.title}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">{task.description || 'No detailed briefing available.'}</p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 ml-2">
              <History className="text-brand" /> Operational History
            </h3>
            <div className="space-y-4">
              {task.taskUpdates?.map((update, i) => (
                <div key={update.id} className="relative pl-8 before:absolute before:left-0 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 last:before:hidden">
                  <div className="absolute left-[-4px] top-4 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-slate-50 dark:ring-darkBg" />
                  <div className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{update.staff.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Added an update</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(update.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{update.note}</p>
                    {update.newStatus && update.newStatus !== update.previousStatus && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Shifted:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 line-through">{update.previousStatus}</span>
                          <ArrowRight size={10} className="text-slate-400"/>
                          <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-md">{update.newStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2"><Shield className="text-brand" /> Target Assignment</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><User className="text-brand" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignee</p>
                    <p className="font-bold">{task.assignedTo?.name || task.assignedToDepartment?.name || task.assignedToRole || 'Root Level'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Calendar className="text-brand" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                    <p className="font-bold">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Expiry'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-brand" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Created By</p>
                    <p className="font-bold">{task.createdBy?.name || 'System'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-[60px]" />
          </div>

          <div className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Execution Status</h3>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current State</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Fix: Explicitly cast enum values to string[] to resolve unknown type assignment errors */}
                  {(Object.values(TaskStatus) as string[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      disabled={!canUpdateTaskStatus}
                      onClick={() => setNewStatus(s as TaskStatus)}
                      className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                        newStatus === s 
                        ? 'bg-brand text-slate-900' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Work Note</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={!canUpdateTaskStatus}
                  className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={canUpdateTaskStatus ? "Record progress or observations..." : "Read-only access"}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || (!note && newStatus === task.status) || !canUpdateTaskStatus}
                className="w-full bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
                Post Operation Update
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
