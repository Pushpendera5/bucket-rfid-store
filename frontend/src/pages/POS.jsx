import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanFace, Search, ShoppingBag, Plus, Trash2, CreditCard, Banknote,
  Printer, ReceiptText, UserRound, CheckCircle2, RotateCcw, History,
  RefreshCw, PauseCircle, PlayCircle, X, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

const COMPANY = {
  name: 'Way Infotech Store',
  tagline: 'RFID Smart Retail',
  address: 'Shop No. 1, Main Market, City – 000000',
  phone: '+91-XXXXXXXXXX',
  gstin: '27XXXXXXX0000XZ',
};

const TAX_RATE = 0.05;

const buildLine = (product, scannedRfid = null) => ({
  cartId: `${product.id}:${Date.now()}`,
  productId: product.id,
  sku: product.sku || `SKU-${product.id}`,
  name: product.name,
  category: product.category || 'Apparel',
  brand: product.brand || '',
  size: product.size || '',
  price: Number(product.price || 0),
  qty: 1,
  stock: product.stock ?? 0,
  rfid: scannedRfid || product.rfid || '',
  rfids: scannedRfid ? [scannedRfid] : product.rfid ? [product.rfid] : [],
});

const PrintInvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root { position: fixed !important; top: 0 !important; left: 0 !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="print:hidden absolute top-4 right-4 z-10 flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all">
            <Printer size={15} /> Print Receipt
          </button>
          <button onClick={onClose} className="flex items-center gap-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 shadow-xl transition-all">
            <X size={15} /> Close &amp; New Bill
          </button>
        </div>
        <div id="print-root" className="w-[400px] bg-white shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:overflow-visible print:max-h-none" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
          <div className="text-center px-6 pt-6 pb-4 border-b-2 border-dashed border-gray-300">
            <p className="text-2xl font-black tracking-tight uppercase">{COMPANY.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">{COMPANY.tagline}</p>
            <p className="text-xs text-gray-500 mt-1 font-sans">{COMPANY.address}</p>
            <p className="text-xs text-gray-500 font-sans">Tel: {COMPANY.phone}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">GSTIN: {COMPANY.gstin}</p>
          </div>
          <div className="px-6 py-3 border-b border-dashed border-gray-300 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Bill No.</span><span className="font-bold tracking-wide">{invoice.invoiceNo}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date &amp; Time</span><span>{new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{invoice.customer.name || 'Walk-in Customer'}</span></div>
            {invoice.customer.mobile && (<div className="flex justify-between"><span className="text-gray-500">Mobile</span><span>{invoice.customer.mobile}</span></div>)}
            <div className="flex justify-between"><span className="text-gray-500">Payment Mode</span><span className="font-bold uppercase">{invoice.paymentMethod}</span></div>
          </div>
          <div className="px-6 py-3 border-b border-dashed border-gray-300">
            <div className="flex text-[10px] font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">
              <span className="flex-1">Description</span><span className="w-8 text-center">Qty</span><span className="w-16 text-right">Rate</span><span className="w-16 text-right">Amt</span>
            </div>
            {invoice.items.map((item, i) => (
              <div key={i} className="py-1.5 border-b border-dotted border-gray-100 last:border-b-0">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-semibold leading-tight truncate">{item.name}</p>
                    {item.size && <p className="text-[10px] text-gray-400 font-sans">Size: {item.size}</p>}
                  </div>
                  <span className="w-8 text-center text-xs">{item.qty}</span>
                  <span className="w-16 text-right text-xs">&#8377;{item.price.toLocaleString('en-IN')}</span>
                  <span className="w-16 text-right text-xs font-bold">&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-b-2 border-dashed border-gray-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600"><span>Subtotal ({invoice.items.reduce((s, i) => s + i.qty, 0)} items)</span><span>&#8377;{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            {invoice.bulkDiscount > 0 && (<div className="flex justify-between text-emerald-700 font-sans"><span>Bulk Discount (5% &middot; 3+ items)</span><span>-&#8377;{invoice.bulkDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>)}
            {invoice.additionalDiscountAmt > 0 && (<div className="flex justify-between text-emerald-700 font-sans"><span>Extra Discount {invoice.additionalDiscountType === 'percent' ? `(${invoice.additionalDiscount}%)` : '(Flat)'}</span><span>-&#8377;{invoice.additionalDiscountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>)}
            <div className="flex justify-between text-gray-600 font-sans"><span>GST @ 5%</span><span>&#8377;{invoice.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between font-black text-sm pt-2 mt-1 border-t-2 border-gray-800"><span>TOTAL PAYABLE</span><span>&#8377;{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            {invoice.paymentMethod === 'Cash' && invoice.cashTendered > 0 && (<>
              <div className="flex justify-between text-gray-600 font-sans pt-1"><span>Cash Tendered</span><span>&#8377;{Number(invoice.cashTendered).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between font-bold text-emerald-700 font-sans"><span>Change Returned</span><span>&#8377;{invoice.change.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </>)}
          </div>
          <div className="px-6 py-5 text-center font-sans">
            <p className="text-xs font-bold text-gray-800">Thank you for shopping with us!</p>
            <p className="text-[10px] text-gray-400 mt-1">Exchange within 7 days with original bill &amp; RFID tag intact.</p>
            <div className="mt-3 inline-block border border-gray-300 rounded px-4 py-2">
              <p className="text-[9px] font-mono tracking-widest text-gray-500">||| {invoice.invoiceNo} |||</p>
            </div>
            <p className="text-[9px] text-gray-400 mt-2">Powered by Way Infotech RFID Smart POS</p>
          </div>
        </div>
      </div>
    </>
  );
};

const HeldBillsPanel = ({ heldBills, onRecall, onDiscard, onClose }) => (
  <div className="fixed inset-0 z-40 flex items-start justify-end pt-16 pr-5" onClick={onClose}>
    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <PauseCircle size={14} className="text-amber-400" />
          <p className="text-sm font-bold text-white">Held Bills ({heldBills.length})</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      {heldBills.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <PauseCircle size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs">No bills currently on hold</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {heldBills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{bill.customer.name || 'Walk-in'} &middot; {bill.cart.length} item(s)</p>
                <p className="text-xs text-gray-400 mt-0.5">&#8377;{bill.cart.reduce((s, c) => s + c.price * c.qty, 0).toLocaleString('en-IN')} &middot; {bill.heldAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button onClick={() => onRecall(bill)} className="flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-bold transition-all">
                <PlayCircle size={11} /> Recall
              </button>
              <button onClick={() => onDiscard(bill.id)} className="rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 transition-all"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const POS = () => {
  const [activeModule, setActiveModule] = useState('billing');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanValue, setScanValue] = useState('');
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [cart, setCart] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [additionalDiscount, setAdditionalDiscount] = useState('');
  const [additionalDiscountType, setAdditionalDiscountType] = useState('flat');
  const [heldBills, setHeldBills] = useState([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({ bills: 0, revenue: 0 });
  const [returnSearch, setReturnSearch] = useState('');
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const lastReaderScanIdRef = useRef(null);
  const scanInputRef = useRef(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const autoDiscount = cart.length >= 3 ? subtotal * 0.05 : 0;
  const addDiscAmt = additionalDiscountType === 'percent'
    ? (subtotal - autoDiscount) * (Number(additionalDiscount) || 0) / 100
    : Number(additionalDiscount) || 0;
  const taxableAmount = Math.max(0, subtotal - autoDiscount - addDiscAmt);
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;
  const cashChange = paymentMethod === 'Cash' && Number(cashTendered) > total ? Number(cashTendered) - total : 0;
  const returnTotal = returnItems.reduce((s, i) => s + i.price * i.qty, 0);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const focusScan = () => setTimeout(() => scanInputRef.current?.focus(), 80);

  const waitForNextReaderScan = async ({ timeoutMs = 10000, pollMs = 1000 } = {}) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const recentScans = await api.getFx9600RecentScans(5);
      const nextScan = (Array.isArray(recentScans) ? recentScans : []).find((scan) => scan?.id && scan.id !== lastReaderScanIdRef.current);
      if (nextScan) { lastReaderScanIdRef.current = nextScan.id; return nextScan; }
      await sleep(pollMs);
    }
    return null;
  };

  const loadInventory = async () => {
    try {
      const response = await api.getInventory();
      const items = Array.isArray(response) ? response : response?.value || [];
      setInventory(items.map((item) => ({
        id: item.id, sku: item.sku || `SKU-${item.id}`, name: item.name,
        category: item.category, brand: item.brand, size: item.size,
        price: item.price, stock: item.stock, rfid: item.rfid,
      })));
    } catch {
      setInventory([]);
      setNotice('Inventory unavailable. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const catalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item) =>
      [item.name, item.category, item.sku, item.rfid].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [inventory, search]);

  const addToCart = (product, scannedRfid = null) => {
    const line = buildLine(product, scannedRfid);
    setCart((current) => {
      const existing = current.find((i) => i.productId === product.id);
      if (existing) {
        return current.map((i) => {
          if (i.productId !== product.id) return i;
          const nextRfids = scannedRfid && !i.rfids?.includes(scannedRfid) ? [...(i.rfids || []), scannedRfid] : i.rfids || [];
          return { ...i, qty: i.qty + 1, rfids: nextRfids, rfid: nextRfids[0] || i.rfid };
        });
      }
      return [...current, line];
    });
    setNotice(`${product.name} added to bill.`);
  };

  const updateQty = (cartId, delta) => {
    setCart((c) => c.map((i) => (i.cartId === cartId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };
  const removeItem = (cartId) => setCart((c) => c.filter((i) => i.cartId !== cartId));

  const handleScan = async () => {
    const raw = scanValue.trim();
    if (!raw) {
      try {
        setNotice('FX9600 reader triggering... place tag near reader.');
        let tagCode = null;
        try {
          const r = await api.triggerFx9600ReadLlrp(10000);
          tagCode = r?.scans?.[0]?.tagCode || r?.tags?.[0] || null;
        } catch { }
        if (!tagCode) {
          const scan = await waitForNextReaderScan({ timeoutMs: 10000 });
          tagCode = scan?.tagCode || scan?.id;
        }
        if (!tagCode) { setNotice('No RFID detected. Place tag near reader and try again.'); return; }
        const tag = await api.lookupRfidTag(tagCode);
        const prod = tag?.product || tag?.Product;
        if (prod?.id) { addToCart(prod, tag.tagCode || tagCode); focusScan(); return; }
        setNotice(`Tag detected: ${tagCode} — not linked to any product.`);
      } catch (err) {
        setNotice(err.message || 'Reader error. Check RFID reader connection.');
      }
      return;
    }
    const tokens = raw.split(/[\n,;\s]+/).map((t) => t.trim()).filter(Boolean);
    let matched = 0, unmatched = 0;
    for (const tok of tokens) {
      const v = tok.toLowerCase();
      const product = inventory.find((p) => [p.rfid, p.sku, p.name, String(p.id)].filter(Boolean).some((f) => f.toLowerCase() === v || f.toLowerCase().includes(v)));
      if (product) { addToCart(product, tok); matched++; continue; }
      try {
        const tag = await api.lookupRfidTag(tok);
        const prod = tag?.product || tag?.Product;
        if (prod?.id) { addToCart(prod, tag.tagCode || tok); matched++; continue; }
      } catch { }
      unmatched++;
    }
    setScanValue(''); focusScan();
    if (matched && unmatched) setNotice(`${matched} added, ${unmatched} not found.`);
    else if (matched) setNotice(`${matched} item(s) added to bill.`);
    else setNotice('No matching product found for the scanned value.');
  };

  const holdCurrentBill = () => {
    if (!cart.length) { setNotice('Nothing in cart to hold.'); return; }
    const held = { id: Date.now(), customer: { ...customer }, cart: [...cart], paymentMethod, additionalDiscount, additionalDiscountType, heldAt: new Date() };
    setHeldBills((prev) => [...prev, held]);
    setCart([]); setCustomer({ name: '', mobile: '' }); setScanValue(''); setSearch(''); setAdditionalDiscount(''); setCashTendered('');
    setShowHeldBills(false);
    setNotice('Bill held. Start a new one or recall from Hold.');
    focusScan();
  };

  const recallBill = (heldBill) => {
    if (cart.length > 0) {
      const current = { id: Date.now(), customer: { ...customer }, cart: [...cart], paymentMethod, additionalDiscount, additionalDiscountType, heldAt: new Date() };
      setHeldBills((prev) => [...prev.filter((b) => b.id !== heldBill.id), current]);
    } else {
      setHeldBills((prev) => prev.filter((b) => b.id !== heldBill.id));
    }
    setCart(heldBill.cart); setCustomer(heldBill.customer); setPaymentMethod(heldBill.paymentMethod);
    setAdditionalDiscount(heldBill.additionalDiscount); setAdditionalDiscountType(heldBill.additionalDiscountType);
    setCashTendered(''); setShowHeldBills(false);
    setNotice('Bill recalled from hold.'); focusScan();
  };

  const discardHeldBill = (id) => setHeldBills((prev) => prev.filter((b) => b.id !== id));

  const handleCheckout = async () => {
    if (!cart.length) { setNotice('Add items before checkout.'); return; }
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const payload = {
        customerName: customer.name, customerMobile: customer.mobile, paymentMethod,
        additionalDiscount: Number(additionalDiscount) || 0, additionalDiscountType,
        notes: `POS | ${paymentMethod}${additionalDiscount ? ` | Disc: ${additionalDiscount} ${additionalDiscountType}` : ''}`,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.qty, rfidTagCode: item.rfids?.length ? item.rfids.join(',') : item.rfid || undefined })),
      };
      const response = await api.checkoutSale(payload);
      const invoiceData = {
        invoiceNo: response.orderNumber, date: new Date(response.orderDate),
        customer: { name: response.customer, mobile: customer.mobile },
        items: cart.map((item) => ({ id: item.productId, name: item.name, qty: item.qty, price: item.price, size: item.size, rfid: item.rfid })),
        paymentMethod, subtotal: response.subtotal, bulkDiscount: autoDiscount,
        additionalDiscount: Number(additionalDiscount) || 0, additionalDiscountType, additionalDiscountAmt: addDiscAmt,
        tax: response.taxAmount, total: response.totalAmount,
        cashTendered: paymentMethod === 'Cash' && Number(cashTendered) >= response.totalAmount ? Number(cashTendered) : 0,
        change: paymentMethod === 'Cash' && cashChange > 0 ? cashChange : 0,
      };
      setInvoice(invoiceData);
      setSessionStats((prev) => ({ bills: prev.bills + 1, revenue: prev.revenue + response.totalAmount }));
      setCart([]); setCustomer({ name: '', mobile: '' }); setAdditionalDiscount(''); setCashTendered(''); setSearch('');
      setShowPrintModal(true);
      setNotice(`${response.orderNumber} — checkout complete.`);
      loadInventory();
    } catch (err) {
      setNotice(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const startNewBill = () => {
    setCart([]); setInvoice(null); setCustomer({ name: '', mobile: '' }); setScanValue('');
    setSearch(''); setAdditionalDiscount(''); setCashTendered('');
    setNotice('New bill started.'); focusScan();
  };

  const handleReturnSearch = async () => {
    if (!returnSearch.trim()) return;
    setReturnLoading(true);
    try {
      const data = await api.lookupSalesReturn(returnSearch.trim());
      setReturnOrder(data);
      setReturnItems(data.items.map((i) => ({ productId: i.productId, qty: 0, maxQty: i.quantity, name: i.productName, price: i.unitPrice })));
    } catch {
      setNotice('Invoice not found.'); setReturnOrder(null);
    } finally { setReturnLoading(false); }
  };

  const updateReturnQty = (productId, delta) => {
    setReturnItems((prev) => prev.map((i) => i.productId === productId ? { ...i, qty: Math.min(i.maxQty, Math.max(0, i.qty + delta)) } : i));
  };

  const handleProcessReturn = async () => {
    const toReturn = returnItems.filter((i) => i.qty > 0);
    if (!toReturn.length) { setNotice('Select at least one item to return.'); return; }
    setReturnLoading(true);
    try {
      await api.processSalesReturn({ orderNumber: returnOrder.orderNumber, reason: returnReason, items: toReturn.map((i) => ({ productId: i.productId, quantity: i.qty })) });
      setNotice('Return processed successfully. Stock updated.');
      setReturnOrder(null); setReturnItems([]); setReturnReason(''); setReturnSearch('');
      loadInventory();
    } catch (err) {
      setNotice(err.message || 'Return failed. Please try again.');
    } finally { setReturnLoading(false); }
  };

  useEffect(() => { loadInventory(); }, []);
  useEffect(() => { if (activeModule === 'billing') focusScan(); }, [activeModule]);

  return (
    <div className="flex flex-col gap-4">
      {showPrintModal && invoice && (
        <PrintInvoiceModal invoice={invoice} onClose={() => { setShowPrintModal(false); startNewBill(); }} />
      )}
      {showHeldBills && (
        <HeldBillsPanel heldBills={heldBills} onRecall={recallBill} onDiscard={discardHeldBill} onClose={() => setShowHeldBills(false)} />
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
              <ScanFace size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">{COMPANY.name}</p>
              <p className="text-sm font-black text-white leading-tight">RFID Smart POS</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="flex rounded-xl bg-gray-800 p-1 gap-0.5">
            <button onClick={() => setActiveModule('billing')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeModule === 'billing' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-gray-400 hover:text-white'}`}>
              <ShoppingBag size={13} /> Billing Counter
            </button>
            <button onClick={() => setActiveModule('return')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeModule === 'return' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-gray-400 hover:text-white'}`}>
              <RotateCcw size={13} /> Sale Return
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-gray-800 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">{sessionStats.bills} bills</span>
            </div>
            <div className="h-3 w-px bg-gray-700" />
            <span className="text-[10px] font-bold text-gray-300">&#8377;{sessionStats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          {activeModule === 'billing' && (
            <button onClick={() => setShowHeldBills(true)} title="Hold / Recall Bills"
              className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${heldBills.length > 0 ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              <PauseCircle size={13} /> Hold
              {heldBills.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">{heldBills.length}</span>
              )}
            </button>
          )}
          {notice && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 max-w-[200px]">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              <span className="text-xs font-medium text-amber-300 truncate">{notice}</span>
            </div>
          )}
          <button onClick={loadInventory} disabled={loading} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95">
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {inventory.length} SKUs
          </button>
        </div>
      </div>


      {activeModule === 'billing' ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
          {/* LEFT PANEL */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Customer Bar */}
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2 shrink-0">
                <UserRound size={15} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Customer</span>
              </div>
              <div className="h-5 w-px bg-gray-200 shrink-0" />
              <input value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Customer Name (optional)"
                className="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:font-normal placeholder:text-gray-400 border-b border-transparent focus:border-brand-500 py-1 transition-colors min-w-0" />
              <div className="h-5 w-px bg-gray-200 shrink-0" />
              <input value={customer.mobile} onChange={(e) => setCustomer((c) => ({ ...c, mobile: e.target.value }))} placeholder="Mobile"
                className="w-36 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:font-normal placeholder:text-gray-400 border-b border-transparent focus:border-brand-500 py-1 transition-colors" />
              <button onClick={holdCurrentBill} disabled={!cart.length} title="Hold current bill"
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <PauseCircle size={12} /> Hold
              </button>
              <button onClick={startNewBill} title="New bill"
                className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                + New Bill
              </button>
            </div>

            {/* RFID Scan Bar */}
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                <ScanFace size={16} />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand-500 focus-within:bg-white transition-all min-w-0">
                <input ref={scanInputRef} value={scanValue} onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleScan(); } if (e.key === 'Escape') { e.preventDefault(); setScanValue(''); } }}
                  placeholder="Scan RFID / type SKU — or leave empty &amp; press Detect for FX9600"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 min-w-0" autoComplete="off" autoFocus />
                {scanValue && (
                  <button onClick={() => { setScanValue(''); scanInputRef.current?.focus(); }} className="text-gray-300 hover:text-gray-600 text-lg leading-none shrink-0">&#215;</button>
                )}
              </div>
              <button onClick={handleScan} className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white px-5 py-2.5 text-sm font-bold transition-all shadow-md shadow-brand-600/20">
                <ScanFace size={14} /> Detect
              </button>
              <div className="h-6 w-px bg-gray-200 shrink-0" />
              <div className="relative shrink-0">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                  className="w-36 rounded-xl border border-gray-200 py-2 pl-7 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_7rem_5rem_6rem_6rem_6rem_2.5rem] gap-x-3 items-center bg-gray-900 text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5">
                <span>#</span><span>Product / RFID</span><span>Category</span><span>Size</span>
                <span className="text-right">Rate</span><span className="text-center">Qty</span><span className="text-right">Amount</span><span />
              </div>
              <div className="overflow-y-auto" style={{ minHeight: '18rem', maxHeight: 'calc(100vh - 22rem)' }}>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mb-4">
                      <ReceiptText size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">No items added</p>
                    <p className="mt-1 text-xs text-gray-400">Scan an RFID tag or search &amp; click to add</p>
                    {search && catalog.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-sm">
                        {catalog.slice(0, 6).map((p) => (
                          <button key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all">
                            <Plus size={10} /> {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const isOverStock = item.stock > 0 && item.qty > item.stock;
                    const isLowStock = !isOverStock && item.stock > 0 && item.stock <= 3;
                    return (
                      <div key={item.cartId} className={`group grid grid-cols-[2rem_1fr_7rem_5rem_6rem_6rem_6rem_2.5rem] gap-x-3 items-center px-4 py-3 border-b border-gray-50 transition-colors ${isOverStock ? 'bg-red-50/60' : 'hover:bg-brand-50/30'}`}>
                        <span className="text-xs font-bold text-gray-300">{idx + 1}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                            {isOverStock && (<span className="flex items-center gap-0.5 text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded whitespace-nowrap"><AlertTriangle size={8} /> OVER STOCK</span>)}
                            {isLowStock && (<span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded whitespace-nowrap">LOW: {item.stock} left</span>)}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{item.rfid || item.sku}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 truncate">{item.category || '—'}</span>
                        <span className="text-xs font-semibold text-gray-500">{item.size || '—'}</span>
                        <span className="text-sm font-semibold text-gray-700 text-right">&#8377;{item.price.toLocaleString('en-IN')}</span>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(item.cartId, -1)} className="h-5 w-5 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors leading-none">&#8722;</button>
                          <span className={`text-sm font-black min-w-5 text-center ${isOverStock ? 'text-red-600' : 'text-gray-900'}`}>{item.qty}</span>
                          <button onClick={() => updateQty(item.cartId, 1)} className="h-5 w-5 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors leading-none">&#43;</button>
                        </div>
                        <span className="text-sm font-black text-gray-900 text-right">&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
                        <button onClick={() => removeItem(item.cartId)} className="flex items-center justify-center h-6 w-6 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              {search && catalog.length > 0 && cart.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quick Add — "{search}"</p>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.slice(0, 8).map((p) => (
                      <button key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all">
                        <Plus size={9} /> {p.name}
                        <span className="text-gray-400 font-normal">&#8377;{Number(p.price).toLocaleString('en-IN')}</span>
                        {p.stock > 0 && p.stock <= 3 && <span className="text-amber-600 text-[9px]">({p.stock})</span>}
                        {p.stock === 0 && <span className="text-red-500 text-[9px]">(out)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — INVOICE */}
          <div className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-900 px-5 py-4 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoice</p>
                  <p className="text-base font-black text-white mt-0.5 font-mono tracking-wide">{invoice?.invoiceNo || '— DRAFT —'}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-500 mt-1">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-800 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound size={13} className="text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-200 truncate">{customer.name || 'Walk-in Customer'}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono shrink-0 ml-2">{customer.mobile}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-50">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ReceiptText size={28} className="opacity-20 mb-2" />
                  <p className="text-xs">Scan items to populate invoice</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.qty} &times; &#8377;{item.price.toLocaleString('en-IN')}{item.size ? ` · ${item.size}` : ''}</p>
                    </div>
                    <span className="text-sm font-black text-gray-900 shrink-0">&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 p-4 space-y-3 shrink-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span className="font-semibold text-gray-700">&#8377;{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {autoDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded tracking-wider">AUTO 5%</span>
                      Bulk Discount
                    </span>
                    <span className="font-bold">&#8722; &#8377;{autoDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Extra Discount</p>
                  <div className="flex rounded-lg bg-white border border-amber-200 overflow-hidden text-[10px] font-bold">
                    <button onClick={() => setAdditionalDiscountType('flat')} className={`px-2.5 py-1 transition-all ${additionalDiscountType === 'flat' ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50'}`}>&#8377; Flat</button>
                    <button onClick={() => setAdditionalDiscountType('percent')} className={`px-2.5 py-1 transition-all ${additionalDiscountType === 'percent' ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50'}`}>% Off</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-3 py-2">
                  <span className="text-sm font-bold text-amber-600">{additionalDiscountType === 'flat' ? '&#8377;' : '%'}</span>
                  <input type="number" min="0" max={additionalDiscountType === 'percent' ? 100 : undefined} value={additionalDiscount}
                    onChange={(e) => setAdditionalDiscount(e.target.value)} placeholder="0"
                    className="flex-1 text-sm font-bold text-gray-900 outline-none bg-transparent" />
                  {addDiscAmt > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                      &#8722; &#8377;{addDiscAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-gray-700">&#8377;{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t-2 border-gray-900">
                  <span className="text-base font-black text-gray-900">Total Payable</span>
                  <span className="text-2xl font-black text-brand-600 leading-none">&#8377;{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPaymentMethod('Cash')} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${paymentMethod === 'Cash' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <Banknote size={15} /> Cash
                </button>
                <button onClick={() => setPaymentMethod('Card / UPI')} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${paymentMethod === 'Card / UPI' ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <CreditCard size={15} /> Card / UPI
                </button>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-200 px-3 py-2">
                    <Banknote size={14} className="text-emerald-600 shrink-0" />
                    <input type="number" min={0} value={cashTendered} onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={`Cash received (bill: &#8377;${total.toFixed(2)})`}
                      className="flex-1 text-sm font-bold text-gray-900 outline-none bg-transparent placeholder:font-normal placeholder:text-gray-400" />
                  </div>
                  {cashChange > 0 && (
                    <div className="flex justify-between px-1">
                      <span className="text-xs font-bold text-emerald-700">Change to Return</span>
                      <span className="text-sm font-black text-emerald-700">&#8377;{cashChange.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleCheckout} disabled={checkoutLoading || cart.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black active:scale-[0.98] text-white rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">
                <Printer size={15} />
                {checkoutLoading ? 'Processing...' : 'Checkout & Print Invoice'}
              </button>
              <button onClick={() => setCart([])} disabled={cart.length === 0} className="w-full py-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                Clear Bill
              </button>
            </div>

            {invoice && !showPrintModal && (
              <div className="border-t border-gray-200 bg-gray-950 p-4 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Last Invoice</p>
                  <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 font-bold transition-colors">
                    <Printer size={10} /> Reprint
                  </button>
                </div>
                <p className="text-[10px] font-black text-brand-400 font-mono mb-2">{invoice.invoiceNo}</p>
                <div className="space-y-1 mb-2">
                  {invoice.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-[10px]">
                      <span className="text-gray-400 truncate flex-1">{item.name} &times;{item.qty}</span>
                      <span className="text-white font-bold ml-2">&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {invoice.items.length > 3 && (<p className="text-[9px] text-gray-600">+{invoice.items.length - 3} more items</p>)}
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{invoice.paymentMethod}</span>
                  <span className="text-sm font-black text-brand-400">&#8377;{invoice.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      ) : (
        /* SALE RETURN MODULE */
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><RotateCcw size={17} /></div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Process Sale Return</h2>
                  <p className="text-xs text-gray-500">Enter the original Invoice Number to look up the order</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <History className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input value={returnSearch} onChange={(e) => setReturnSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReturnSearch()}
                    placeholder="Invoice number — e.g. SO-20240505123456789"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all" />
                </div>
                <button onClick={handleReturnSearch} disabled={returnLoading} className="flex items-center gap-2 rounded-xl bg-gray-900 hover:bg-black active:scale-95 px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md">
                  {returnLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  {returnLoading ? 'Searching...' : 'Find Invoice'}
                </button>
              </div>
            </div>

            {returnOrder && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-900 px-5 py-4 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Original Order</p>
                    <p className="text-lg font-black text-white mt-0.5 font-mono">{returnOrder.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(returnOrder.orderDate).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{returnOrder.customerName || 'Walk-in'}</p>
                    <p className="text-base font-black text-brand-400 mt-0.5">&#8377;{returnOrder.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Items to Return</p>
                  <div className="space-y-2">
                    {returnItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Purchased: {item.maxQty} unit(s) @ &#8377;{item.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-200 px-2 py-1">
                            <button onClick={() => updateReturnQty(item.productId, -1)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 text-sm font-bold">&#8722;</button>
                            <span className={`min-w-6 text-center text-sm font-black ${item.qty > 0 ? 'text-rose-600' : 'text-gray-300'}`}>{item.qty}</span>
                            <button onClick={() => updateReturnQty(item.productId, 1)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 text-sm font-bold">&#43;</button>
                          </div>
                          <span className="w-20 text-right text-sm font-black text-gray-900">&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Return Reason</label>
                    <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="e.g. Defective item, size mismatch, customer changed mind..."
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 p-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all resize-none" rows={2} />
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-100 p-4">
                    <div>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Estimated Refund</p>
                      <p className="text-2xl font-black text-rose-700 mt-0.5">&#8377;{returnTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={handleProcessReturn} disabled={returnLoading || returnTotal === 0}
                      className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-7 py-3 text-sm font-bold transition-all shadow-lg shadow-rose-600/25 disabled:opacity-50">
                      {returnLoading ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      {returnLoading ? 'Processing...' : 'Complete Return'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><RotateCcw size={15} /></div>
                <p className="text-sm font-bold text-gray-900">Return Policy</p>
              </div>
              <ul className="space-y-2.5 text-sm text-gray-500">
                {['Items returnable within 30 days of purchase.', 'Original RFID tag must be intact.', 'Refund to original payment method.', 'Partial returns are supported.', 'Defective items: full refund without question.'].map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-900 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Inventory Sync Active</p>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">All returns are automatically restocked and logged in the transaction history.</p>
            </div>
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-brand-600" />
                <p className="text-sm font-bold text-gray-900">Session Summary</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 p-3 text-center">
                  <p className="text-2xl font-black text-brand-600">{sessionStats.bills}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Bills Processed</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-lg font-black text-emerald-700">&#8377;{sessionStats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
