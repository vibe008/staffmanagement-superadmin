import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle2, Wallet, LayoutDashboard, ShieldCheck, TrendingUp, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Staff', value: '1,284', change: '+12.5%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Revenue Flow', value: '$45,210', change: '+8.2%', icon: Wallet, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Task Velocity', value: '24', change: '5 due today', icon: Clock, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'System Health', value: '99.9%', change: 'Stable', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bg} rounded-2xl transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider text-slate-500">
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{stat.label}</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-brand" />
              Operational Efficiency
            </h3>
            <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + (i * 0.05), duration: 1, ease: "easeOut" }}
                className="flex-1 bg-brand/20 dark:bg-brand/10 rounded-t-lg relative group"
              >
                <div className="absolute inset-x-0 bottom-0 bg-brand rounded-t-lg transition-all h-1/3 group-hover:h-full opacity-50" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2">Critical Alerts</h3>
            <p className="text-slate-400 text-sm mb-6">Security status is currently stable with minor observations.</p>
            
            <div className="space-y-4">
              {[
                { label: 'Unusual Login', time: '2m ago', icon: AlertTriangle, color: 'text-orange-400' },
                { label: 'Backup Completed', time: '1h ago', icon: CheckCircle2, color: 'text-green-400' },
                { label: 'New Policy Applied', time: '3h ago', icon: ShieldCheck, color: 'text-brand' },
              ].map((alert, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                  <alert.icon className={`w-5 h-5 ${alert.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{alert.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-[60px]" />
        </motion.div>
      </div>
    </div>
  );
};