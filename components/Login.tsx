
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Mail, Lock, Building2, Layers, ShieldCheck, ArrowRight, Loader2, AlertCircle, Shield, Fingerprint } from 'lucide-react';
import { toast } from 'react-toastify';
import { Department, SubDepartment } from '../types';
import { loginUser } from '../services/apiService';
import { Input, Select } from './UI';
import { ThemeToggle } from './ThemeToggle';

interface LoginProps {
  departments: Department[];
  onLoginSuccess: (user: any, token: string, chatToken?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ departments, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSubDeptId, setSelectedSubDeptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdminSelected = selectedDeptId === 'SUPERADMIN';

  const availableSubDepartments = useMemo((): SubDepartment[] => {
    if (isSuperAdminSelected) return [];
    const dept = departments.find(d => d.id === selectedDeptId);
    return dept ? (dept.subDepartments || []) : [];
  }, [departments, selectedDeptId, isSuperAdminSelected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const loginPayload: any = {
      email,
      password,
      role: isSuperAdminSelected ? 'SUPERADMIN' : 'STAFF', // Default to STAFF if not SuperAdmin
    };

    if (!isSuperAdminSelected) {
      loginPayload.departmentId = selectedDeptId;
      loginPayload.subDepartmentId = selectedSubDeptId;
    }

    try {
      const data = await loginUser(loginPayload);
      toast.success('Identity Verified');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, data.chatToken);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Access Denied');
      toast.error(err.message || 'Unauthorized Access');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants for staggered children
  // Fix: Explicitly type variants as Variants to resolve index signature and easing array type mismatches
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // Fix: Explicitly type variants as Variants and cast the cubic-bezier array to any to satisfy strict Framer Motion easing types
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] as any 
      } 
    },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#fcfcfd] dark:bg-[#0a0f1e] transition-colors duration-700 overflow-hidden">
      {/* Background Decorative Elements - Classic Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-brand/5 dark:bg-brand/10 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[140px]" 
        />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.99, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        // Fix: Cast easing array to any to avoid type check failure on custom cubic-bezier
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
        className="w-full max-w-[480px] bg-white/80 dark:bg-darkCard/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-500"
      >
        <div className="h-1.5 bg-brand w-full" />
        
        <div className="p-10 sm:p-14">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center mb-10 text-center"
          >
            <motion.div 
              variants={itemVariants}
              className="w-20 h-20 bg-slate-900 dark:bg-brand rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand/20 dark:shadow-brand/10"
            >
              <Fingerprint className="w-10 h-10 text-brand dark:text-slate-900" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Super <span className="text-brand">Admin</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-400 dark:text-slate-500 mt-2 font-black text-[10px] uppercase tracking-[0.4em]">Strategic Access Matrix</motion.p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30 mb-6"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                  <p className="font-black uppercase tracking-tight">{error}</p>
                </motion.div>
              )}
            {/* Fix: Corrected typo from AnPresence to AnimatePresence */}
            </AnimatePresence>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              <motion.div variants={itemVariants}>
                <Input 
                  label="Email Identifier" 
                  type="email" 
                  icon={<Mail className="w-4 h-4"/>} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                  required 
                />
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-5">
                <Select 
                  label="Department" 
                  icon={isSuperAdminSelected ? <Shield className="w-4 h-4 text-brand" /> : <Building2 className="w-4 h-4"/>} 
                  value={selectedDeptId} 
                  onChange={e => { setSelectedDeptId(e.target.value); setSelectedSubDeptId(''); }} 
                  className={`rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-all ${isSuperAdminSelected ? 'ring-2 ring-brand' : ''}`}
                  required
                >
                  <option value="">Select Primary Unit</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  <option value="SUPERADMIN" className="font-black text-brand">SYSTEM SUPERADMIN</option>
                </Select>

                <AnimatePresence>
                  {!isSuperAdminSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="overflow-hidden"
                    >
                      <Select 
                        label="SubDepartment" 
                        icon={<Layers className="w-4 h-4"/>} 
                        value={selectedSubDeptId} 
                        onChange={e => setSelectedSubDeptId(e.target.value)} 
                        disabled={!selectedDeptId}
                        className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 disabled:opacity-40"
                        required={!isSuperAdminSelected}
                      >
                        <option value="">Select Operational SubUnit</option>
                        {availableSubDepartments.map(s => (
                          <option key={s.id} value={s.id}>{s.name.replace(/_/g, ' ')}</option>
                        ))}
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Input 
                  label="Security Password" 
                  type="password" 
                  icon={<Lock className="w-4 h-4"/>} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                  required 
                />
              </motion.div>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              initial="hidden" 
              animate="visible"
              className="pt-4"
            >
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading} 
                className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-[0.2em] group ${
                  isSuperAdminSelected 
                  ? 'bg-slate-950 text-brand ring-1 ring-brand/50' 
                  : 'bg-slate-900 dark:bg-brand text-brand dark:text-slate-900'
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300"/>
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-600">
              Terminal Identity Verified • End-to-End Encryption
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
