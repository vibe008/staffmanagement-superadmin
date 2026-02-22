
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Save, Loader2, User, Mail, Phone, Briefcase, 
  MapPin, Plus, Trash2, Camera, UploadCloud,
  History, Banknote, Heart, Car, Calendar, Users, Check, X, ShieldCheck, Lock, Shield,
  Landmark, CreditCard, Layers, Building2, Fingerprint, AlertCircle, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Department, Staff, Role, WorkExperience, Address, Designation } from '../types';
import { Input, Select } from './UI';
import { setupStaffAuth, fetchStaffById } from '../services/staffService';
import { fetchHierarchy } from '../services/departmentService';
import { superadminurl } from '@/services/api';

interface StaffFormProps {
  departments: Department[];
  staffId: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({ departments: initialDepartments, staffId, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [showAuthSetup, setShowAuthSetup] = useState(false);
  const [newStaffId, setNewStaffId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!staffId);
  
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    adharNumber: '',
    designationId: '',
    departmentId: '',
    subDepartmentId: '',
    dateOfBirth: '',
    bloodGroup: '',
    healthIssue: false,
    healthIssueDescription: '',
    maritalStatus: 'SINGLE',
    haveVehicle: false,
    vehicleNumber: '',
    fatherName: '',
    motherName: '',
    formNumber: '', 
    registrationDate: new Date().toISOString().split('T')[0],
    currentAddress: { pincode: '', state: '', district: '', fullAddress: '', country: 'India' } as Address,
    permanentAddress: { pincode: '', state: '', district: '', fullAddress: '', country: 'India' } as Address,
    bankDetails: { accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', branchName: '' }
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const hierarchyRes = await fetchHierarchy();
        if (hierarchyRes.success) setDepartments(hierarchyRes.data);

        if (staffId) {
          const staff = await fetchStaffById(staffId);
          setIsEditMode(true);
          const bank: any = staff.bankDetails || {};
          
          setFormData({
            name: staff.name || '',
            email: staff.email || '',
            mobileNumber: staff.mobileNumber || '',
            adharNumber: staff.adharNumber || '',
            designationId: staff.designationId || '',
            departmentId: staff.departmentId || '',
            subDepartmentId: staff.subDepartmentId || '',
            dateOfBirth: staff.dateOfBirth ? String(staff.dateOfBirth).split('T')[0] : '',
            bloodGroup: staff.bloodGroup || '',
            healthIssue: staff.healthIssue || false,
            healthIssueDescription: staff.healthIssueDescription || '',
            maritalStatus: staff.maritalStatus || 'SINGLE',
            haveVehicle: !!staff.vehicleNumber,
            vehicleNumber: staff.vehicleNumber || '',
            fatherName: staff.fatherName || '',
            motherName: staff.motherName || '',
            formNumber: staff.formNumber || '',
            registrationDate: staff.registrationDate ? String(staff.registrationDate).split('T')[0] : '',
            currentAddress: staff.addresses?.find(a => a.type === 'CURRENT') || { pincode: '', state: '', district: '', fullAddress: '', country: 'India' },
            permanentAddress: staff.addresses?.find(a => a.type === 'PERMANENT') || { pincode: '', state: '', district: '', fullAddress: '', country: 'India' },
            bankDetails: {
              accountHolderName: bank.accountHolderName || '',
              accountNumber: bank.accountNumber || '',
              bankName: bank.bankName || '',
              ifscCode: bank.ifscCode || '',
              branchName: bank.branchName || ''
            }
          });
          
          setExperiences(staff.experiences?.map(e => ({
            ...e,
            startDate: e.startDate ? String(e.startDate).split('T')[0] : '',
            endDate: e.endDate ? String(e.endDate).split('T')[0] : ''
          })) || []);

          if (staff.documents) {
            const docPreviews: Record<string, string> = {};
            if (staff.documents.adharFront) docPreviews.adharFront = staff.documents.adharFront;
            if (staff.documents.adharBack) docPreviews.adharBack = staff.documents.adharBack;
            if (staff.documents.photo) docPreviews.photo = staff.documents.photo;
            if (staff.documents.signature) docPreviews.signature = staff.documents.signature;
            if (staff.documents.experienceLetter) docPreviews.experienceLetter = staff.documents.experienceLetter;
            if (staff.documents.bankStatement) docPreviews.bankStatement = staff.documents.bankStatement;
            setPreviews(docPreviews);
          }
        }
      } catch (err) {
        toast.error('Sync failed: hierarchy unreachable');
        if (staffId) onBack();
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [staffId]);

  useEffect(() => {
    if (sameAsCurrent) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: { ...prev.currentAddress }
      }));
    }
  }, [sameAsCurrent, formData.currentAddress]);

  const fetchAddressByPincode = async (pincode: string, type: 'current' | 'permanent') => {
    if (pincode.length !== 6) return;
    
    try {
      const res = await fetch(`https://cdevops.mysmartpg.com/api/getAddressDetailByPincode?pincode=${pincode}`);
      const result = await res.json();
      
      if (result.status && result.data) {
        const { state, district, country } = result.data;
        setFormData(prev => ({
          ...prev,
          [type === 'current' ? 'currentAddress' : 'permanentAddress']: {
            ...prev[type === 'current' ? 'currentAddress' : 'permanentAddress'],
            state: state || prev[type === 'current' ? 'currentAddress' : 'permanentAddress'].state,
            district: district || prev[type === 'current' ? 'currentAddress' : 'permanentAddress'].district,
            country: country || prev[type === 'current' ? 'currentAddress' : 'permanentAddress'].country,
          }
        }));
        // toast.success(`Location resolved for ${pincode}`, { icon: <Sparkles className="text-brand" size={16}/> });
      }
    } catch (error) {
      console.warn('Pincode lookup service unavailable');
    }
  };

  const selectedDept = departments.find(d => d.id === formData.departmentId);
  const selectedSub = selectedDept?.subDepartments.find(s => s.id === formData.subDepartmentId);

  const sanitizeInput = (val: string) => val.replace(/[%$*+@#]/g, '');

  const handleInputChange = (field: string, value: any) => {
    if (typeof value === 'string' && ['name', 'fatherName', 'motherName', 'healthIssueDescription'].includes(field)) {
      value = sanitizeInput(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type: 'current' | 'permanent', field: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setFormData(prev => ({
      ...prev,
      [type === 'current' ? 'currentAddress' : 'permanentAddress']: {
        ...prev[type === 'current' ? 'currentAddress' : 'permanentAddress'],
        [field]: sanitized
      }
    }));

    if (field === 'pincode' && sanitized.length === 6) {
      fetchAddressByPincode(sanitized, type);
    }
  };

  const handleBankChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: sanitizeInput(value) }
    }));
  };

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [field]: file }));
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [field]: url }));
    }
  };

  const removeFile = (field: string) => {
    setSelectedFiles(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setPreviews(prev => {
      const next = { ...prev };
      if (next[field] && !next[field].startsWith('http')) URL.revokeObjectURL(next[field]);
      delete next[field];
      return next;
    });
  };

  const handleAddExperience = () => {
    if (experiences.length >= 5) return toast.warning('Maximum 5 experiences allowed');
    setExperiences([...experiences, { companyName: '', designation: '', contactNumber: '', startDate: '', endDate: '' }]);
  };

  const removeExperience = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));

  const updateExperience = (idx: number, field: keyof WorkExperience, value: string) => {
    const next = [...experiences];
    next[idx] = { ...next[idx], [field]: sanitizeInput(value) };
    setExperiences(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.adharNumber && formData.adharNumber.length !== 12) {
      setLoading(false);
      return toast.error('Aadhaar number must be exactly 12 digits');
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (['currentAddress', 'permanentAddress', 'bankDetails'].includes(key)) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, (value ?? '').toString());
      }
    });
    data.append('workExperiences', JSON.stringify(experiences));

    Object.entries(selectedFiles).forEach(([key, file]) => {
      if (file) {
        data.append(key, file as Blob);
      }
    });

    try {
      const url = isEditMode ? `${superadminurl}/api/staff/${staffId}` : `${superadminurl}/api/staff`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Submission failure');
      
      if (!isEditMode) {
        setNewStaffId(result.staff.id);
        setShowAuthSetup(true);
      } else {
        toast.success('Resource synchronized');
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Critical system failure');
    } finally {
      setLoading(false);
    }
  };

  const documentKeys = ['adharFront', 'adharBack', 'signature', 'photo', 'experienceLetter', 'bankStatement'];

  if (fetching) return <div className="h-[60vh] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-brand w-12 h-12" /><p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Loading Org protocols...</p></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-3 bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-slate-800 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <ChevronLeft size={20} /> Directory Interface
        </button>
        <h2 className="text-2xl font-black">{isEditMode ? 'Modify Operational Resource' : 'Enroll New Strategic Member'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* 1. Personal Details */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="p-3 bg-brand/10 text-brand rounded-2xl"><User size={22} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input label="Full Name *" icon={<User size={18}/>} value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
            <Input label="Email Address *" type="email" icon={<Mail size={18}/>} value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required />
            <Input label="Mobile Number *" icon={<Phone size={18}/>} value={formData.mobileNumber} onChange={e => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))} required />
            <Input label="Date Of Birth *" type="date" icon={<Calendar size={18}/>} value={formData.dateOfBirth} onChange={e => handleInputChange('dateOfBirth', e.target.value)} required />
            <Input label="Aadhaar No *" icon={<Fingerprint size={18}/>} value={formData.adharNumber} onChange={e => handleInputChange('adharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12 digit identifier" required />
            <Select label="Blood Group *" value={formData.bloodGroup} onChange={e => handleInputChange('bloodGroup', e.target.value)} required>
              <option value="">Select Blood Group...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </Select>
            <Select label="Any Health Issue? *" value={formData.healthIssue ? 'true' : 'false'} onChange={e => handleInputChange('healthIssue', e.target.value === 'true')}>
              <option value="false">None</option>
              <option value="true">Yes (Specify below)</option>
            </Select>
            {formData.healthIssue && (
              <Input label="Health Issue Description" value={formData.healthIssueDescription} onChange={e => handleInputChange('healthIssueDescription', e.target.value)} />
            )}
            <Select label="Marital Status *" value={formData.maritalStatus} onChange={e => handleInputChange('maritalStatus', e.target.value)}>
              <option value="SINGLE">SINGLE</option>
              <option value="MARRIED">MARRIED</option>
              <option value="DIVORCED">DIVORCED</option>
            </Select>
            <Input label="Vehicle Number" icon={<Car size={18}/>} value={formData.vehicleNumber} onChange={e => handleInputChange('vehicleNumber', e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" />
            <Input label="Father Name *" icon={<Users size={18}/>} value={formData.fatherName} onChange={e => handleInputChange('fatherName', e.target.value)} required />
            <Input label="Mother Name *" icon={<Users size={18}/>} value={formData.motherName} onChange={e => handleInputChange('motherName', e.target.value)} required />
          </div>
        </section>

        {/* 2. Address Details */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><MapPin size={22} /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Address Details</h3>
            </div>
            <button 
              type="button" 
              onClick={() => setSameAsCurrent(!sameAsCurrent)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all group border border-slate-200 dark:border-slate-700"
            >
              {sameAsCurrent ? <ToggleRight className="text-brand" size={26} /> : <ToggleLeft className="text-slate-400" size={26} />}
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current address is same as permanent?</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand" /> Current Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Pincode *" value={formData.currentAddress.pincode} onChange={e => handleAddressChange('current', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                <Input label="Country *" value={formData.currentAddress.country} onChange={e => handleAddressChange('current', 'country', e.target.value)} required />
                <Input label="State *" value={formData.currentAddress.state} onChange={e => handleAddressChange('current', 'state', e.target.value)} required />
                <Input label="District *" value={formData.currentAddress.district} onChange={e => handleAddressChange('current', 'district', e.target.value)} required />
              </div>
              <div className="space-y-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Address *</label>
                <textarea className="w-full min-h-[100px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand transition-all resize-none" value={formData.currentAddress.fullAddress} onChange={e => handleAddressChange('current', 'fullAddress', e.target.value)} required />
              </div>
            </div>
            <div className={`space-y-6 transition-opacity ${sameAsCurrent ? 'opacity-50 pointer-events-none' : ''}`}>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Permanent Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Pincode *" value={formData.permanentAddress.pincode} onChange={e => handleAddressChange('permanent', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                <Input label="Country *" value={formData.permanentAddress.country} onChange={e => handleAddressChange('permanent', 'country', e.target.value)} required />
                <Input label="State *" value={formData.permanentAddress.state} onChange={e => handleAddressChange('permanent', 'state', e.target.value)} required />
                <Input label="District *" value={formData.permanentAddress.district} onChange={e => handleAddressChange('permanent', 'district', e.target.value)} required />
              </div>
              <div className="space-y-1.5 w-full">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Address *</label>
                <textarea className="w-full min-h-[100px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand transition-all resize-none" value={formData.permanentAddress.fullAddress} onChange={e => handleAddressChange('permanent', 'fullAddress', e.target.value)} required />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Work Experience Details */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><History size={22} /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Work Experience Details</h3>
            </div>
            <button type="button" onClick={handleAddExperience} className="px-6 py-2.5 bg-slate-900 dark:bg-brand text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={16} /> Add History ({experiences.length}/5)
            </button>
          </div>
          <div className="space-y-6">
            <AnimatePresence>
              {experiences.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No professional history added</p>
                </div>
              ) : experiences.map((exp, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group">
                  <button type="button" onClick={() => removeExperience(idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input label="Company Name" value={exp.companyName} onChange={e => updateExperience(idx, 'companyName', e.target.value)} />
                    <Input label="Contact No" value={exp.contactNumber} onChange={e => updateExperience(idx, 'contactNumber', e.target.value.replace(/\D/g, ''))} />
                    <Input label="Designation" value={exp.designation} onChange={e => updateExperience(idx, 'designation', e.target.value)} />
                    <Input label="Start Date" type="date" value={exp.startDate} onChange={e => updateExperience(idx, 'startDate', e.target.value)} />
                    <Input label="End Date" type="date" value={exp.endDate} onChange={e => updateExperience(idx, 'endDate', e.target.value)} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* 4. Bank Details */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><Banknote size={22} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Bank Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Bank Name *" icon={<Landmark size={18}/>} value={formData.bankDetails.bankName} onChange={e => handleBankChange('bankName', e.target.value)} required />
            <Input label="Account Holder Name *" icon={<User size={18}/>} value={formData.bankDetails.accountHolderName} onChange={e => handleBankChange('accountHolderName', e.target.value)} required />
            <Input label="IFSC Code *" icon={<Shield size={18}/>} value={formData.bankDetails.ifscCode} onChange={e => handleBankChange('ifscCode', e.target.value.toUpperCase())} required />
            <Input label="Bank Account No *" icon={<CreditCard size={18}/>} value={formData.bankDetails.accountNumber} onChange={e => handleBankChange('accountNumber', e.target.value.replace(/\D/g, ''))} required />
          </div>
        </section>

        {/* 5. Upload Documents */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl"><UploadCloud size={22} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Upload Documents</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {documentKeys.map(key => (
              <div key={key} className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center truncate">{key.replace(/([A-Z])/g, ' $1')}</label>
                <div className="relative group overflow-hidden bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 aspect-square flex flex-col items-center justify-center transition-all hover:border-brand shadow-sm">
                  {previews[key] ? (
                    <>
                      <img src={previews[key]} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <label className="p-2 bg-white text-slate-900 rounded-lg text-[8px] font-black uppercase cursor-pointer">
                          Replace
                          <input type="file" onChange={(e) => handleFileChange(key, e)} className="hidden" />
                        </label>
                        <button type="button" onClick={() => removeFile(key)} className="p-2 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase">Remove</button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <Camera className="w-6 h-6 text-slate-300 group-hover:text-brand transition-colors mb-2" />
                      <span className="text-[8px] font-black text-slate-400 group-hover:text-brand uppercase">Attach</span>
                      <input type="file" onChange={(e) => handleFileChange(key, e)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Designation Details */}
        <section className="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl"><Shield size={22} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Designation Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Select label="Department *" value={formData.departmentId} onChange={e => handleInputChange('departmentId', e.target.value)} required icon={<Building2 size={18}/>}>
              <option value="">Select Department...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Sub-Department *" value={formData.subDepartmentId} onChange={e => handleInputChange('subDepartmentId', e.target.value)} disabled={!formData.departmentId} required icon={<Layers size={18}/>}>
              <option value="">Select Sub-Unit...</option>
              {selectedDept?.subDepartments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Designation *" value={formData.designationId} onChange={e => handleInputChange('designationId', e.target.value)} disabled={!formData.subDepartmentId} required icon={<Shield size={18}/>}>
              <option value="">Select Role Title...</option>
              {selectedSub?.designations?.map(des => <option key={des.id} value={des.id}>{des.title}</option>)}
            </Select>
          </div>
        </section>

        <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-brand text-white dark:text-slate-900 py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={26} />}
          {isEditMode ? 'Commit Resource Changes' : 'Execute Asset Enrollment'}
        </button>
      </form>

      <AnimatePresence>
        {showAuthSetup && newStaffId && (
          <AuthSetupModal staffId={newStaffId} onComplete={() => { setShowAuthSetup(false); onSuccess(); }} onClose={() => { setShowAuthSetup(false); onSuccess(); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthSetupModal = ({ staffId, onComplete, onClose }: { staffId: string, onComplete: () => void, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STAFF');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setupStaffAuth(staffId, { password, role, permissions: [] });
      toast.success('Security Protocol Established');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Verification failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-darkCard w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand/40">
            <ShieldCheck className="w-12 h-12 text-slate-900" />
          </div>
          <h3 className="text-3xl font-black mb-2">Security Handshake</h3>
          <p className="text-slate-500 font-medium mb-8">Deploy operational clearance to activate asset.</p>
          <form onSubmit={handleSetup} className="space-y-6">
            <Input label="Operational Key" type="password" icon={<Lock size={18}/>} value={password} onChange={e => setPassword(e.target.value)} required />
            <Select label="Operational Tier" icon={<Shield size={18}/>} value={role} onChange={e => setRole(e.target.value as Role)} required>
               <option value="STAFF">STAFF</option>
               <option value="SUPPORT">SUPPORT</option>
               <option value="ADMIN">ADMIN</option>
               <option value="SUPERADMIN">SUPERADMIN</option>
            </Select>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Later</button>
              <button type="submit" disabled={loading} className="flex-[2] bg-brand text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <ShieldCheck size={18} />} Deploy
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
