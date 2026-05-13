import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Shield, Plus, Edit, Trash2, X, CheckCircle, Users, CheckSquare, Square } from 'lucide-react';

const toast = {
  error: (msg) => alert('Error: ' + msg),
  success: (msg) => alert('Success: ' + msg)
};

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Live charts and business summary' },
  { id: 'inventory', name: 'Inventory / Products', desc: 'Manage catalog and stock' },
  { id: 'suppliers', name: 'Suppliers', desc: 'Manage vendor details' },
  { id: 'pos', name: 'Point of Sale (Billing)', desc: 'Checkout and billing counter' },
  { id: 'po', name: 'Purchase Orders', desc: 'Create and manage POs' },
  { id: 'grn', name: 'Goods Receiving (GRN)', desc: 'Process inward goods' },
  { id: 'reports', name: 'Business Reports', desc: 'View sales and inventory insights' },
  { id: 'administration', name: 'Administration', desc: 'Manage users and roles (Critical)' },
];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.getRoles();
      setRoles(data.map(r => ({
        ...r,
        permissions: r.permissionsJson ? JSON.parse(r.permissionsJson) : []
      })));
    } catch (err) {
      toast.error('Failed to load roles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: ['dashboard'] // Default
      });
    }
    setModalOpen(true);
  };

  const togglePermission = (moduleId) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(moduleId)
        ? prev.permissions.filter(id => id !== moduleId)
        : [...prev.permissions, moduleId];
      return { ...prev, permissions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      permissionsJson: JSON.stringify(formData.permissions)
    };
    
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, payload);
        toast.success('Role updated successfully');
      } else {
        await api.createRole(payload);
        toast.success('Role created successfully');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role? It can only be deleted if no users are assigned to it.')) {
      try {
        await api.deleteRole(id);
        toast.success('Role deleted');
        fetchRoles();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[13px] font-bold text-gray-900 dark:text-white">Role Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Define system access levels and specific module permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all"
        >
          <Plus size={18} />
          Create New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
          ))
        ) : roles.map((role) => (
          <div key={role.id} className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <Shield size={15} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenModal(role)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">{role.name}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                {role.description || 'No description provided for this role.'}
              </p>
            </div>

            <div className="mt-4 space-y-2">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module Access</p>
               <div className="flex flex-wrap gap-1">
                 {role.permissions.map(p => (
                   <span key={p} className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded capitalize">
                     {p}
                   </span>
                 ))}
               </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Users size={14} />
                {role.userCount} Users
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                <CheckCircle size={10} />
                Active
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {editingRole ? 'Edit Role & Permissions' : 'Create New Role'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Sales Manager"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <input 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Role responsibilities..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MODULES.map(module => (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => togglePermission(module.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        formData.permissions.includes(module.id)
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/20'
                          : 'border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-800/30'
                      }`}
                    >
                      {formData.permissions.includes(module.id) ? (
                        <CheckSquare className="mt-0.5 shrink-0 text-brand-600" size={18} />
                      ) : (
                        <Square className="mt-0.5 shrink-0 text-gray-300" size={18} />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{module.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{module.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-md transition-all active:scale-95"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
