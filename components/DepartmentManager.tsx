
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Building2, Layers, Briefcase, 
  ChevronRight, ChevronDown, Loader2, Target, Info, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Department, SubDepartment, Designation } from '../types';
import * as deptService from '../services/departmentService';
import { Input } from './UI';

export const DepartmentManager: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);

  // Modal State
  const [modal, setModal] = useState<{
    type: 'DEPT' | 'SUB' | 'DESIG';
    mode: 'CREATE' | 'EDIT';
    id?: string;
    parentId?: string;
    initialValue?: string;
  } | null>(null);
  const [modalValue, setModalValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await deptService.fetchHierarchy();
      if (res.success) setHierarchy(res.data);
    } catch (err) {
      toast.error('Failed to load organizational hierarchy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSub = (id: string) => {
    setExpandedSubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalValue.trim()) return;

    try {
      let res: any;
      if (modal?.type === 'DEPT') {
        res = modal.mode === 'CREATE' 
          ? await deptService.createDepartment(modalValue)
          : await deptService.updateDepartment(modal.id!, modalValue);
      } else if (modal?.type === 'SUB') {
        res = modal.mode === 'CREATE'
          ? await deptService.createSubDepartment(modalValue, modal.parentId!)
          : await deptService.updateSubDepartment(modal.id!, modalValue, modal.parentId!);
      } else if (modal?.type === 'DESIG') {
        res = modal.mode === 'CREATE'
          ? await deptService.createDesignation(modalValue, modal.parentId!)
          : await deptService.updateDesignation(modal.id!, modalValue, modal.parentId!);
      }

      if (res.success) {
        toast.success('Hierarchy updated successfully');
        loadData();
        setModal(null);
        setModalValue('');
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Network protocol error during update');
    }
  };

  const handleDelete = async (type: 'DEPT' | 'SUB' | 'DESIG', id: string) => {
    if (!window.confirm('Are you sure you want to delete this structural element? It must be empty of staff.')) return;

    try {
      let res: any;
      if (type === 'DEPT') res = await deptService.deleteDepartment(id);
      else if (type === 'SUB') res = await deptService.deleteSubDepartment(id);
      else res = await deptService.deleteDesignation(id);

      if (res.success) {
        toast.success('Element removed from hierarchy');
        loadData();
      } else {
        toast.error(res.message || 'Deletion denied: Check for active links or staff');
      }
    } catch (err) {
      toast.error('Deletion failure: System unreachable');
    }
  };

  if (loading) return <div className="h-64 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-brand w-12 h-12" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Org Structure...</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Organizational Control</h2>
          <p className="text-slate-500 text-sm mt-1">Configure departments, sub-units, and professional designations.</p>
        </div>
        <button 
          onClick={() => { setModal({ type: 'DEPT', mode: 'CREATE' }); setModalValue(''); }}
          className="bg-brand text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-brand/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      <div className="space-y-4">
        {hierarchy.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-darkCard rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
             <Building2 className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No organizational data found</p>
          </div>
        ) : hierarchy.map(dept => (
          <div key={dept.id} className="bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            <div className="p-6 flex items-center justify-between group">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleDept(dept.id)}>
                <div className="p-3 bg-brand/10 text-brand rounded-xl">
                  {expandedDepts.includes(dept.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <Building2 className="text-brand w-6 h-6" />
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{dept.name}</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-400 rounded-md uppercase">Dept</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setModal({ type: 'SUB', mode: 'CREATE', parentId: dept.id }); setModalValue(''); }}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all" title="Add Sub-Dept"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => { setModal({ type: 'DEPT', mode: 'EDIT', id: dept.id, initialValue: dept.name }); setModalValue(dept.name); }}
                  className="p-2 text-slate-400 hover:text-brand rounded-lg transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete('DEPT', dept.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedDepts.includes(dept.id) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 dark:border-slate-800 pl-12 pr-6 py-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/10"
                >
                  {dept.subDepartments?.length === 0 ? (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">No sub-departments defined</p>
                  ) : dept.subDepartments.map(sub => (
                    <div key={sub.id} className="space-y-2">
                       <div className="flex items-center justify-between p-4 bg-white dark:bg-darkCard rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSub(sub.id)}>
                            {expandedSubs.includes(sub.id) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                            <Layers className="text-blue-500 w-4 h-4" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                               onClick={() => { setModal({ type: 'DESIG', mode: 'CREATE', parentId: sub.id }); setModalValue(''); }}
                               className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                            >
                               <Plus size={16} />
                            </button>
                            <button 
                               onClick={() => { setModal({ type: 'SUB', mode: 'EDIT', id: sub.id, parentId: dept.id, initialValue: sub.name }); setModalValue(sub.name); }}
                               className="p-1.5 text-slate-400 hover:text-brand rounded-lg transition-all"
                            >
                               <Edit2 size={16} />
                            </button>
                            <button 
                               onClick={() => handleDelete('SUB', sub.id)}
                               className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                       </div>

                       <AnimatePresence>
                         {expandedSubs.includes(sub.id) && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-12 space-y-2 overflow-hidden">
                              {sub.designations?.length === 0 ? (
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest py-1">No designations listed</p>
                              ) : sub.designations?.map(des => (
                                <div key={des.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 group">
                                   <div className="flex items-center gap-3">
                                      <Briefcase className="text-slate-400 w-3.5 h-3.5" />
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{des.title}</span>
                                   </div>
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => { setModal({ type: 'DESIG', mode: 'EDIT', id: des.id, parentId: sub.id, initialValue: des.title }); setModalValue(des.title); }}
                                        className="p-1 text-slate-400 hover:text-brand"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete('DESIG', des.id)}
                                        className="p-1 text-red-400 hover:text-red-500"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-darkCard w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-10 text-center">
                   <div className="w-20 h-20 bg-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand/40">
                      {modal.type === 'DEPT' ? <Building2 className="w-10 h-10 text-slate-900" /> : modal.type === 'SUB' ? <Layers className="w-10 h-10 text-slate-900" /> : <Briefcase className="w-10 h-10 text-slate-900" />}
                   </div>
                   <h3 className="text-3xl font-black mb-2">
                     {modal.mode === 'CREATE' ? 'Add' : 'Edit'} {modal.type === 'DEPT' ? 'Department' : modal.type === 'SUB' ? 'Sub-Dept' : 'Designation'}
                   </h3>
                   <p className="text-slate-500 font-medium mb-8">Structural protocol update required.</p>

                   <form onSubmit={handleAction} className="space-y-6">
                      <Input 
                        label={`${modal.type} Name/Title`} 
                        value={modalValue} 
                        onChange={e => setModalValue(e.target.value)} 
                        autoFocus 
                        required
                        placeholder="Enter identification..."
                      />
                      <div className="flex gap-4">
                         <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                         <button type="submit" className="flex-[2] bg-brand text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20">
                           {modal.mode === 'CREATE' ? 'Initialize' : 'Update'} Records
                         </button>
                      </div>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
