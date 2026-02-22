
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ChevronLeft, Save, CheckCircle2, Loader2, AlertCircle, 
  Search, Key, Target, Lock, Eye, EyeOff, Tag, RefreshCw,
  CheckSquare, Square, MinusSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Staff, Role, PermissionGroupResponse, SystemPermission } from '../types';
import { getStaffAuth, setupStaffAuth, updateStaffAuth } from '../services/staffService';
import { fetchAllPermissions } from '../services/permissionService';
import { Input, Select } from './UI';

interface PermissionManagerProps {
  staff: Staff;
  onBack: () => void;
  onSave: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({ staff, onBack, onSave }) => {
  const [groupedPermissions, setGroupedPermissions] = useState<PermissionGroupResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>(staff.role || 'STAFF');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  
  const [authExists, setAuthExists] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [permsRes, authRes] = await Promise.all([
          fetchAllPermissions(),
          getStaffAuth(staff.id)
        ]);
        
        if (permsRes.success) setGroupedPermissions(permsRes.data);
        
        if (authRes.success && authRes.data) {
          const authData = authRes.data;
          // Backend returns permission objects, we need the IDs for the selection state
          const ids = (authData.permissions || []).map((p: SystemPermission) => p.id);
          setSelectedIds(ids);
          setCurrentRole(authData.role || 'STAFF');
          const setupComplete = authData.authStatus?.setupCompleted || false;
          setAuthExists(setupComplete);
        }
      } catch (err) {
        console.warn('Auth record not found or inaccessible, entering setup mode');
        setAuthExists(false);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [staff.id]);

  const togglePermission = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleGroup = (group: PermissionGroupResponse) => {
    const groupPermIds = group.permissions.map(p => p.id);
    const allSelected = groupPermIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all in group
      setSelectedIds(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      // Select all in group
      setSelectedIds(prev => {
        const newSelection = [...prev];
        groupPermIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const getGroupSelectionState = (group: PermissionGroupResponse) => {
    const groupPermIds = group.permissions.map(p => p.id);
    const selectedCount = groupPermIds.filter(id => selectedIds.includes(id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupPermIds.length) return 'all';
    return 'partial';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        password: password || undefined,
        role: currentRole,
        permissions: selectedIds, // Backend expects array of IDs
        isSuperAdmin: currentRole === 'SUPERADMIN'
      };

      if (!authExists) {
        if (!password) throw new Error("A secure password is required to initialize this account.");
        await setupStaffAuth(staff.id, {
          password,
          role: currentRole,
          permissions: selectedIds,
          isSuperAdmin: payload.isSuperAdmin
        });
        toast.success('Security Protocol Initialized');
      } else {
        await updateStaffAuth(staff.id, payload);
        toast.success('Operational Clearances Synchronized');
      }
      onSave();
    } catch (err: any) {
      toast.error(err.message || 'Credential sync failure');
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = groupedPermissions.map(group => ({
    ...group,
    permissions: group.permissions.filter(p => 
      p.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
      p.label.toLowerCase().includes(filterTerm.toLowerCase())
    )
  })).filter(group => group.permissions.length > 0);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand w-12 h-12" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-darkCard p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 px-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{staff.name}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{staff.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-2">
           <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
             <div className="px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
               <Shield size={12} /> {selectedIds.length} Permissions Active
             </div>
           </div>
           <button 
            onClick={handleSave} 
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
              authExists 
              ? 'bg-slate-900 dark:bg-brand text-brand dark:text-slate-900' 
              : 'bg-brand text-slate-900'
            }`}
          >
            {saving ? <Loader2 className="animate-spin w-3 h-3" /> : authExists ? <RefreshCw className="w-3 h-3" /> : <Shield size={14} />} 
            {authExists ? 'Sync Profile' : 'Init Security'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Auth Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 text-brand">
                <Target size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Auth Core</h3>
              </div>
              
              <div className="space-y-4">
                <Select 
                  label="Role Tier" 
                  value={currentRole} 
                  onChange={e => setCurrentRole(e.target.value as Role)}
                  className="bg-white/5 border-white/10 text-white rounded-xl text-xs h-11"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="TASK_ASSIGNER">TASK_ASSIGNER</option>
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </Select>

                <div className="relative">
                  <Input
                    label={authExists ? "Update Password" : "Password *"}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authExists ? "Change..." : "Required..."}
                    className="bg-white/5 border-white/10 text-white rounded-xl text-xs h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-slate-500 hover:text-brand"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Status</span>
                  {authExists ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  ) : (
                    <span className="text-orange-500 flex items-center gap-1">
                      <AlertCircle size={10} /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[60px]" />
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Summary</h4>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-500">Modules</span>
                 <span className="text-xs font-black text-slate-900 dark:text-white">{selectedIds.length}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-500">Group Coverage</span>
                 <span className="text-xs font-black text-slate-900 dark:text-white">
                   {groupedPermissions.filter(g => getGroupSelectionState(g) === 'all').length} / {groupedPermissions.length}
                 </span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Permissions Matrix */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-darkCard p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter by capability..." 
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border-none outline-none text-xs font-bold"
                  value={filterTerm}
                  onChange={e => setFilterTerm(e.target.value)}
                />
             </div>
             <button 
              onClick={() => setSelectedIds([])} 
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
             >
               Clear All
             </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredGroups.map(group => {
                const selectionState = getGroupSelectionState(group);
                return (
                  <motion.div 
                    key={group.group} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-darkCard rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                  >
                    {/* Compact Group Header */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleGroup(group)}
                          className={`p-1 transition-colors rounded ${selectionState !== 'none' ? 'text-brand' : 'text-slate-300 dark:text-slate-700'}`}
                        >
                          {selectionState === 'all' ? <CheckSquare size={18} /> : selectionState === 'partial' ? <MinusSquare size={18} /> : <Square size={18} />}
                        </button>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{group.group} Modules</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
                        {group.permissions.filter(p => selectedIds.includes(p.id)).length} / {group.permissions.length}
                      </span>
                    </div>

                    {/* Permissions Grid */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.permissions.map(p => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePermission(p.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all group ${
                              isSelected 
                                ? 'bg-brand/5 border-brand/30 text-slate-900 dark:text-white' 
                                : 'bg-transparent border-slate-100 dark:border-slate-800/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className={`p-1 rounded transition-colors ${isSelected ? 'text-brand' : 'text-slate-300 dark:text-slate-700'}`}>
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-slate-900 dark:text-white' : ''}`}>{p.label}</span>
                              <span className="text-[8px] font-mono text-slate-400 uppercase mt-0.5 truncate">{p.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredGroups.length === 0 && (
              <div className="py-20 text-center bg-white dark:bg-darkCard rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No capability matches found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
