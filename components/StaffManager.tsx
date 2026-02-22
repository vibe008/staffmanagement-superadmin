
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Search, Edit2, Trash2, Key, Loader2, ShieldCheck, Mail, 
  Building2, Activity, Archive, RotateCcw, UserCheck, Users, Info, Layers,
  ChevronRight, Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Staff, Department, Designation } from '../types';
import { 
  fetchRegistrationSummary, 
  fetchNewRegistrations, 
  fetchPastRegistrations, 
  moveStaffToPast, 
  moveStaffToNew, 
  permanentDeleteStaff 
} from '../services/staffService';
import { PermissionManager } from './PermissionManager';

interface StaffManagerProps {
  departments: Department[];
  onEdit: (staff: Staff) => void;
  onAdd: () => void;
  onManagePermissions: (staff: Staff) => void;
  selectedStaffForPermissions: Staff | null;
  onClosePermissions: () => void;
  user: any;
}

type RegType = 'NEW' | 'PAST' | 'ALL';

export const StaffManager: React.FC<StaffManagerProps> = ({ 
  departments, onEdit, onAdd, onManagePermissions, selectedStaffForPermissions, onClosePermissions, user
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<RegType>('ALL');
  const [summary, setSummary] = useState({ new: 0, past: 0, total: 0 });

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPERADMIN';
  const canManageUsers = user?.permissions?.includes('MANAGE_USERS') || isSuperAdmin;

  useEffect(() => { 
    loadData(); 
  }, [viewType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const summaryRes = await fetchRegistrationSummary();
      setSummary(summaryRes.summary);

      let data: Staff[] = [];
      if (viewType === 'ALL') {
        const [newRes, pastRes] = await Promise.all([
          fetchNewRegistrations(),
          fetchPastRegistrations()
        ]);
        const active = (newRes as Staff[]).map(s => ({ ...s, registrationType: 'NEW' as const }));
        const archive = (pastRes as Staff[]).map(s => ({ ...s, registrationType: 'PAST' as const }));
        data = [...active, ...archive];
      } else if (viewType === 'NEW') {
        const res = await fetchNewRegistrations();
        data = (res as Staff[]).map(s => ({ ...s, registrationType: 'NEW' as const }));
      } else {
        const res = await fetchPastRegistrations();
        data = (res as Staff[]).map(s => ({ ...s, registrationType: 'PAST' as const }));
      }
      
      setStaffList(data);
    } catch (err) {
      toast.error('Sync failure: Strategic records unreachable');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('⚠️ WARNING: This will permanently erase all history, tasks, and documents for this asset. Proceed?')) {
      try {
        await permanentDeleteStaff(id);
        toast.success('Asset record purged from core');
        loadData();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await moveStaffToPast(id);
      toast.info('Asset moved to past records');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await moveStaffToNew(id);
      toast.success('Asset restored to current operations');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getDesignationLabel = (designation: string | Designation | undefined): string => {
    if (!designation) return 'Specialist';
    if (typeof designation === 'object' && 'title' in designation) {
      return designation.title;
    }
    return String(designation);
  };

  if (selectedStaffForPermissions) {
    return (
      <PermissionManager 
        staff={selectedStaffForPermissions} 
        onBack={onClosePermissions} 
        onSave={() => { onClosePermissions(); loadData(); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* AWS Style Compact Header with Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-darkCard p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Compact Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
          {[
            { id: 'NEW', label: 'Current', count: summary.new, icon: UserCheck },
            { id: 'PAST', label: 'Past', count: summary.past, icon: Archive },
            { id: 'ALL', label: 'Total', count: summary.total, icon: Layers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewType(tab.id as RegType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === tab.id
                  ? 'bg-white dark:bg-brand text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={14} className={viewType === tab.id ? 'text-slate-900' : 'text-slate-400'} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${viewType === tab.id ? 'bg-slate-900/10' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions aligned to the right */}
        <div className="flex items-center gap-3 flex-1 lg:max-w-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand shadow-none text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={onAdd}
            disabled={!canManageUsers}
            className="bg-brand text-slate-900 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-brand/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canManageUsers ? "Add New Employee" : "Permission Denied"}
          >
            <UserPlus size={18} />
          </button>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white dark:bg-darkCard rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Asset</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Unit</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="loading">
                    <td colSpan={3} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin w-10 h-10 text-brand" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Matrix...</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : staffList.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="empty">
                    <td colSpan={3} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Info className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No entries found in this sector</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())).map((staff, idx) => (
                  <motion.tr 
                    key={staff.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border transition-all ${
                          staff.registrationType === 'NEW' 
                          ? 'bg-slate-100 dark:bg-slate-800 text-brand border-slate-200 dark:border-slate-700' 
                          : 'bg-slate-200 dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-800'
                        }`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-black text-slate-900 dark:text-white leading-none text-base flex items-center gap-2">
                              {staff.name}
                              {staff.isSuperAdmin && <ShieldCheck size={14} className="text-brand" />}
                            </p>
                            {viewType === 'ALL' && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${
                                staff.registrationType === 'NEW' 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}>
                                {staff.registrationType === 'NEW' ? 'CURRENT' : 'PAST'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-1.5 flex items-center gap-1.5 tracking-tight uppercase">
                            <Mail size={10} className="text-slate-400" /> {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-brand" />
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {getDesignationLabel(staff.designation)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{staff.departmentName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {staff.registrationType === 'NEW' ? (
                          <>
                            <button 
                              onClick={() => handleArchive(staff.id)} 
                              disabled={!canManageUsers}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-500 hover:border-orange-500 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed" 
                              title={canManageUsers ? "Move to Past Records" : "Permission Denied"}
                            >
                              <Archive size={16} />
                            </button>
                            <button 
                              onClick={() => onManagePermissions(staff)} 
                              disabled={!canManageUsers}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand hover:border-brand rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed" 
                              title={canManageUsers ? "Configure Protocols" : "Permission Denied"}
                            >
                              <Key size={16} />
                            </button>
                            <button 
                              onClick={() => onEdit(staff)} 
                              disabled={!canManageUsers}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed" 
                              title={canManageUsers ? "Modify Details" : "Permission Denied"}
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleRestore(staff.id)} 
                              disabled={!canManageUsers}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-green-500 hover:border-green-500 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed" 
                              title={canManageUsers ? "Restore to Current" : "Permission Denied"}
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button 
                              onClick={() => handlePermanentDelete(staff.id)} 
                              disabled={!canManageUsers}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed" 
                              title={canManageUsers ? "Permanent Erase" : "Permission Denied"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
