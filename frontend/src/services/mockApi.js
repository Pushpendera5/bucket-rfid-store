// Simple in-memory mock API with delay to simulate server
const delay = (ms = 500) => new Promise((res) => setTimeout(res, ms));

const db = {
  inventory: Array.from({ length: 12 }).map((_, i) => ({
    id: `ITM-2024-${1000 + i}`,
    name: `Premium Product ${i + 1}`,
    category: i % 3 === 0 ? 'Electronics' : i % 2 === 0 ? 'Clothing' : 'Accessories',
    stock: Math.floor(Math.random() * 100),
    price: Number((Math.random() * 500).toFixed(2)),
    rfid: `E2801160${(1000 + i).toString().padStart(8, '0')}`,
  })),
  vendors: [
    { id: 'VND-100', name: 'Global Tech Suppliers Inc.', contact: 'sales@globaltech.com' },
    { id: 'VND-101', name: 'Fashion Wholesale Co.', contact: 'contact@fashionwh.com' },
  ],
};

export const mockApi = {
  getInventory: async () => {
    await delay(400);
    return JSON.parse(JSON.stringify(db.inventory));
  },
  createInventory: async (item) => {
    await delay(300);
    const newItem = { ...item, id: item.id || `ITM-2024-${Date.now()}` };
    db.inventory.unshift(newItem);
    return JSON.parse(JSON.stringify(newItem));
  },
  updateInventory: async (id, patch) => {
    await delay(300);
    const idx = db.inventory.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Not found');
    db.inventory[idx] = { ...db.inventory[idx], ...patch };
    return JSON.parse(JSON.stringify(db.inventory[idx]));
  },
  deleteInventory: async (id) => {
    await delay(250);
    db.inventory = db.inventory.filter((i) => i.id !== id);
    return { success: true };
  },
  bulkUploadInventory: async (items) => {
    await delay(600);
    const created = items.map((it) => ({ ...it, id: `ITM-2024-${Date.now() + Math.random()}` }));
    db.inventory = [...created, ...db.inventory];
    return JSON.parse(JSON.stringify(created));
  },

  getVendors: async () => {
    await delay(300);
    return JSON.parse(JSON.stringify(db.vendors));
  },
  createVendor: async (v) => {
    await delay(250);
    const newV = { ...v, id: v.id || `VND-${Date.now()}` };
    db.vendors.push(newV);
    return JSON.parse(JSON.stringify(newV));
  },
  updateVendor: async (id, patch) => {
    await delay(250);
    const idx = db.vendors.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Not found');
    db.vendors[idx] = { ...db.vendors[idx], ...patch };
    return JSON.parse(JSON.stringify(db.vendors[idx]));
  },
  deleteVendor: async (id) => {
    await delay(200);
    db.vendors = db.vendors.filter((v) => v.id !== id);
    return { success: true };
  },
};

export default mockApi;
