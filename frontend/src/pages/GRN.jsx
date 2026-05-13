import React, { useState, useEffect } from 'react';
import { ScanFace, AlertTriangle, CheckCircle, X, PackageCheck, ListFilter, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const GRN = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [notice, setNotice] = useState('');
  
  // Received items state (simulating RFID matched items)
  const [receivedItems, setReceivedItems] = useState([]); // {productId, qty}

  useEffect(() => {
    loadPOs();
  }, []);

  const loadPOs = async () => {
    try {
      const data = await api.getPurchaseOrders();
      // Only show Pending or Sent orders for receiving
      setPurchaseOrders(data.filter(p => p.status === 'Pending' || p.status === 'Sent'));
    } catch (error) {
      console.error('Failed to load POs');
    }
  };

  const handlePOChange = async (id) => {
    const numId = parseInt(id);
    if (!numId || numId <= 0) {
      setSelectedPOId('');
      setSelectedPO(null);
      setReceivedItems([]);
      return;
    }
    
    setSelectedPOId(numId);
    setLoading(true);
    try {
      const data = await api.getPurchaseOrderById(numId);
      setSelectedPO(data);
      // Initialize received items with 0 qty
      setReceivedItems((data.items || []).map(i => ({
        productId: i.productId || i.id,
        productName: i.productName || i.product?.name,
        brand: i.brand,
        size: i.size,
        gender: i.gender,
        expectedQty: i.quantity || i.qty,
        receivedQty: 0
      })));
    } catch (error) {
      setNotice(`Error fetching PO details: ${error.message}`);
      setSelectedPOId('');
      setSelectedPO(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (productId, val) => {
    setReceivedItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, receivedQty: parseInt(val) || 0 } : item
    ));
  };

  const handleSimulateScan = () => {
    // Simulate matching all items
    setReceivedItems(prev => prev.map(item => ({ ...item, receivedQty: item.expectedQty })));
  };

  const handleFinalize = async () => {
    if (!selectedPOId || receivedItems.length === 0) return;
    
    setFinalizeLoading(true);
    try {
      await api.createGoodsReceipt({
        purchaseOrderId: parseInt(selectedPOId),
        notes: `Received via GRN Panel on ${new Date().toLocaleString()}`,
        items: receivedItems.map(i => ({
          productId: i.productId,
          quantityReceived: i.receivedQty
        }))
      });
      setNotice('Goods Receipt finalized! Inventory updated.');
      setSelectedPOId('');
      setSelectedPO(null);
      setReceivedItems([]);
      loadPOs();
    } catch (error) {
      setNotice(error.message || 'Failed to finalize receipt.');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const matchedCount = receivedItems.filter(i => i.receivedQty === i.expectedQty).length;
  const totalCount = receivedItems.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Goods Receipt (GRN)</h1>
          <p className="text-sm text-gray-500 mt-2">Verify incoming shipments and update stock levels using RFID/Manual matching</p>
        </div>
        {notice && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
            <CheckCircle size={18} /> <span className="font-bold text-sm">{notice}</span>
            <button onClick={() => setNotice('')}><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        {/* Left Panel: Control */}
        <div className="space-y-4">
          {/* PO Selection Card */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <ListFilter size={15} />
              </div>
              <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Select Order</h2>
            </div>
            
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pending Purchase Order</label>
            <select 
              value={selectedPOId} 
              onChange={(e) => handlePOChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-gray-50 appearance-none"
            >
              <option value="">Choose PO to Receive...</option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>{po.orderNumber} - {po.supplier}</option>
              ))}
            </select>

            {selectedPO && (
              <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Supplier</p>
                  <p className="text-sm font-bold text-gray-900">{selectedPO.supplier}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Order Date</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Simulation Card */}
          <div className="rounded-xl border-2 border-brand-100 bg-brand-50 p-4 text-center shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600 animate-pulse"></div>
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600 mb-6 shadow-xl shadow-brand-200/50 group-hover:scale-110 transition-transform">
              <ScanFace size={22} className="animate-pulse" />
            </div>
            <h2 className="text-sm font-black text-brand-900 uppercase tracking-tighter">RFID Tunnel Active</h2>
            <p className="mt-3 text-xs font-bold text-brand-700/60 leading-relaxed uppercase tracking-widest">
              Scan items to match with PO quantities automatically
            </p>
            <button 
              onClick={handleSimulateScan}
              disabled={!selectedPO}
              className="mt-8 w-full rounded-xl bg-white border-2 border-brand-200 py-4 text-xs font-black text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all disabled:opacity-30 uppercase tracking-widest"
            >
              Simulate RFID Scan (Match All)
            </button>
          </div>

          {/* Action Card */}
          {selectedPO && (
            <div className="rounded-xl bg-gray-900 p-4 text-white shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6">Verification Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-400">Total Items</span>
                  <span className="text-sm font-black">{totalCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-400">Matched ✓</span>
                  <span className="text-sm font-black text-brand-400">{matchedCount}</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={handleFinalize}
                    disabled={finalizeLoading || matchedCount === 0}
                    className="w-full rounded-xl bg-brand-600 py-4 text-sm font-black text-white hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {finalizeLoading ? 'PROCESSING...' : 'FINALIZE RECEIPT'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Item Matching List */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-gray-900 text-sm tracking-tight uppercase">Incoming Verification</h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Verify quantity before stock entry</p>
            </div>
            {selectedPO && (
              <div className="bg-brand-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase">
                {selectedPO.orderNumber}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {!selectedPO ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 p-4 text-center">
                <PackageCheck size={80} className="mb-6 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">Please select a purchase order to start verification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {receivedItems.map((item) => (
                  <div key={item.productId} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                        item.receivedQty === item.expectedQty 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : item.receivedQty > 0 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.receivedQty === item.expectedQty ? <CheckCircle size={16} /> : <ClipboardCheck size={16} />}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900 tracking-tight uppercase">{item.productName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{item.brand} • {item.size} • {item.gender}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">Expected: {item.expectedQty} units</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Qty Received</label>
                        <input 
                          type="number" 
                          value={item.receivedQty}
                          onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                          className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center font-black text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      
                      <div className="w-24 text-right">
                        {item.receivedQty === item.expectedQty ? (
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">Matched</span>
                        ) : (
                          <span className="text-[10px] font-black bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100 uppercase tracking-widest">Mismatch</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRN;
