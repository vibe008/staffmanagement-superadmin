
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, Building2, User, Layers, Shield, Calendar, AlignLeft, Type, Flag, Ticket } from 'lucide-react';
import { toast } from 'react-toastify';
import { Department, TaskPriority, Role, User as UserType, Ticket as TicketType } from '../types';
import { createTask, updateTask, convertTicketToTask } from '../services/taskService';
import { fetchAllStaff } from '../services/staffService';
import { Input, Select } from './UI';

interface TaskFormProps {
  departments: Department[];
  editingTask?: any;
  sourceTicket?: TicketType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ departments, editingTask, sourceTicket, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignmentType, setAssignmentType] = useState<'STAFF' | 'DEPARTMENT' | 'SUBDEPARTMENT' | 'ROLE'>('STAFF');

  const [formData, setFormData] = useState({
    title: editingTask?.title || (sourceTicket ? `Escalated Ticket #${sourceTicket.id.slice(0, 8)}: ${sourceTicket.subject}` : ''),
    description: editingTask?.description || sourceTicket?.description || '',
    priority: editingTask?.priority || (sourceTicket?.priority?.toUpperCase() as TaskPriority) || TaskPriority.MEDIUM,
    dueDate: editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '',
    assignedToId: editingTask?.assignedToId || '',
    assignedToDepartmentId: editingTask?.assignedToDepartmentId || '',
    assignedToSubDepartmentId: editingTask?.assignedToSubDepartmentId || '',
    assignedToRole: editingTask?.assignedToRole || ''
  });

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await fetchAllStaff();
        setStaffList(staff);
      } catch (err) {
        console.error(err);
      }
    };
    loadStaff();
  }, []);
  console.log("sourceTicket",sourceTicket)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      assignedToId: assignmentType === 'STAFF' ? formData.assignedToId : null,
      assignedToDepartmentId: assignmentType === 'DEPARTMENT' ? formData.assignedToDepartmentId : null,
      assignedToSubDepartmentId: assignmentType === 'SUBDEPARTMENT' ? formData.assignedToSubDepartmentId : null,
      assignedToRole: assignmentType === 'ROLE' ? formData.assignedToRole : null
    };

    try {
      if (sourceTicket) {
        await convertTicketToTask(sourceTicket.id, payload);
        toast.success('Ticket successfully escalated to System Task 🚀');
      } else if (editingTask) {
        await updateTask(editingTask.id, payload);
        toast.success('Task objective updated successfully');
      } else {
        await createTask(payload);
        toast.success('New task deployed to system');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Action failed');
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedDept = departments.find(d => d.id === formData.assignedToDepartmentId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative bg-white dark:bg-darkCard w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg ${sourceTicket ? 'bg-brand shadow-brand/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
              {sourceTicket ? <Ticket className="text-slate-900 w-6 h-6" /> : <Shield className="text-brand w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {sourceTicket ? 'Escalate to Task' : editingTask ? 'Update Strategic Task' : 'Initialize New Task'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {sourceTicket ? `Escalating Ticket #${sourceTicket.id.slice(0, 8)}` : 'Define operational objectives and assignments.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Input 
            label="Task Title" 
            icon={<Type className="w-5 h-5"/>} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            placeholder="e.g. Q3 Financial Audit Prep" 
            required 
          />

          <div className="space-y-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Detailed Description</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand"><AlignLeft className="w-5 h-5" /></div>
              <textarea 
                className="w-full min-h-[120px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all resize-none"
                placeholder="Specify task requirements and expected deliverables..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Priority Level" icon={<Flag className="w-5 h-5"/>} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}>
              {/* Fix: Explicitly cast enum values to string[] to resolve unknown type assignment errors */}
              {(Object.values(TaskPriority) as string[]).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Input label="Deadline" type="date" icon={<Calendar className="w-5 h-5"/>} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Assignment Model</label>
            <div className="flex flex-wrap gap-2">
              {['STAFF', 'DEPARTMENT', 'SUBDEPARTMENT', 'ROLE'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAssignmentType(type as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    assignmentType === type 
                    ? 'bg-brand text-slate-900 shadow-lg shadow-brand/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {assignmentType === 'STAFF' && (
                <motion.div key="staff" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Select label="Assign to Employee" icon={<User className="w-5 h-5"/>} value={formData.assignedToId} onChange={e => setFormData({...formData, assignedToId: e.target.value})}>
                    <option value="">Select individual...</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                  </Select>
                </motion.div>
              )}
              {assignmentType === 'DEPARTMENT' && (
                <motion.div key="dept" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Select label="Assign to Department" icon={<Building2 className="w-5 h-5"/>} value={formData.assignedToDepartmentId} onChange={e => setFormData({...formData, assignedToDepartmentId: e.target.value})}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </motion.div>
              )}
              {assignmentType === 'SUBDEPARTMENT' && (
                <motion.div key="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <Select label="Department" icon={<Building2 className="w-5 h-5"/>} value={formData.assignedToDepartmentId} onChange={e => setFormData({...formData, assignedToDepartmentId: e.target.value, assignedToSubDepartmentId: ''})}>
                    <option value="">Select department first...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                  <Select label="Sub-Department" icon={<Layers className="w-5 h-5"/>} value={formData.assignedToSubDepartmentId} onChange={e => setFormData({...formData, assignedToSubDepartmentId: e.target.value})} disabled={!formData.assignedToDepartmentId}>
                    <option value="">Select specialized unit...</option>
                    {selectedDept?.subDepartments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </motion.div>
              )}
              {assignmentType === 'ROLE' && (
                <motion.div key="role" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Select label="Assign to Global Role" icon={<Shield className="w-5 h-5"/>} value={formData.assignedToRole} onChange={e => setFormData({...formData, assignedToRole: e.target.value})}>
                    <option value="">Select role tier...</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="TASK_ASSIGNER">TASK_ASSIGNER</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="ADMIN">ADMIN</option>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-8 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                <>{sourceTicket ? <Ticket className="w-6 h-6" /> : <Save className="w-6 h-6" />}{sourceTicket ? 'Convert to Task' : editingTask ? 'Update Task' : 'Deploy Task'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
