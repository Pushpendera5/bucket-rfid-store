import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Calendar, Package, ShoppingBag, AlertCircle, FileText, X, Filter, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#6366f1'];

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  
  // Default date range: Last 30 days
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { startDate: fromDate, endDate: toDate };
      
      const [sales, inv, brands, genders, summ] = await Promise.all([
        api.getSalesReport(params),
        api.getInventoryReport(params),
        api.getBrandReport(params),
        api.getGenderReport(params),
        api.getReportSummary(params)
      ]);
      
      const formattedSales = (sales || []).map(s => ({
        ...s,
        dateStr: new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      }));
      
      setSalesData(formattedSales);
      setInventoryData(inv || []);
      setBrandData(brands || []);
      setGenderData(genders || []);
      setSummary(summ);
    } catch (error) {
      setNotice(`Failed to load report data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    loadData();
  };

  const exportToExcel = () => {
    let dataToExport = [];
    let fileName = `Report_${reportType}_${fromDate}_to_${toDate}.xlsx`;

    if (reportType === 'sales') {
      dataToExport = salesData.map(s => ({
        'Date': new Date(s.date).toLocaleDateString(),
        'Revenue (₹)': s.revenue,
        'Orders': s.orders,
        'Items Sold': s.items
      }));
    } else if (reportType === 'inventory') {
      dataToExport = inventoryData.map(i => ({
        'Category': i.category,
        'Product Count': i.count,
        'Total Stock': i.stock,
        'Inventory Value (₹)': i.value
      }));
    } else if (reportType === 'brand') {
      dataToExport = brandData.map(b => ({
        'Brand': b.brand,
        'Product Count': b.count,
        'Total Stock': b.stock,
        'Inventory Value (₹)': b.value
      }));
    } else if (reportType === 'gender') {
      dataToExport = genderData.map(g => ({
        'Gender': g.gender,
        'Product Count': g.count,
        'Total Stock': g.stock,
        'Inventory Value (₹)': g.value
      }));
    }

    if (dataToExport.length === 0) {
      setNotice('No data available to export.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, fileName);
    setNotice('Excel report downloaded successfully!');
  };

  const reports = [
    { id: 'sales', label: 'Sales & Revenue', icon: <TrendingUp size={15} />, desc: 'Track sales trends and income' },
    { id: 'inventory', label: 'Category Analysis', icon: <Package size={15} />, desc: 'Stock levels by product group' },
    { id: 'brand', label: 'Brand Performance', icon: <ShoppingBag size={15} />, desc: 'Stock value by company/brand' },
    { id: 'gender', label: 'Gender Breakdown', icon: <FileText size={15} />, desc: 'Male, Female, and Kids split' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Business Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-widest">Enterprise performance metrics & data insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Date Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <Calendar size={14} className="text-gray-400" />
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-[10px] font-black text-gray-700 dark:text-gray-300 outline-none uppercase"
              />
            </div>
            <ChevronRight size={14} className="text-gray-300" />
            <div className="flex items-center gap-2 px-2">
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-[10px] font-black text-gray-700 dark:text-gray-300 outline-none uppercase"
              />
            </div>
          </div>

          <button 
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-all active:scale-[0.95]"
          >
            <Filter size={16} /> SEARCH
          </button>

          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white hover:bg-brand-700 shadow-xl shadow-brand-100 transition-all active:scale-[0.95]"
          >
            <Download size={16} /> EXPORT
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-brand-500" /> <span className="font-bold">{notice}</span>
          </div>
          <button onClick={() => setNotice('')}><X size={16} /></button>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard 
          label="Total Revenue" 
          value={`₹${(summary?.totalSales || 0).toLocaleString('en-IN')}`} 
          icon={<TrendingUp className="text-emerald-600" />} 
          color="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <SummaryCard 
          label="Orders" 
          value={summary?.totalOrders || 0} 
          icon={<ShoppingBag className="text-brand-600" />} 
          color="bg-brand-50 dark:bg-brand-900/20"
        />
        <SummaryCard 
          label="In-Stock Units" 
          value={summary?.totalStock || 0} 
          icon={<Package className="text-blue-600" />} 
          color="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard 
          label="Low Stock" 
          value={summary?.lowStockCount || 0} 
          icon={<AlertCircle className="text-orange-600" />} 
          color="bg-orange-50 dark:bg-orange-900/20"
          isAlert={summary?.lowStockCount > 0}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Sidebar Nav */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-4">Select Dimension</p>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`w-full group rounded-xl p-4 text-left transition-all border ${
                reportType === r.id
                  ? 'bg-white dark:bg-gray-800 border-brand-600 shadow-xl shadow-brand-100/10'
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-brand-200'
              }`}
            >
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center mb-4 transition-all ${
                reportType === r.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-brand-600'
              }`}>
                {r.icon}
              </div>
              <p className={`font-black text-sm uppercase tracking-tight ${reportType === r.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{r.label}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Chart View */}
        <div className="lg:col-span-3">
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-[13px] font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  {reportType === 'sales' ? 'Revenue Flow' : 'Distribution Analytics'}
                </h2>
                <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.2em]">
                  Timeline: {new Date(fromDate).toLocaleDateString()} — {new Date(toDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="h-2 w-2 rounded-full bg-brand-600 animate-pulse"></div>
                <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Active Stream</span>
              </div>
            </div>

            <div className="h-[220px] w-full">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"></div>
                </div>
              ) : reportType === 'sales' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                    <XAxis 
                      dataKey="dateStr" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px', background: '#111827', color: '#fff' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : reportType === 'inventory' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                    <XAxis 
                      dataKey="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px', background: '#111827', color: '#fff' }}
                      cursor={{ fill: '#f8fafc', radius: 12, opacity: 0.1 }}
                    />
                    <Bar dataKey="value" fill="#0d9488" radius={[12, 12, 0, 0]} barsize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : reportType === 'brand' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                    <XAxis 
                      dataKey="brand" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px', background: '#111827', color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#0d9488" radius={[12, 12, 0, 0]} barsize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="gender"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px', background: '#111827', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color, isAlert }) => (
  <div className={`rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${isAlert ? 'border-orange-200' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}>
        {React.cloneElement(icon, { size: 15 })}
      </div>
      {isAlert && <div className="h-2 w-2 rounded-full bg-orange-600 animate-ping"></div>}
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-[13px] font-black text-gray-900 dark:text-white mt-2 tracking-tighter">{value}</p>
  </div>
);

export default Reports;
