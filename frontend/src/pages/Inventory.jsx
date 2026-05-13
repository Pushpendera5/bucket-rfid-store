import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Filter, Edit, Trash, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventory, addInventory, deleteInventory, updateInventory } from '../redux/slices/inventorySlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { read, utils } from 'xlsx';
import { api } from '../services/api';

const Inventory = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.inventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [restockSaving, setRestockSaving] = useState(false);
  const [restockError, setRestockError] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rfidRows, setRfidRows] = useState([]);
  const [rfidLoading, setRfidLoading] = useState(false);
  const [rfidSaving, setRfidSaving] = useState(false);
  const [rfidError, setRfidError] = useState('');
  const [rfidMessage, setRfidMessage] = useState('');
  const [rfidSummary, setRfidSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.id, item.name, item.category, item.rfid, item.status, item.brand, item.size, item.gender]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, searchTerm]);

  const formik = useFormik({
    initialValues: { name: '', category: 'Clothing', stock: 1, price: 0, brand: '', size: 'M', gender: 'Male', rfid: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      category: Yup.string().required('Required'),
      stock: Yup.number().min(0).required('Required'),
      price: Yup.number().min(0).required('Required'),
      brand: Yup.string().required('Required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      const payload = { 
        ...values, 
        targetGender: values.gender,
        status: values.stock < 20 ? 'Low Stock' : 'Active' 
      };
      
      if (editItem) {
        await dispatch(updateInventory({ id: editItem.id, payload }));
      } else {
        await dispatch(addInventory(payload));
      }
      
      resetForm();
      setEditItem(null);
      setIsModalOpen(false);
    },
  });

  // Load edit values into formik
  useEffect(() => {
    if (editItem) {
      formik.setValues({
        name: editItem.name || '',
        category: editItem.category || 'Clothing',
        stock: editItem.stock || 0,
        price: editItem.price || 0,
        brand: editItem.brand || '',
        size: editItem.size || 'M',
        gender: editItem.gender || 'Male',
        rfid: editItem.rfid || '',
      });
    } else {
      formik.resetForm();
    }
  }, [editItem]);

  const handleOpenAddModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const normalizeBulkRow = (row) => {
    const entries = Object.entries(row || {}).reduce((acc, [key, value]) => {
      acc[key.toLowerCase().trim()] = value;
      return acc;
    }, {});

    const pick = (...keys) => {
      for (const key of keys) {
        if (entries[key] !== undefined && entries[key] !== null && String(entries[key]).trim() !== '') {
          return entries[key];
        }
      }
      return '';
    };

    return {
      name: String(pick('name', 'product name', 'item name')).trim(),
      category: String(pick('category', 'product category', 'group')).trim() || 'Clothing',
      stock: Number(pick('stock', 'qty', 'quantity', 'initial stock') || 0),
      price: Number(pick('price', 'unit price', 'mrp', 'rate') || 0),
      brand: String(pick('brand', 'company', 'manufacturer', 'make')).trim(),
      size: String(pick('size', 'dimension', 'fit')).trim(),
      targetGender: String(pick('gender', 'target', 'category')).trim(),
      rfid: String(pick('rfid', 'rfid tag', 'tag', 'tag code')).trim(),
    };
  };

  const handleBulkFile = async (file) => {
    setBulkResult(null);
    setBulkErrors([]);
    setBulkFileName(file?.name || '');
    setBulkPreviewRows([]);

    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      setBulkErrors(['No sheet was found in the Excel file.']);
      return;
    }

    const rows = utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    const mapped = rows.map(normalizeBulkRow).filter((row) => row.name || row.category || row.stock || row.price || row.rfid);

    if (!mapped.length) {
      setBulkErrors(['No valid product rows were found in the Excel file.']);
      return;
    }

    const validationErrors = [];
    mapped.forEach((row, index) => {
      if (!row.name || !row.category || Number.isNaN(row.stock) || Number.isNaN(row.price)) {
        validationErrors.push(`Row ${index + 2}: Name, Category, Stock, and Price are required.`);
      }
    });

    setBulkPreviewRows(mapped);
    setBulkErrors(validationErrors);
  };

  const uploadBulkExcel = async () => {
    if (!bulkPreviewRows.length) {
      setBulkErrors(['There are no rows available for upload.']);
      return;
    }

    setBulkUploading(true);
    setBulkResult(null);
    try {
      const response = await api.bulkCreateInventory({
        items: bulkPreviewRows,
      });

      setBulkResult(response);
      await dispatch(fetchInventory());
      setBulkPreviewRows([]);
      setBulkFileName('');
    } catch (error) {
      setBulkErrors([error.message || 'Bulk upload failed.']);
    } finally {
      setBulkUploading(false);
    }
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkFileName('');
    setBulkPreviewRows([]);
    setBulkErrors([]);
    setBulkResult(null);
  };

  useEffect(() => {
    let active = true;

    const loadProductRfids = async () => {
      if (!expandedId) {
        setRfidRows([]);
        setRfidSummary(null);
        setRfidError('');
        setRfidMessage('');
        return;
      }

      const product = items.find((item) => item.id === expandedId);
      if (!product) return;

      setRfidLoading(true);
      setRfidError('');
      setRfidMessage('');

      try {
        const existingTags = await api.getRfidTagsByProduct(product.id);
        if (!active) return;

        const existingByIndex = Array.isArray(existingTags) ? existingTags : [];
        const totalPieces = Number(product.stock || 0);
        const generatedRows = Array.from({ length: totalPieces }, (_, index) => ({
          pieceNo: index + 1,
          tagCode: existingByIndex[index]?.tagCode || '',
          isAssigned: existingByIndex[index]?.isAssigned ?? true,
          remarks: existingByIndex[index]?.remarks || '',
        }));

        setRfidRows(generatedRows);
        setRfidSummary({
          productName: product.name,
          sku: product.id,
          totalPieces,
          filledCount: generatedRows.filter((row) => row.tagCode.trim()).length,
        });
      } catch (error) {
        if (!active) return;
        setRfidError(error.message || 'The RFID list could not be loaded.');
        setRfidRows([]);
      } finally {
        if (active) setRfidLoading(false);
      }
    };

    loadProductRfids();

    return () => {
      active = false;
    };
  }, [expandedId, items]);

  const updateRfidRow = (pieceNo, field, value) => {
    setRfidRows((current) => current.map((row) => (row.pieceNo === pieceNo ? { ...row, [field]: value } : row)));
  };

  const saveRfidRows = async () => {
    if (!expandedId) return;

    setRfidSaving(true);
    setRfidError('');

    try {
      const response = await api.bulkUpsertRfidTagsByProduct(expandedId, {
        items: rfidRows.map((row) => ({
          tagCode: row.tagCode,
          isAssigned: row.isAssigned,
          remarks: row.remarks,
        })),
      });

      setRfidSummary((current) => current ? { ...current, filledCount: rfidRows.filter((row) => row.tagCode.trim()).length } : current);
      setRfidMessage(`Saved: ${response.updated} updated, ${response.created} created.`);
      setRfidError('');
      await dispatch(fetchInventory());
    } catch (error) {
      setRfidMessage('');
      setRfidError(error.message || 'RFID tags could not be saved.');
    } finally {
      setRfidSaving(false);
    }
  };

  const openRestockModal = (item) => {
    setRestockItem(item);
    setRestockQuantity(1);
    setRestockError('');
  };

  const closeRestockModal = () => {
    setRestockItem(null);
    setRestockQuantity(1);
    setRestockError('');
  };

  const saveRestock = async () => {
    if (!restockItem) return;

    const quantity = Number(restockQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setRestockError('Enter a valid quantity greater than zero.');
      return;
    }

    setRestockSaving(true);
    setRestockError('');

    try {
      await api.restockInventory(restockItem.id, { quantity });
      await dispatch(fetchInventory());
      closeRestockModal();
    } catch (error) {
      setRestockError(error.message || 'Restock failed.');
    } finally {
      setRestockSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[13px] font-bold text-gray-900 dark:text-white">Product Catalog</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors shadow-sm dark:border-brand-900/40 dark:bg-gray-800 dark:text-brand-300"
          >
            Bulk Excel Upload
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800 overflow-hidden">
        <div className="flex flex-col border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
          <div className="relative max-w-sm flex-1 mb-4 sm:mb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-all">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">SKU</th>
                <th className="px-4 py-2.5 font-medium">Product Name</th>
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Size</th>
                <th className="px-4 py-2.5 font-medium">Gender</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(loading ? [] : filteredItems).map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-4 py-2.5 font-medium text-brand-600 dark:text-brand-400">#{item.id}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-900 dark:text-white font-black uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{item.brand || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {item.size || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase border ${
                        item.gender === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        item.gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {item.gender || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-black text-lg ${item.stock < 20 ? 'text-brand-600' : 'text-gray-900 dark:text-white'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          RFID List
                        </button>
                        <button
                          onClick={() => openRestockModal(item)}
                          className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/20"
                        >
                          Restock
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(item)} 
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => dispatch(deleteInventory(item.id))} className="text-red-500 hover:text-red-600">
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded details (Accordion) */}
                  {expandedId === item.id && (
                    <tr>
                      <td colSpan="7" className="bg-gray-50/50 p-0 dark:bg-gray-800/30">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Batch Summary</h4>
                            <div className="rounded-xl bg-white p-4 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                              <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <div>SKU: {item.id}</div>
                                <div>Category: {item.category}</div>
                                <div>Stock/Batches: {item.stock}</div>
                                <div>RFIDs filled: {rfidSummary?.filledCount ?? 0}/{rfidSummary?.totalPieces ?? item.stock}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 justify-end">
                            <div className="rounded-xl bg-white p-4 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Instructions</p>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Enter an RFID number for every piece. Example: if there are 1000 jeans, 1000 rows will appear.</p>
                            </div>
                            <div className="flex justify-end gap-3">
                              <button onClick={saveRfidRows} disabled={rfidSaving || rfidLoading} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {rfidSaving ? 'Saving...' : 'Save RFIDs'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-4">
                          {rfidMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-300">{rfidMessage}</div> : null}
                          {rfidError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">{rfidError}</div> : null}
                          {rfidLoading ? (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">Loading RFID rows...</div>
                          ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                              <div className="max-h-[540px] overflow-auto">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                  <thead className="sticky top-0 bg-gray-50 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                    <tr>
                                      <th className="px-4 py-3 font-medium">Piece #</th>
                                      <th className="px-4 py-3 font-medium">RFID Number</th>
                                      <th className="px-4 py-3 font-medium">Assigned</th>
                                      <th className="px-4 py-3 font-medium">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {rfidRows.map((row) => (
                                      <tr key={row.pieceNo} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.pieceNo}</td>
                                        <td className="px-4 py-3">
                                          <input
                                            value={row.tagCode}
                                            onChange={(e) => updateRfidRow(row.pieceNo, 'tagCode', e.target.value)}
                                            placeholder={`E280... piece ${row.pieceNo}`}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                          />
                                        </td>
                                        <td className="px-4 py-3">
                                          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <input
                                              type="checkbox"
                                              checked={row.isAssigned}
                                              onChange={(e) => updateRfidRow(row.pieceNo, 'isAssigned', e.target.checked)}
                                              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            Yes
                                          </label>
                                        </td>
                                        <td className="px-4 py-3">
                                          <input
                                            value={row.remarks}
                                            onChange={(e) => updateRfidRow(row.pieceNo, 'remarks', e.target.value)}
                                            placeholder="Optional note"
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                    {rfidRows.length === 0 ? (
                                      <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No RFID rows are available for this product.</td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-sm text-gray-500">Showing 1 to 10 of 15 results</p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400" disabled>Previous</button>
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{editItem ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditItem(null); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Product Name *</label>
                  <input {...formik.getFieldProps('name')} type="text" placeholder="e.g. Cotton Premium Shirt" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  {formik.touched.name && formik.errors.name ? <div className="text-[10px] font-bold text-brand-600 mt-1 uppercase tracking-widest">{formik.errors.name}</div> : null}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Company / Brand *</label>
                  <input {...formik.getFieldProps('brand')} type="text" placeholder="e.g. Zudio, Zara" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  {formik.touched.brand && formik.errors.brand ? <div className="text-[10px] font-bold text-brand-600 mt-1 uppercase tracking-widest">{formik.errors.brand}</div> : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                  <select {...formik.getFieldProps('category')} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    <option>Clothing</option>
                    <option>Electronics</option>
                    <option>Accessories</option>
                    <option>Footwear</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Size</label>
                  <select {...formik.getFieldProps('size')} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    <option>XS</option>
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>XXL</option>
                    <option>Free Size</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Gender</label>
                  <select {...formik.getFieldProps('gender')} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Kids</option>
                    <option>Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Initial Stock</label>
                  <input {...formik.getFieldProps('stock')} type="number" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black text-gray-400 uppercase tracking-widest">Selling Price (₹)</label>
                  <input {...formik.getFieldProps('price')} type="number" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-900/50 dark:bg-brand-900/10 transition-colors hover:bg-brand-50">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400 mb-3">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300">Scan RFID Tag Now</h3>
                <p className="mt-1 text-xs text-brand-600/80 dark:text-brand-400">Waiting for hardware input to auto-fill details...</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => { setIsModalOpen(false); setEditItem(null); }} className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => formik.handleSubmit()} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 shadow-sm transition-all active:scale-[0.98]">
                {editItem ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Bulk Excel Upload</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use these Excel columns: name, category, stock, price, rfid. The first sheet will be used.</p>
              </div>
              <button onClick={closeBulkModal} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-900/10">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Excel file</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleBulkFile(e.target.files?.[0])}
                    className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Template: row 1 should contain the header. Example: Premium Shirt, Clothing, 20, 1499, RFID-1001</p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">File</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{bulkFileName || 'No file selected'}</p>
                </div>

                {bulkErrors.length > 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">
                    <p className="font-semibold">Validation issues</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {bulkErrors.map((error, index) => <li key={index}>{error}</li>)}
                    </ul>
                  </div>
                ) : null}

                {bulkResult ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-300">
                    <p className="font-semibold">Upload completed</p>
                    <p className="mt-1">Created: {bulkResult.createdCount}, Skipped: {bulkResult.skippedCount}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Preview Rows</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{bulkPreviewRows.length} rows</span>
                </div>
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Stock</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">RFID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {bulkPreviewRows.length ? bulkPreviewRows.map((row, index) => (
                        <tr key={`${row.name}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.category}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.stock}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">₹{Number(row.price || 0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.rfid || '-'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">A preview will appear here after upload.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button onClick={closeBulkModal} className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={uploadBulkExcel}
                disabled={bulkUploading || !bulkPreviewRows.length}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkUploading ? 'Uploading...' : 'Upload Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {restockItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Restock Product</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add more quantity to an existing item. This will increase the current stock.</p>
              </div>
              <button onClick={closeRestockModal} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{restockItem.name}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">SKU: {restockItem.id} · Current stock: {restockItem.stock}</p>
              </div>

              {restockError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">{restockError}</div> : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to add</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button onClick={closeRestockModal} className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={saveRestock} disabled={restockSaving} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]">
                {restockSaving ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
