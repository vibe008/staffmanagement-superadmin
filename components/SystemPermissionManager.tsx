
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Plus, Edit2, Trash2, Search, Loader2, Key, Info, 
  X, CheckCircle2, Lock, Tag, Layers, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { SystemPermission, PermissionGroupResponse } from '../types';
import * as permissionService from '../services/permissionService';
import { Input } from './UI';

export const SystemPermissionManager: React.FC = () => {
  const [groupedPermissions, setGroupedPermissions] = useState<PermissionGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modal, setModal] = useState<{
    mode: 'CREATE' | 'EDIT';
    id?: string;
    initialData?: Partial<SystemPermission>;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    group: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await permissionService.fetchAllPermissions();
      if (res.success) setGroupedPermissions(res.data);
    } catch (err) {
      toast.error('Failed to sync system permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res: any;
      if (modal?.mode === 'CREATE') {
        res = await permissionService.createPermission(formData);
      } else {
        res = await permissionService.updatePermission(modal!.id!, {
          label: formData.label,
          group: formData.group
        });
      }

      if (res.success) {
        toast.success(`Permission ${modal?.mode === 'CREATE' ? 'initialized' : 'synchronized'}`);
        loadData();
        setModal(null);
      } else {
        toast.error(res.message || 'Operation failure');
      }
    } catch (err) {
      toast.error('Network protocol violation during update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('WARNING: Erasing this permission protocol may affect staff clearance. Proceed?')) return;
    try {
      const res = await permissionService.deletePermission(id);
      if (res.success) {
        toast.success('Protocol purged from system');
        loadData();
      } else {
        toast.error(res.message || 'Purge denied');
      }
    } catch (err) {
      toast.error('Purge failure: Core unreachable');
    }
  };

  const filteredGroups = groupedPermissions.map(group => ({
    ...group,
    permissions: group.permissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.group.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.permissions.length > 0);

  return (
    <div className="space-y-6">
      {/* Compact AWS Style Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-darkCard p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Security Matrix</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Manage Global Protocol Definitions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 lg:max-w-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search protocol IDs..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand shadow-none text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setModal({ mode: 'CREATE' });
              setFormData({ name: '', label: '', group: '' });
            }}
            className="bg-brand text-slate-900 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-brand/10 hover:scale-105 active:scale-95 transition-all"
            title="Register New Permission"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-darkCard rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Identifier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Label</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Sector</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="loading">
                    <td colSpan={4} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin w-10 h-10 text-brand" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Matrix Protocol...</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : filteredGroups.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="empty">
                    <td colSpan={4} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Info className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No protocols mapped in this sector</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : filteredGroups.map((group) => (
                  <React.Fragment key={group.group}>
                    {/* Group Header Row */}
                    <tr className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50">
                      <td colSpan={4} className="px-8 py-3">
                         <div className="flex items-center gap-2">
                           <Tag size={12} className="text-brand" />
                           <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">{group.group} SECTOR</span>
                         </div>
                      </td>
                    </tr>
                    {group.permissions.map((perm, idx) => (
                      <motion.tr 
                        key={perm.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-brand border border-slate-200 dark:border-slate-700 shadow-sm">
                               <Key size={14} />
                            </div>
                            <span className="font-mono text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{perm.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{perm.label}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <Tag size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.group}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setModal({ mode: 'EDIT', id: perm.id });
                                setFormData({ name: perm.name, label: perm.label, group: group.group });
                              }}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand hover:border-brand rounded-xl transition-all shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(perm.id)}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 rounded-xl transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-darkCard w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-10 text-center">
                   <div className="w-20 h-20 bg-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand/40">
                      <Shield className="w-10 h-10 text-slate-900" />
                   </div>
                   <h3 className="text-3xl font-black mb-2">
                     {modal.mode === 'CREATE' ? 'Register' : 'Synchronize'} Protocol
                   </h3>
                   <p className="text-slate-500 font-medium mb-8">Establish structural security parameters.</p>

                   <form onSubmit={handleAction} className="space-y-5">
                      <Input 
                        label="System Key (Name)" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_')})} 
                        disabled={modal.mode === 'EDIT'}
                        placeholder="e.g. VIEW_SECURE_REPORTS"
                        required
                        icon={<Key size={16}/>}
                      />
                      <Input 
                        label="Display Label" 
                        value={formData.label} 
                        onChange={e => setFormData({...formData, label: e.target.value})} 
                        placeholder="e.g. Access Financial Logs"
                        required
                        icon={<Layers size={16}/>}
                      />
                      <Input 
                        label="Group Category" 
                        value={formData.group} 
                        onChange={e => setFormData({...formData, group: e.target.value.toUpperCase()})} 
                        placeholder="e.g. REPORTS"
                        required
                        icon={<Tag size={16}/>}
                      />
                      <div className="flex gap-4 pt-4">
                         <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                         <button type="submit" className="flex-[2] bg-brand text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20">
                           {modal.mode === 'CREATE' ? 'Initialize' : 'Update'} Entry
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
