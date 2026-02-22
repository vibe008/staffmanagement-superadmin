// components/TaskForm.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Loader2, AlertCircle, Building2, User, Layers, Shield, 
  Calendar, AlignLeft, Type, Flag, Ticket, Users, Briefcase 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Department, TaskPriority, Ticket as TicketType, Designation } from '../types';
import { createTask, updateTask, convertTicketToTask, CreateTaskPayload } from '../services/taskService';
import { fetchAllStaff } from '../services/staffService';
import { fetchAllDepartments } from '../services/departmentService';
import { Input, Select } from './UI';

interface TaskFormProps {
  departments?: Department[];
  editingTask?: any;
  sourceTicket?: TicketType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  departments: propDepartments = [], 
  editingTask, 
  sourceTicket, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [localDepartments, setLocalDepartments] = useState<Department[]>([]);
  const [assignmentType, setAssignmentType] = useState<'STAFF' | 'DEPARTMENT' | 'SUBDEPARTMENT' | 'DESIGNATION' | 'ROLE'>('STAFF');
  
  // For designation selection
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  
  // Filter states for staff selection
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('');
  const [selectedSubDepartmentFilter, setSelectedSubDepartmentFilter] = useState<string>('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');

  // Use either prop departments or local departments
  const departments = propDepartments.length > 0 ? propDepartments : localDepartments;

  const [formData, setFormData] = useState({
    title: editingTask?.title || (sourceTicket ? `Task for Ticket #${sourceTicket.ticketNumber || sourceTicket.id.slice(0, 8)}: ${sourceTicket.subject}` : ''),
    description: editingTask?.description || sourceTicket?.description || '',
    priority: editingTask?.priority || (sourceTicket?.priority?.toUpperCase() as TaskPriority) || TaskPriority.MEDIUM,
    startDate: editingTask?.startDate ? new Date(editingTask.startDate).toISOString().split('T')[0] : '',
    dueDate: editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '',
    assignedToId: editingTask?.assignedToId || '',
    assignedToDepartmentId: editingTask?.assignedToDepartmentId || '',
    assignedToSubDepartmentId: editingTask?.assignedToSubDepartmentId || '',
    assignedToDesignationId: editingTask?.assignedToDesignationId || '',
    assignedToRole: editingTask?.assignedToRole || ''
  });

  // Load departments if not provided via props
  useEffect(() => {
    if (propDepartments.length === 0) {
      loadDepartments();
    }
  }, []);

  // Load all staff initially
  useEffect(() => {
    loadStaff();
  }, []);

  // Log for debugging
  useEffect(() => {
    console.log('TaskForm - Departments:', departments.length);
    console.log('TaskForm - Source Ticket:', sourceTicket ? 'Yes' : 'No');
    console.log('TaskForm - Assignment Type:', assignmentType);
  }, [departments, sourceTicket, assignmentType]);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const depts = await fetchAllDepartments();
      setLocalDepartments(depts);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadStaff = async () => {
    try {
      const staff = await fetchAllStaff();
      setStaffList(staff);
      setFilteredStaff(staff);
    } catch (err) {
      console.error(err);
    }
  };

  // Load designations when sub-department is selected
  useEffect(() => {
    const loadDesignationsForSubDepartment = async () => {
      if (!formData.assignedToSubDepartmentId) {
        setDesignations([]);
        return;
      }

      setLoadingDesignations(true);
      try {
        // First try to find in local departments data
        let foundDesignations: Designation[] = [];
        
        if (departments.length > 0) {
          for (const dept of departments) {
            const subDept = dept.subDepartments?.find(sd => sd.id === formData.assignedToSubDepartmentId);
            if (subDept?.designations) {
              foundDesignations = subDept.designations;
              break;
            }
          }
        }

        if (foundDesignations.length > 0) {
          setDesignations(foundDesignations);
        }
      } catch (err) {
        console.error('Error loading designations:', err);
      } finally {
        setLoadingDesignations(false);
      }
    };

    loadDesignationsForSubDepartment();
  }, [formData.assignedToSubDepartmentId, departments]);

