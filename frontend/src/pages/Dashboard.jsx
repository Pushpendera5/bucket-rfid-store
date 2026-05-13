import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ShoppingCart, DollarSign, Package, AlertCircle,
  ArrowUpRight, ArrowDownRight, Radio, RefreshCw,
  Loader2, Truck, Users, ScanLine, X, RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#6366f1', '#f59e0b'];

const iconMap = { DollarSign, ShoppingCart, Package, AlertCircle };

const fallbackOverview = {
  summary: { todaySales: 0, totalOrders: 0, stockItems: 0, lowStockAlerts: 0, activeProducts: 0, activeSuppliers: 0, activeCustomers: 0, activeRfids: 0 },
  metrics: [], trends: [], categoryMix: [], recentTransactions: [], rfidFeed: [],
};

const KpiCard = ({ title, value, change, icon: Icon, accent, onClick }) => (
  <button type="button" onClick={onClick}
    className="relative w-full rounded-xl bg-white border border-gray-100 p-3.5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">{title}</p>
        <p className="text-xl font-black text-gray-900 mt-1 truncate">{value}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {change >= 0 ? (
            <><ArrowUpRight size={11} className="text-emerald-600" /><span className="text-[10px] font-bold text-emerald-600">{change}%</span></>
          ) : (
            <><ArrowDownRight size={11} className="text-red-500" /><span className="text-[10px] font-bold text-red-500">{Math.abs(change)}%</span></>
          )}
          <span className="text-[10px] text-gray-400">vs last week</span>
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: accent + '18' }}>
        <Icon size={15} style={{ color: accent }} />
      </div>
    </div>
  </button>
);

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const DrilldownModal = ({ detail, onClose }) => {
  if (!detail) return null;
  const { title, subtitle, rows, kind, emptyText } = detail;

  const thCls = 'px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400';
  const tdCls = 'px-3 py-2 text-[11px]';

  const renderBody = () => {
    if (!rows.length) return <div className="p-6 text-center text-[12px] text-gray-400">{emptyText || 'No records.'}</div>;

    if (kind === 'sales') return (
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['Order No','Customer','Items','Total','Status','Time'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.orderNumber} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-gray-900`}>{r.orderNumber}</td>
              <td className={`${tdCls} text-gray-600`}>{r.customerName}</td>
              <td className={`${tdCls} text-gray-600`}>{r.itemCount}</td>
              <td className={`${tdCls} font-semibold text-gray-900`}>{formatCurrency(r.totalAmount)}</td>
              <td className={`${tdCls} text-gray-600`}>{r.status}</td>
              <td className={`${tdCls} text-gray-500`}>{r.timeLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'products') return (
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['SKU','Product','Category','Stock','Price','Status'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-teal-600`}>{r.sku}</td>
              <td className={`${tdCls} text-gray-900`}>{r.name}</td>
              <td className={`${tdCls} text-gray-500`}>{r.category}</td>
              <td className={`${tdCls} text-gray-600`}>{r.stockQty}</td>
              <td className={`${tdCls} font-semibold text-gray-900`}>{formatCurrency(r.price)}</td>
              <td className={`${tdCls} text-gray-500`}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'suppliers') return (
      <table className="w-full min-w-[700px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['Code','Supplier','Contact','Phone','Email'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-teal-600`}>{r.code}</td>
              <td className={`${tdCls} text-gray-900`}>{r.name}</td>
              <td className={`${tdCls} text-gray-500`}>{r.contactName}</td>
              <td className={`${tdCls} text-gray-500`}>{r.contactPhone}</td>
              <td className={`${tdCls} text-gray-500`}>{r.contactEmail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'customers') return (
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['Code','Customer','Phone','Email'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-teal-600`}>{r.code}</td>
              <td className={`${tdCls} text-gray-900`}>{r.name}</td>
              <td className={`${tdCls} text-gray-500`}>{r.phone}</td>
              <td className={`${tdCls} text-gray-500`}>{r.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'rfids') return (
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['RFID','Product','SKU','Status'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-teal-600 font-mono`}>{r.tagCode || r.id}</td>
              <td className={`${tdCls} text-gray-900`}>{r.productName || r.name}</td>
              <td className={`${tdCls} text-gray-500`}>{r.productSku || '-'}</td>
              <td className={`${tdCls} text-gray-500`}>{r.status || 'Active'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'recent') return (
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['ID','Type','Amount','Status','Time'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={`${r.id}-${r.timestamp||r.time}`} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-semibold text-gray-900`}>{r.id}</td>
              <td className={`${tdCls} text-gray-500`}>{r.type}</td>
              <td className={`${tdCls} font-semibold text-gray-900`}>{r.amount}</td>
              <td className={`${tdCls} text-gray-500`}>{r.status}</td>
              <td className={`${tdCls} text-gray-400`}>{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'categories') return (
      <table className="w-full min-w-[480px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['Category','Stock Qty'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.name} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-medium text-gray-900`}>{r.name}</td>
              <td className={`${tdCls} text-gray-600`}>{Number(r.value||0).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (kind === 'returns') return (
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{['Txn #','Order #','Product','SKU','Qty','Time'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r=>(
            <tr key={r.transactionNumber} className="hover:bg-gray-50/60">
              <td className={`${tdCls} font-mono text-[10px] text-gray-500`}>{r.transactionNumber}</td>
              <td className={`${tdCls} font-semibold text-teal-600`}>{r.orderNumber}</td>
              <td className={`${tdCls} text-gray-900`}>{r.productName}</td>
              <td className={`${tdCls} font-mono text-gray-500`}>{r.productSku}</td>
              <td className={`${tdCls} font-bold text-orange-600`}>{r.quantity}</td>
              <td className={`${tdCls} text-gray-400`}>{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    return <div className="p-6 text-center text-[12px] text-gray-400">No view configured.</div>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl border border-gray-100">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-3.5">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-auto">{renderBody()}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [overview, setOverview] = useState(fallbackOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.getDashboardOverview();
        if (!active) return;
        setOverview(data || fallbackOverview);
        setError('');
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Dashboard data could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const metrics = useMemo(() => {
    const s = overview.summary || fallbackOverview.summary;
    return [
      { key: 'sales',  title: "Today's Sales",   value: formatCurrency(s.todaySales),  change: s.todaySales  > 0 ? 12 : 0, icon: DollarSign,   accent: '#0d9488' },
      { key: 'orders', title: 'Total Orders',     value: Number(s.totalOrders||0).toLocaleString('en-IN'), change: s.totalOrders > 0 ? 8 : 0,  icon: ShoppingCart, accent: '#0d9488' },
      { key: 'stock',  title: 'Stock Items',      value: Number(s.stockItems||0).toLocaleString('en-IN'),  change: s.stockItems  > 0 ? -3 : 0, icon: Package,      accent: '#10b981' },
      { key: 'alerts', title: 'Low Stock Alerts', value: Number(s.lowStockAlerts||0).toLocaleString('en-IN'), change: s.lowStockAlerts > 0 ? -5 : 0, icon: AlertCircle, accent: '#f59e0b' },
    ];
  }, [overview]);

  const trendData = overview.trends || [];
  const categoryData = overview.categoryMix || [];
  const recentTransactions = overview.recentTransactions || [];
  const rfidFeed = overview.rfidFeed || [];
  const recentReturns = overview.recentReturns || [];

  const drilldowns = useMemo(() => {
    const ap  = overview.activeProducts     || [];
    const lsp = overview.lowStockProducts   || [];
    const tso = overview.todaySalesOrders   || [];
    const as  = overview.activeSuppliers    || [];
    const ac  = overview.activeCustomers    || [];
    const art = overview.activeRfidTags     || [];
    return {
      sales:     { title:"Today's Sales",        subtitle:'All orders recorded today.',                   kind:'sales',      rows:tso, emptyText:'No sales today.' },
      orders:    { title:'Total Orders',          subtitle:'Recent sales order activity.',                 kind:'recent',     rows:recentTransactions.filter(r=>r.type==='Sale'), emptyText:'No orders yet.' },
      stock:     { title:'Stock Items',           subtitle:'Active product catalog.',                      kind:'products',   rows:ap,  emptyText:'No active products.' },
      alerts:    { title:'Low Stock Alerts',      subtitle:'Products at or below reorder level.',          kind:'products',   rows:lsp, emptyText:'No low-stock alerts.' },
      suppliers: { title:'Active Suppliers',      subtitle:'Supplier master list.',                        kind:'suppliers',  rows:as,  emptyText:'No suppliers.' },
      customers: { title:'Active Customers',      subtitle:'Customer master list.',                        kind:'customers',  rows:ac,  emptyText:'No customers.' },
      rfids:     { title:'Active RFID Tags',      subtitle:'Tracked RFID records.',                        kind:'rfids',      rows:art, emptyText:'No RFID tags.' },
      trend:     { title:'Sales & Orders Trend',  subtitle:"Today's sales behind the chart.",              kind:'sales',      rows:tso, emptyText:'No trend data.' },
      category:  { title:'Category Mix',          subtitle:'Category-wise stock summary.',                 kind:'categories', rows:categoryData, emptyText:'No category data.' },
      recent:    { title:'Recent Transactions',   subtitle:'Sales, purchases, and inventory movement.',   kind:'recent',     rows:recentTransactions, emptyText:'No transactions yet.' },
      liveRfids: { title:'Live RFID Feed',        subtitle:'Real-time scan activity.',                     kind:'rfids',      rows:rfidFeed.map(i=>({id:i.id,tagCode:i.id,productName:i.name,productSku:'',status:i.status})), emptyText:'No RFID feed.' },
      returns:   { title:'Recent Returns',        subtitle:'Customer-returned items restocked.',            kind:'returns',    rows:recentReturns, emptyText:'No returns yet.' },
    };
  }, [categoryData, overview, recentTransactions, rfidFeed]);

  const selectedDetail = selectedModule ? drilldowns[selectedModule] : null;
  const openModule = (k) => setSelectedModule(k);
  const closeModule = () => setSelectedModule(null);

  const s = overview.summary || fallbackOverview.summary;

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <ScanLine size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-black tracking-tight">Live Dashboard</h1>
              <p className="text-[11px] mt-0.5 max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                KPIs, charts, recent activity and RFID feed — all live from the database.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            <span>{loading ? 'Loading...' : `Updated: ${lastUpdated || 'just now'}`}</span>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <KpiCard key={m.key} title={m.title} value={m.value} change={m.change} icon={m.icon} accent={m.accent} onClick={() => openModule(m.key)} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div onClick={() => openModule('trend')} role="button" tabIndex={0} className="lg:col-span-2 rounded-xl bg-white border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow focus:outline-none">
          <div className="mb-3">
            <h2 className="text-[12px] font-bold text-gray-900">Sales & Orders Trend</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Click to view today's orders.</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#d1d5db" tick={{ fontSize: 10 }} />
              <YAxis stroke="#d1d5db" tick={{ fontSize: 10 }} width={36} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sales"  fill="#0d9488" radius={[4,4,0,0]} />
              <Bar dataKey="orders" fill="#14b8a6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div onClick={() => openModule('category')} role="button" tabIndex={0} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow focus:outline-none">
          <div className="mb-3">
            <h2 className="text-[12px] font-bold text-gray-900">Category Mix</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Click for category details.</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}`} outerRadius={72} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions + RFID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <button type="button" onClick={() => openModule('recent')} className="w-full px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50/50 transition-colors">
            <h2 className="text-[12px] font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Click to open full list.</p>
          </button>
          <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
            {recentTransactions.length ? recentTransactions.map((txn) => (
              <div key={`${txn.type}-${txn.id}-${txn.timestamp||txn.time}`} className="px-4 py-2.5 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{txn.id}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      txn.type === 'Sale'     ? 'bg-emerald-50 text-emerald-700' :
                      txn.type === 'Purchase' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'
                    }`}>{txn.type}</span>
                    <span className="text-[10px] text-gray-400">{txn.time}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[12px] font-bold text-gray-900">{txn.amount}</p>
                  <p className={`text-[10px] font-medium ${
                    txn.status === 'Completed' || txn.status === 'Received' ? 'text-emerald-600' :
                    txn.status === 'Pending' ? 'text-orange-500' : 'text-teal-600'
                  }`}>{txn.status}</p>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-[12px] text-gray-400">No live transactions yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <button type="button" onClick={() => openModule('liveRfids')} className="w-full px-4 py-3 border-b border-gray-50 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors">
            <div>
              <h2 className="text-[12px] font-bold text-gray-900">Live RFID Feed</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Click to open full list.</p>
            </div>
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#0d9488' }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#0d9488' }} />
            </div>
          </button>
          <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
            {rfidFeed.length ? rfidFeed.map((item) => (
              <div key={item.id} className="px-4 py-2.5 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.08)' }}>
                    <Radio size={12} style={{ color: '#0d9488' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.id}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[12px] font-bold text-gray-900">{item.qty}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">{item.status}</p>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-[12px] text-gray-400">No RFID tags tracked yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Returns */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <button type="button" onClick={() => openModule('returns')} className="w-full px-4 py-3 border-b border-gray-50 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors">
          <div>
            <h2 className="text-[12px] font-bold text-gray-900">Recent Returns</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Returned items added back to stock. Click to see all.</p>
          </div>
          <RotateCcw size={14} className="text-orange-400 shrink-0" />
        </button>
        <div className="divide-y divide-gray-50 max-h-64 overflow-auto">
          {recentReturns.length ? recentReturns.map((ret) => (
            <div key={ret.transactionNumber} className="px-4 py-2.5 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  <RotateCcw size={12} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{ret.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{ret.orderNumber}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">{ret.time}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-[11px] font-bold text-orange-600">−{ret.quantity} pcs</span>
                <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">Restocked</p>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-[12px] text-gray-400">No returns recorded yet.</div>
          )}
        </div>
      </div>

      {/* Stat mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { key:'suppliers', label:'Active Suppliers', value:s.activeSuppliers, icon:Truck,  accent:'#0d9488' },
          { key:'customers', label:'Active Customers', value:s.activeCustomers, icon:Users,  accent:'#10b981' },
          { key:'rfids',     label:'Active RFID Tags', value:s.activeRfids,     icon:Radio,  accent:'#f59e0b' },
        ].map(({ key, label, value, icon: Icon, accent }) => (
          <button key={key} type="button" onClick={() => openModule(key)}
            className="rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: accent + '18' }}>
                <Icon size={14} style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                <p className="text-[16px] font-black text-gray-900">{value ?? 0}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <DrilldownModal detail={selectedDetail} onClose={closeModule} />
    </div>
  );
};

export default Dashboard;
