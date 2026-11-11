import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { usersApi } from '../../../services/api';

const emptyForm = { first_name: '', last_name: '', email: '', password: '', role: 'admin', is_active: true };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    usersApi.list()
      .then(data => setUsers(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', password: '', role: user.role || 'admin', is_active: user.is_active });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (editingUser) {
        const updated = await usersApi.update(editingUser.id, payload);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
      } else {
        const created = await usersApi.create(payload);
        setUsers(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role) => {
    const map = { staff: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700', customer: 'bg-gray-100 text-gray-700' };
    return map[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {(user.name || user.first_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.name || `${user.first_name} ${user.last_name}`}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{user.created_at?.split('T')[0]}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[['first_name', 'First Name'], ['last_name', 'Last Name']].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="text" required value={formData[k]}
                      onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input type="password" required={!editingUser} minLength={editingUser ? 0 : 6}
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg">
                    {['admin', 'staff'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Add User'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
