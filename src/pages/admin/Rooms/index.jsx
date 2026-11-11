import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, X, BedDouble, CheckCircle2, AlertTriangle, Search, Filter, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { roomsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

const emptyForm = {
  name: '', type: 'Standard', base_price: 1000, capacity: 2,
  availability_status: 'available', image_url: '', description: '', amenities: '',
};

export default function Rooms() {
  const { currencySymbol, formatPrice } = useSettings();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const fileInputRef = useRef(null);
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // all | available | maintenance
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, image_url: optimizedBase64 }));
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const fetchRooms = () => {
    setLoading(true);
    roomsApi.list()
      .then(data => setRooms(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await roomsApi.delete(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleToggleStatus = async (room, newStatus) => {
    setTogglingId(room.id);
    try {
      const updated = await roomsApi.update(room.id, { availability_status: newStatus });
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, availability_status: newStatus } : r));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({ ...emptyForm });
    setUseUrl(false);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || '',
      type: room.type || 'Standard',
      base_price: room.base_price || 1000,
      capacity: room.capacity || 2,
      availability_status: room.availability_status || 'available',
      image_url: room.image_url || '',
      description: room.description || '',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || ''),
    });
    setUseUrl(false);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        current_price: parseFloat(formData.base_price),
        capacity: parseInt(formData.capacity),
        amenities: JSON.stringify(formData.amenities.split(',').map(s => s.trim()).filter(Boolean)),
      };
      if (editingRoom) {
        const updated = await roomsApi.update(editingRoom.id, payload);
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? updated : r));
      } else {
        const created = await roomsApi.create(payload);
        setRooms(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save room.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalCount = rooms.length;
  const availableCount = rooms.filter(r => r.availability_status === 'available').length;
  const cleaningCount = rooms.filter(r => r.availability_status === 'needs_cleaning').length;
  const maintenanceCount = rooms.filter(r => r.availability_status === 'maintenance').length;

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (statusFilter === 'available' && r.availability_status !== 'available') return false;
      if (statusFilter === 'needs_cleaning' && r.availability_status !== 'needs_cleaning') return false;
      if (statusFilter === 'maintenance' && r.availability_status !== 'maintenance') return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchType = r.type?.toLowerCase().includes(q);
        if (!matchName && !matchType) return false;
      }
      return true;
    });
  }, [rooms, statusFilter, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BedDouble className="text-blue-600" size={26} />
            Room Management & Housekeeping
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage hotel rooms, monitor real-time room availability, and turnover rooms for Housekeeping.
          </p>
        </div>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm">
          <Plus size={18} /> Add Room
        </button>
      </div>

      {/* KPI Cards for Room Availability & Housekeeping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Rooms</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BedDouble size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Available Rooms</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{availableCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Clean & ready for guests</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Needs Cleaning</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{cleaningCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Checked-out / Housekeeping</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Maintenance</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{maintenanceCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Under repair / blocked</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Rooms ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            Available ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('needs_cleaning')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              statusFilter === 'needs_cleaning'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300"></span>
            Needs Cleaning ({cleaningCount})
          </button>
          <button
            onClick={() => setStatusFilter('maintenance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              statusFilter === 'maintenance'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300"></span>
            Maintenance ({maintenanceCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search room name or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading rooms...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4">Room Details</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Price / Night</th>
                  <th className="p-4">Availability Status</th>
                  <th className="p-4 text-center">Quick Toggle</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRooms.map(room => {
                  const isAvail = room.availability_status === 'available';
                  const isUpdating = togglingId === room.id;

                  return (
                    <tr key={room.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={room.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400'}
                            alt={room.name}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{room.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">{room.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {room.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">{room.capacity} guests</td>
                      <td className="p-4 font-bold text-gray-900">{formatPrice(room.current_price)}</td>
                      
                      {/* Status Badge */}
                      <td className="p-4">
                        {room.availability_status === 'available' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            AVAILABLE
                          </span>
                        )}
                        {room.availability_status === 'needs_cleaning' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Sparkles size={12} className="text-amber-600" />
                            NEEDS CLEANING
                          </span>
                        )}
                        {room.availability_status === 'maintenance' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            MAINTENANCE
                          </span>
                        )}
                        {!['available', 'needs_cleaning', 'maintenance'].includes(room.availability_status) && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                            {room.availability_status?.toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Quick Housekeeping & Status Action */}
                      <td className="p-4 text-center">
                        {room.availability_status === 'needs_cleaning' ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(room, 'available')}
                            className="text-xs px-3.5 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 mx-auto disabled:opacity-50"
                            title="Mark room as cleaned and ready for guests"
                          >
                            <Sparkles size={13} />
                            {isUpdating ? 'Updating...' : 'Mark Cleaned'}
                          </button>
                        ) : room.availability_status === 'available' ? (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleToggleStatus(room, 'needs_cleaning')}
                              className="text-[11px] px-2 py-1 rounded font-semibold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all disabled:opacity-50"
                              title="Turn over to housekeeping"
                            >
                              Needs Cleaning
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleToggleStatus(room, 'maintenance')}
                              className="text-[11px] px-2 py-1 rounded font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
                              title="Set under maintenance"
                            >
                              Maintenance
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(room, 'available')}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50"
                            title="Restore room to available"
                          >
                            {isUpdating ? 'Updating...' : 'Set to Available'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEditModal(room)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors" title="Edit room details">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(room.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete room">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      No rooms found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  placeholder="e.g. Deluxe Ocean View 201"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  placeholder="Cozy, spacious room with modern amenities..."
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Room Image - Local Device Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Room Photo</label>
                  <button
                    type="button"
                    onClick={() => setUseUrl(!useUrl)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    {useUrl ? '← Upload from this device' : 'Or paste web image URL'}
                  </button>
                </div>

                {!useUrl ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {formData.image_url ? (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-3 flex items-center gap-4">
                        <img
                          src={formData.image_url}
                          alt="Room preview"
                          className="w-24 h-20 rounded-lg object-cover border border-gray-300 shadow-xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800">Photo Selected</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">Ready to be saved for this room.</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-md shadow-xs transition-colors"
                            >
                              Change Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image_url: '' })}
                              className="px-2.5 py-1 text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-semibold rounded-md transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer bg-gray-50 hover:bg-blue-50/40 transition-all group"
                      >
                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-bold text-gray-800">
                          Click to choose a photo from your computer/device
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Supports PNG, JPG, JPEG, WEBP
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {formData.image_url && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <img src={formData.image_url} alt="Preview" className="w-14 h-12 rounded object-cover border" />
                        <span className="text-xs text-gray-500">Image URL Preview</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    {['Standard', 'Deluxe', 'Suite'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status</label>
                  <select value={formData.availability_status} onChange={e => setFormData({ ...formData, availability_status: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-medium">
                    <option value="available">🟢 Available for Booking</option>
                    <option value="needs_cleaning">🧹 Needs Cleaning / Housekeeping</option>
                    <option value="maintenance">🔴 Maintenance / Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night ({currencySymbol})</label>
                  <input type="number" min="0" required value={formData.base_price}
                    onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (guests)</label>
                  <input type="number" min="1" max="20" required value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                <input type="text" placeholder="Free Wi-Fi, Air Conditioning, TV, Hot Shower"
                  value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-60 transition-colors shadow-sm">
                  {saving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Add Room'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-800 py-2.5 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">
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
