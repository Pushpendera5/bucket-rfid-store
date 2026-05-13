import store from '../redux/store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;

  try {
    const state = store.getState();
    const token = state.auth?.token;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...options,
    });
  } catch (error) {
    throw new Error('Unable to connect to the server. Check whether the backend is running and the frontend origin is allowed.');
  }

  if (!response.ok) {
    let message = '';
    try {
      const text = await response.text();
      console.error(`API Error ${response.status}:`, text);
      try {
        const data = JSON.parse(text);
        message = data.message || JSON.stringify(data);
      } catch {
        message = text;
      }
    } catch {
      message = `Request failed with status ${response.status}`;
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboardOverview: () => request('/dashboard/overview'),
  getInventory: () => request('/inventory'),
  createInventory: (payload) => request('/inventory', { method: 'POST', body: JSON.stringify(payload) }),
  restockInventory: (id, payload) => request(`/inventory/${id}/restock`, { method: 'PUT', body: JSON.stringify(payload) }),
  bulkCreateInventory: (payload) => request('/inventory/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  updateInventory: (id, payload) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteInventory: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  getVendors: () => request('/suppliers'),
  createVendor: (payload) => request('/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  deleteVendor: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  checkoutSale: (payload) => request('/sales-orders/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getRfidTagsByProduct: (productId) => request(`/rfid-tags/product/${productId}`),
  bulkUpsertRfidTagsByProduct: (productId, payload) => request(`/rfid-tags/product/${productId}/bulk`, { method: 'POST', body: JSON.stringify(payload) }),
  lookupRfidTag: (tagCode) => request(`/rfid-tags/lookup/${encodeURIComponent(tagCode)}`),
  postFx9600Scan: (payload) => request('/rfid-reader/fx9600/scans', { method: 'POST', body: JSON.stringify(payload) }),
  getFx9600RecentScans: (limit = 10) => request(`/rfid-reader/fx9600/scans/recent?limit=${encodeURIComponent(limit)}`),
  triggerFx9600ReadLlrp: (timeoutMs = 10000) => request(`/rfid-reader/fx9600/read-llrp?timeoutMs=${encodeURIComponent(timeoutMs)}`, { method: 'POST' }),
  lookupSalesReturn: (orderNumber) => request(`/sales-returns/lookup/${encodeURIComponent(orderNumber)}`),
  processSalesReturn: (payload) => request('/sales-returns/process', { method: 'POST', body: JSON.stringify(payload) }),
  getPurchaseOrders: () => request('/purchase-orders'),
  createPurchaseOrder: (payload) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }),
  getPurchaseOrderById: (id) => request(`/purchase-orders/${id}`),
  getGoodsReceipts: () => request('/goods-receipts'),
  createGoodsReceipt: (payload) => request('/goods-receipts', { method: 'POST', body: JSON.stringify(payload) }),
  getSalesReport: (params) => request(`/reports/sales?${new URLSearchParams(params)}`),
  getInventoryReport: (params) => request(`/reports/inventory?${new URLSearchParams(params)}`),
  getBrandReport: (params) => request(`/reports/brands?${new URLSearchParams(params)}`),
  getGenderReport: (params) => request(`/reports/gender?${new URLSearchParams(params)}`),
  getPurchaseReport: (params) => request(`/reports/purchases?${new URLSearchParams(params)}`),
  getReportSummary: (params) => request(`/reports/summary?${new URLSearchParams(params)}`),
  
  // Users & Roles
  getUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id) => request(`/users/${id}/toggle-status`, { method: 'PATCH' }),
  resetUserPassword: (id, payload) => request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(payload) }),
  getRoles: () => request('/roles'),
  createRole: (payload) => request('/roles', { method: 'POST', body: JSON.stringify(payload) }),
  updateRole: (id, payload) => request(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRole: (id) => request(`/roles/${id}`, { method: 'DELETE' }),
};

export default api;