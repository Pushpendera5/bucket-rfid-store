import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Shield, Key, UserCheck, UserX, Edit, Trash2, Plus, Mail, MoreHorizontal, Check, X } from 'lucide-react';

const toast = {
  error: (msg) => alert('Error: ' + msg),
  success: (msg) => alert('Success: ' + msg)
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true
  });
  
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);
      setUsers(userData);
      setRoles(roleData);
    } catch (err) {
      toast.error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        email: user.email || '',
        password: '',
        roleId: user.roleId,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        password: '',
        roleId: roles[0]?.id || '',
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        toast.success('User updated successfully');
      } else {
        await api.createUser(formData);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.toggleUserStatus(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.resetUserPassword(editingUser.id, { newPassword });
      toast.success('Password reset successfully');
      setResetModalOpen(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        toast.success('User deleted');
        fetchData();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[13px] font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage system users, roles and access permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all"
        >
          <Plus size={18} />
          Create New User
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider">User</th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider">Role</th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600"></div>
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{user.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-tight
                      ${user.roleName === 'Administrator' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 
                        user.roleName === 'Manager' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}
                    `}>
                      <Shield size={12} />
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-tight transition-colors
                        ${user.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'}
                      `}
                    >
                      {user.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      {user.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => { setEditingUser(user); setResetModalOpen(true); }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-800 transition-colors"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Edit System User' : 'Create New User'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                  <input 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="e.g. pushpendra_admin"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                  <input 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Pushpendra Singh"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="pushpendra@wayinfotech.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                  <select 
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Password {editingUser && '(Leave blank to keep same)'}</label>
                  <input 
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Account is Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-md transition-all active:scale-95"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="text-amber-500" />
                Reset Password
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-sm">
                Changing password for <strong>{editingUser?.fullName}</strong>. They will need to use this new password for their next login.
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-amber-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-amber-700 shadow-md transition-all active:scale-95"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
