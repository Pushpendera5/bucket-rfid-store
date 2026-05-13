import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Send, X, ChevronDown, Calendar, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const PurchaseOrder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [poList, setPoList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [notice, setNotice] = useState('');
  
  // Form State
  const [selectedVendor, setSelectedVendor] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // {productId, name, qty, cost}
  const [createLoading, setCreateLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, inv, vends] = await Promise.all([
        api.getPurchaseOrders(),
        api.getInventory(),
        api.getVendors()
      ]);
      setPoList(pos);
      setInventory(inv);
      setVendors(vends);
    } catch (error) {
      setNotice('Error loading data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = (product) => {
    const existing = selectedItems.find(i => i.productId === product.id);
    if (existing) {
      setSelectedItems(prev => prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setSelectedItems(prev => [...prev, { 
        productId: product.id, 
        name: product.name, 
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        qty: 1, 
        cost: product.price * 0.8 // Assuming 20% margin for cost
      }]);
    }
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prev => prev.filter(i => i.productId !== id));
  };

  const handleCreatePO = async () => {
    if (!selectedVendor || !selectedItems.length) {
      setNotice('Please select a vendor and at least one item.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.createPurchaseOrder({
        supplierId: parseInt(selectedVendor),
        expectedDate: expectedDate || null,
        remarks,
        items: selectedItems.map(i => ({
          productId: i.productId,
          quantity: i.qty,
          unitCost: i.cost
        }))
      });
      setNotice('Purchase Request created successfully!');
      setIsOpen(false);
      setSelectedItems([]);
      setSelectedVendor('');
      setRemarks('');
      setExpectedDate('');
      loadData();
    } catch (error) {
      setNotice(error.message || 'Failed to create Purchase Request.');
    } finally {
      setCreateLoading(false);
    }
  };

  const stats = [
    { label: 'Total Requests', value: poList.length, color: 'bg-brand-600' },
    { label: 'Pending', value: poList.filter(p => p.status === 'Pending').length, color: 'bg-orange-600' },
    { label: 'Sent', value: poList.filter(p => p.status === 'Sent').length, color: 'bg-brand-600' },
    { label: 'Received', value: poList.filter(p => p.status === 'Received').length, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Purchase Requests</h1>
          <p className="text-sm text-gray-500 mt-2">Create and track internal buying requests for stock replenishment</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98]">
          <Plus size={15} /> Create New Request
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} /> {notice}
          </div>
          <button onClick={() => setNotice('')}><X size={16} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
            <div className="flex items-end justify-between mt-3">
              <p className="text-[13px] font-black text-gray-900">{s.value}</p>
              <div className={`h-8 w-8 rounded-xl ${s.color} opacity-10 flex items-center justify-center`}>
                <ShoppingCart className={`${s.color.replace('bg-', 'text-')}`} size={15} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search Request ID or Supplier..." className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Request ID</th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Supplier</th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Items</th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Amount</th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-700 uppercase tracking-wider text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">Loading requests...</td></tr>
              ) : poList.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">No purchase requests found.</td></tr>
              ) : (
                poList.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-2.5 font-bold text-brand-600">{po.orderNumber}</td>
                    <td className="px-4 py-2.5 text-gray-900 font-semibold">{po.supplier}</td>
                    <td className="px-4 py-2.5 text-gray-500"><Calendar size={14} className="inline mr-1" /> {new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-gray-900 font-medium">{po.itemCount} SKUs</td>
                    <td className="px-4 py-2.5 font-bold text-gray-900">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        po.status === 'Sent' ? 'bg-brand-50 text-brand-700' :
                        po.status === 'Pending' ? 'bg-orange-50 text-orange-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{po.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-gray-900 p-4 text-white">
              <div>
                <h2 className="text-[13px] font-black tracking-tight">Create Purchase Request</h2>
                <p className="text-gray-400 text-sm mt-1">Add items to replenish your store inventory</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"><X size={15} /></button>
            </div>
            
            <div className="p-4 grid md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {/* Left Column: Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Select Supplier *</label>
                  <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none bg-gray-50"
                  >
                    <option value="">Choose a Supplier...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Expected Date</label>
                    <input 
                      type="date" 
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Total Estimated</label>
                    <div className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-100 font-bold text-gray-900">
                      ₹{selectedItems.reduce((sum, i) => sum + (i.qty * i.cost), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Internal Remarks</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any notes for the procurement team..."
                    className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50"
                    rows={3}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={handleCreatePO} 
                    disabled={createLoading}
                    className="flex-1 rounded-xl bg-brand-600 py-4 text-sm font-black text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 disabled:opacity-50"
                  >
                    {createLoading ? 'CREATING...' : 'SUBMIT PURCHASE REQUEST'}
                  </button>
                </div>
              </div>

              {/* Right Column: Item Selection */}
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col h-full border border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Request Items ({selectedItems.length})</h3>
                
                {/* Selected Items List */}
                <div className="flex-1 space-y-3 mb-6 overflow-y-auto pr-2 min-h-[200px]">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <ShoppingCart size={15} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No items added yet</p>
                    </div>
                  ) : (
                    selectedItems.map(item => (
                      <div key={item.productId} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between group shadow-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate uppercase">{item.name}</p>
                          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{item.brand} • {item.size} • {item.gender}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">COST: ₹{item.cost.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <button onClick={() => setSelectedItems(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 font-bold">-</button>
                            <span className="text-xs font-black min-w-[20px] text-center">{item.qty}</span>
                            <button onClick={() => setSelectedItems(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i))} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 font-bold">+</button>
                          </div>
                          <button onClick={() => handleRemoveItem(item.productId)} className="text-gray-400 hover:text-brand-600"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Item Search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Quick add item..." 
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-brand-500 outline-none" 
                    />
                  </div>
                  <div className="mt-3 max-h-[150px] overflow-y-auto space-y-1">
                    {inventory.slice(0, 10).map(product => (
                      <button 
                        key={product.productId || product.id}
                        onClick={() => handleAddItem(product)}
                        className="w-full text-left p-2 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between"
                      >
                        {product.name}
                        <Plus size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
