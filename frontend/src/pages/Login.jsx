import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice';
import { Lock, User, Eye, EyeOff, Package, BarChart3, ShieldCheck, Wifi } from 'lucide-react';
import { api } from '../services/api';

const STATS = [
  { icon: Package, value: 'Real-time', label: 'Inventory sync' },
  { icon: BarChart3, value: 'Live', label: 'Sales analytics' },
  { icon: ShieldCheck, value: 'Secure', label: 'Role-based access' },
  { icon: Wifi, value: 'RFID', label: 'LLRP integration' },
];

const Login = () => {
  const dispatch = useDispatch();
  const [showPw, setShowPw] = useState(false);

  const formik = useFormik({
    initialValues: { email: 'admin', password: 'Admin@123' },
    validationSchema: Yup.object({
      email: Yup.string().required('Username required'),
      password: Yup.string().required('Password required'),
    }),
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(null);
      try {
        const res = await api.login({ username: values.email, password: values.password });
        dispatch(login({ user: res.user, token: res.token }));
      } catch (err) {
        setStatus(err.message || 'Invalid credentials');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: '#0d1117' }}>
      {/* LEFT PANEL — dark slate with teal accents */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Subtle dot grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(13,148,136,0.15) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Teal glow top-left */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 65%)' }} />
        {/* Subtle glow bottom-right */}
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex h-full flex-col px-12 py-10">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-[11px] font-black" style={{ background: '#0d9488', boxShadow: '0 4px 12px rgba(13,148,136,0.4)' }}>
              PS
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">Pushpendra Store</p>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Enterprise Retail ERP</p>
            </div>
          </div>

          {/* Main content */}
          <div className="my-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#2dd4bf' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2dd4bf' }}>System Online</span>
            </div>

            <h1 className="text-[40px] font-black leading-[1.1] tracking-tight text-white mb-4">
              Smart Retail<br />
              <span style={{ color: '#2dd4bf' }}>Management.</span>
            </h1>
            <p className="text-[13px] leading-relaxed max-w-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Unified platform for inventory, billing, and real-time RFID-powered store operations.
            </p>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-2.5 mb-10">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(13,148,136,0.15)' }}>
                  <Icon size={13} style={{ color: '#2dd4bf' }} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white leading-tight">{value}</p>
                  <p className="text-[10px] font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.18)' }}>
            &copy; {new Date().getFullYear()} Wayin Fotech Solutions. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — clean white form */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 sm:px-12 lg:px-14">
        <div className="w-full max-w-[340px]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-[10px] font-black" style={{ background: '#0d9488' }}>
              PS
            </div>
            <span className="text-sm font-bold text-gray-900">Pushpendra Store</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight">Welcome back</h2>
            <p className="mt-1.5 text-[12px] text-gray-400 font-medium">Sign in to your store account</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="email">
                Username
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  id="email"
                  type="text"
                  {...formik.getFieldProps('email')}
                  className="w-full rounded-xl border py-2.5 pl-9 pr-3.5 text-[13px] font-medium text-gray-900 placeholder:text-gray-300 outline-none transition-all"
                  style={{ borderColor: formik.touched.email && formik.errors.email ? '#ef4444' : '#e2e8f0', background: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0d9488'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; formik.handleBlur(e); }}
                  placeholder="e.g. admin"
                  autoComplete="username"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  {...formik.getFieldProps('password')}
                  className="w-full rounded-xl border py-2.5 pl-9 pr-10 text-[13px] font-medium text-gray-900 placeholder:text-gray-300 outline-none transition-all"
                  style={{ borderColor: formik.touched.password && formik.errors.password ? '#ef4444' : '#e2e8f0', background: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0d9488'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; formik.handleBlur(e); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{formik.errors.password}</p>
              )}
            </div>

            {/* Error */}
            {formik.status && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
                {formik.status}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="mt-1 w-full rounded-xl py-2.5 text-[13px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#0d9488', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
              onMouseEnter={(e) => { if (!formik.isSubmitting) e.currentTarget.style.background = '#0f766e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0d9488'; }}
            >
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Secured</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-300 font-medium">
            Powered by{' '}
            <span className="font-bold" style={{ color: '#0d9488' }}>Wayin Fotech Solutions</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