  // Filter staff based on selections for STAFF assignment type
  useEffect(() => {
    if (assignmentType === 'STAFF') {
      let filtered = [...staffList];
      
      if (selectedDepartmentFilter) {
        filtered = filtered.filter(s => s.departmentId === selectedDepartmentFilter);
      }
      
      if (selectedSubDepartmentFilter) {
        filtered = filtered.filter(s => s.subDepartmentId === selectedSubDepartmentFilter);
      }
      
      if (selectedDesignationFilter) {
        filtered = filtered.filter(s => s.designationId === selectedDesignationFilter);
      }
      
      if (selectedRoleFilter) {
        filtered = filtered.filter(s => s.role === selectedRoleFilter);
      }
      
      setFilteredStaff(filtered);
    }
  }, [selectedDepartmentFilter, selectedSubDepartmentFilter, selectedDesignationFilter, selectedRoleFilter, staffList, assignmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that at least one assignment is selected
    const hasAssignment = 
      formData.assignedToId ||
      formData.assignedToDepartmentId ||
      formData.assignedToSubDepartmentId ||
      formData.assignedToDesignationId ||
      formData.assignedToRole;

    if (!hasAssignment) {
      setError('Please select an assignment');
      setLoading(false);
      return;
    }

    const payload: CreateTaskPayload = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      startDate: formData.startDate || null,
      dueDate: formData.dueDate || null,
      assignedToId: assignmentType === 'STAFF' ? formData.assignedToId : null,
      assignedToDepartmentId: assignmentType === 'DEPARTMENT' ? formData.assignedToDepartmentId : null,
      assignedToSubDepartmentId: assignmentType === 'SUBDEPARTMENT' ? formData.assignedToSubDepartmentId : null,
      assignedToDesignationId: assignmentType === 'DESIGNATION' ? formData.assignedToDesignationId : null,
      assignedToRole: assignmentType === 'ROLE' ? formData.assignedToRole : null
    };

    try {
      let response;
      if (sourceTicket) {
        response = await convertTicketToTask(sourceTicket.id, payload);
        if (response.success) {
          toast.success('Ticket successfully converted to Task 🚀');
        }
      } else if (editingTask) {
        response = await updateTask(editingTask.id, payload);
        if (response.success) {
          toast.success('Task updated successfully');
        }
      } else {
        response = await createTask(payload);
        if (response.success) {
          toast.success('Task created successfully');
        }
      }

      if (!response.success) {
        throw new Error(response.message || 'Action failed');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Action failed');
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  // Safely get selected department with null check
  const selectedDept = departments?.find(d => d.id === formData.assignedToDepartmentId);
  const selectedSubDept = selectedDept?.subDepartments?.find(sd => sd.id === formData.assignedToSubDepartmentId);
  
  // Get unique roles from staff list
  const uniqueRoles = [...new Set(staffList.map(s => s.role).filter(Boolean))];

  // Handle filter reset functions
  const handleAllDepartment = () => {
    setSelectedDepartmentFilter('');
    setSelectedSubDepartmentFilter('');
    setSelectedDesignationFilter('');
  };

  const handleAllSubDepartment = () => {
    setSelectedSubDepartmentFilter('');
    setSelectedDesignationFilter('');
  };

  const handleAllDesignation = () => {
    setSelectedDesignationFilter('');
  };

  const handleAllRole = () => {
    setSelectedRoleFilter('');
  };

  // Get staff count for designation
  const getStaffCountForDesignation = (designationId: string) => {
    return staffList.filter(s => s.designationId === designationId).length;
  };

  // Check if departments are loaded
  const hasDepartments = departments && departments.length > 0;

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
                {sourceTicket ? 'Convert Ticket to Task' : editingTask ? 'Update Task' : 'Create New Task'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {sourceTicket ? `Converting Ticket #${sourceTicket.ticketNumber || sourceTicket.id.slice(0, 8)}` : 'Define task details and assignment'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingDepartments && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading departments...</span>
            </div>
          )}

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
              <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand">
                <AlignLeft className="w-5 h-5" />
              </div>
              <textarea 
                className="w-full min-h-[120px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all resize-none"
                placeholder="Specify task requirements and expected deliverables..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select 
              label="Priority Level" 
              icon={<Flag className="w-5 h-5"/>} 
              value={formData.priority} 
              onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
            >
              {(Object.values(TaskPriority) as string[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
            <Input 
              label="Start Date" 
              type="date" 
              icon={<Calendar className="w-5 h-5"/>} 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})} 
            />
            <Input 
              label="Deadline" 
              type="date" 
              icon={<Calendar className="w-5 h-5"/>} 
              value={formData.dueDate} 
              onChange={e => setFormData({...formData, dueDate: e.target.value})} 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Assignment Model</label>
            <div className="flex flex-wrap gap-2">
              {['STAFF', 'DEPARTMENT', 'SUBDEPARTMENT', 'DESIGNATION', 'ROLE'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setAssignmentType(type as any);
                    // Reset form data for assignment
                    setFormData({
                      ...formData,
                      assignedToId: '',
                      assignedToDepartmentId: '',
                      assignedToSubDepartmentId: '',
                      assignedToDesignationId: '',
                      assignedToRole: ''
                    });
                    // Reset filters
                    setSelectedDepartmentFilter('');
                    setSelectedSubDepartmentFilter('');
                    setSelectedDesignationFilter('');
                    setSelectedRoleFilter('');
                  }}
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
                <motion.div key="staff" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {/* Filter Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Filter Staff
                      </h4>
                      {(selectedDepartmentFilter || selectedSubDepartmentFilter || selectedDesignationFilter || selectedRoleFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDepartmentFilter('');
                            setSelectedSubDepartmentFilter('');
                            setSelectedDesignationFilter('');
                            setSelectedRoleFilter('');
                          }}
                          className="text-xs text-brand hover:text-brand/80 font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>

                    {/* Department Filter */}
                    {hasDepartments && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-500">Department</label>
                          {selectedDepartmentFilter && (
                            <button
                              type="button"
                              onClick={handleAllDepartment}
                              className="text-xs text-brand hover:text-brand/80"
                            >
                              All Departments
                            </button>
                          )}
                        </div>
                        <Select
                          icon={<Building2 className="w-4 h-4" />}
                          value={selectedDepartmentFilter}
                          onChange={(e) => {
                            setSelectedDepartmentFilter(e.target.value);
                            setSelectedSubDepartmentFilter('');
                            setSelectedDesignationFilter('');
                          }}
                        >
                          <option value="">Select department to filter...</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({staffList.filter(s => s.departmentId === d.id).length} staff)
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Sub-Department Filter */}
                    {selectedDepartmentFilter && hasDepartments && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-500">Sub-Department</label>
                          {selectedSubDepartmentFilter && (
                            <button
                              type="button"
                              onClick={handleAllSubDepartment}
                              className="text-xs text-brand hover:text-brand/80"
                            >
                              All Sub-Departments
                            </button>
                          )}
                        </div>
                        <Select
                          icon={<Layers className="w-4 h-4" />}
                          value={selectedSubDepartmentFilter}
                          onChange={(e) => {
                            setSelectedSubDepartmentFilter(e.target.value);
                            setSelectedDesignationFilter('');
                          }}
                        >
                          <option value="">Select sub-department to filter...</option>
                          {departments
                            .find(d => d.id === selectedDepartmentFilter)
                            ?.subDepartments?.map(sd => {
                              const staffCount = staffList.filter(
                                s => s.subDepartmentId === sd.id
                              ).length;
                              return (
                                <option key={sd.id} value={sd.id}>
                                  {sd.name} ({staffCount} staff)
                                </option>
                              );
                            })}
                        </Select>
                      </div>
                    )}

                    {/* Designation Filter */}
                    {selectedSubDepartmentFilter && hasDepartments && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-500">Designation</label>
                          {selectedDesignationFilter && (
                            <button
                              type="button"
                              onClick={handleAllDesignation}
                              className="text-xs text-brand hover:text-brand/80"
                            >
                              All Designations
                            </button>
                          )}
                        </div>
                        <Select
                          icon={<Briefcase className="w-4 h-4" />}
                          value={selectedDesignationFilter}
                          onChange={(e) => setSelectedDesignationFilter(e.target.value)}
                        >
                          <option value="">Select designation to filter...</option>
                          {departments
                            .find(d => d.id === selectedDepartmentFilter)
                            ?.subDepartments?.find(sd => sd.id === selectedSubDepartmentFilter)
                            ?.designations?.map(d => {
                              const staffCount = staffList.filter(s => s.designationId === d.id).length;
                              return (
                                <option key={d.id} value={d.id}>
                                  {d.title} ({staffCount} staff)
                                </option>
                              );
                            })}
                        </Select>
                      </div>
                    )}

                    {/* Role Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-500">Role</label>
                        {selectedRoleFilter && (
                          <button
                            type="button"
                            onClick={handleAllRole}
                            className="text-xs text-brand hover:text-brand/80"
                          >
                            All Roles
                          </button>
                        )}
                      </div>
                      <Select
                        icon={<Shield className="w-4 h-4" />}
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                      >
                        <option value="">Select role to filter...</option>
                        {uniqueRoles.map(role => {
                          const staffCount = staffList.filter(s => s.role === role).length;
                          return (
                            <option key={role} value={role}>
                              {role} ({staffCount} staff)
                            </option>
                          );
                        })}
                      </Select>
                    </div>

                    {/* Filter Summary */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                      Showing {filteredStaff.length} of {staffList.length} staff members
                    </div>
                  </div>

                  {/* Staff Selection */}
                  <Select 
                    label="Assign to Employee" 
                    icon={<User className="w-5 h-5"/>} 
                    value={formData.assignedToId} 
                    onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                  >
                    <option value="">Select individual...</option>
                    {filteredStaff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email}) - {s.role || 'No Role'}
                        {s.department?.name && ` - ${s.department.name}`}
                        {s.designation?.title && ` - ${s.designation.title}`}
                      </option>
                    ))}
                  </Select>
                  
                  {filteredStaff.length === 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      No staff members match the selected filters
                    </p>
                  )}
                </motion.div>
              )}

              {assignmentType === 'DEPARTMENT' && (
                <motion.div key="dept" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                  <Select 
                    label="Assign to Department" 
                    icon={<Building2 className="w-5 h-5"/>} 
                    value={formData.assignedToDepartmentId} 
                    onChange={e => setFormData({...formData, assignedToDepartmentId: e.target.value})}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => {
                      const staffCount = staffList.filter(s => s.departmentId === d.id).length;
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} ({staffCount} staff members)
                        </option>
                      );
                    })}
                  </Select>
                  
                  {formData.assignedToDepartmentId && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Note:</span> This task will be visible to all {staffList.filter(s => s.departmentId === formData.assignedToDepartmentId).length} staff members in this department.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {assignmentType === 'SUBDEPARTMENT' && (
                <motion.div key="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <Select 
                    label="Department" 
                    icon={<Building2 className="w-5 h-5"/>} 
                    value={formData.assignedToDepartmentId} 
                    onChange={e => {
                      setFormData({
                        ...formData, 
                        assignedToDepartmentId: e.target.value, 
                        assignedToSubDepartmentId: ''
                      });
                    }}
                  >
                    <option value="">Select department first...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                  
                  {formData.assignedToDepartmentId && hasDepartments && (
                    <>
                      <Select 
                        label="Sub-Department" 
                        icon={<Layers className="w-5 h-5"/>} 
                        value={formData.assignedToSubDepartmentId} 
                        onChange={e => setFormData({...formData, assignedToSubDepartmentId: e.target.value})}
                      >
                        <option value="">Select specialized unit...</option>
                        {selectedDept?.subDepartments?.map(s => {
                          const staffCount = staffList.filter(staff => staff.subDepartmentId === s.id).length;
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} ({staffCount} staff)
                            </option>
                          );
                        })}
                      </Select>

                      {formData.assignedToSubDepartmentId && (
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Note:</span> This task will be visible to all {staffList.filter(s => s.subDepartmentId === formData.assignedToSubDepartmentId).length} staff members in this sub-department.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {assignmentType === 'DESIGNATION' && (
                <motion.div key="designation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <Select 
                    label="Department" 
                    icon={<Building2 className="w-5 h-5"/>} 
                    value={formData.assignedToDepartmentId} 
                    onChange={e => {
                      setFormData({
                        ...formData, 
                        assignedToDepartmentId: e.target.value, 
                        assignedToSubDepartmentId: '',
                        assignedToDesignationId: ''
                      });
                    }}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>

                  {formData.assignedToDepartmentId && hasDepartments && (
                    <Select 
                      label="Sub-Department" 
                      icon={<Layers className="w-5 h-5"/>} 
                      value={formData.assignedToSubDepartmentId} 
                      onChange={e => {
                        setFormData({
                          ...formData, 
                          assignedToSubDepartmentId: e.target.value,
                          assignedToDesignationId: ''
                        });
                      }}
                    >
                      <option value="">Select sub-department...</option>
                      {selectedDept?.subDepartments?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  )}

                  {formData.assignedToSubDepartmentId && (
                    <Select 
                      label="Designation" 
                      icon={<Briefcase className="w-5 h-5"/>} 
                      value={formData.assignedToDesignationId} 
                      onChange={e => setFormData({...formData, assignedToDesignationId: e.target.value})}
                    >
                      <option value="">Select designation...</option>
                      {loadingDesignations ? (
                        <option disabled>Loading designations...</option>
                      ) : designations.length > 0 ? (
                        designations.map(d => {
                          const staffCount = getStaffCountForDesignation(d.id);
                          return (
                            <option key={d.id} value={d.id}>
                              {d.title} ({staffCount} staff)
                            </option>
                          );
                        })
                      ) : (
                        <option disabled>No designations available</option>
                      )}
                    </Select>
                  )}

                  {formData.assignedToDesignationId && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Note:</span> This task will be visible to all {getStaffCountForDesignation(formData.assignedToDesignationId)} staff members with this designation.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {assignmentType === 'ROLE' && (
                <motion.div key="role" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                  <Select 
                    label="Assign to Global Role" 
                    icon={<Shield className="w-5 h-5"/>} 
                    value={formData.assignedToRole} 
                    onChange={e => setFormData({...formData, assignedToRole: e.target.value})}
                  >
                    <option value="">Select role tier...</option>
                    {uniqueRoles.map(role => {
                      const staffCount = staffList.filter(s => s.role === role).length;
                      return (
                        <option key={role} value={role}>
                          {role} ({staffCount} staff members)
                        </option>
                      );
                    })}
                  </Select>
                  
                  {formData.assignedToRole && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Note:</span> This task will be visible to all {staffList.filter(s => s.role === formData.assignedToRole).length} staff members with the {formData.assignedToRole} role.
                      </p>
                    </div>
                  )}
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
              disabled={loading || loadingDepartments}
              className="flex-[2] bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <>
                  {sourceTicket ? <Ticket className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                  {sourceTicket ? 'Convert to Task' : editingTask ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};