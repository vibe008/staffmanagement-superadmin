
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${icon ? 'pl-10' : ''} ${className}`}
      />
    </div>
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, icon, children, className, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors z-10 pointer-events-none">
          {icon}
        </div>
      )}
      <select
        {...props}
        className={`w-full appearance-none bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${icon ? 'pl-10' : ''} ${className}`}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);
