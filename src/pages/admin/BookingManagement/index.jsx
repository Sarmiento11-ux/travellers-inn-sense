import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Eye, X, Check, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, FileText, UserCheck, CreditCard } from 'lucide-react';
import { bookingsApi } from '../../../services/api';
import ReceiptModal from '../../../components/common/ReceiptModal';
import { useSettings } from '../../../context/SettingsContext';

const POLL_INTERVAL_MS = 10000; // auto-refresh every 10 seconds

export default function BookingManagement() {
  const { formatPrice } = useSettings();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewItem, setViewItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');

  // Checkout & Check-In flow states
  const [checkoutStep, setCheckoutStep] = useState('default'); // 'default' | 'confirm_checkin' | 'confirm_complete'

  // E-Receipt / Voucher Pass Modal
  const [receiptModalItem, setReceiptModalItem] = useState(null);

  // Delete Confirmation Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const intervalRef = useRef(null);

  // Silent background refresh (no loading spinner flicker)
  const silentRefresh = useCallback(() => {
    bookingsApi.adminAll()
      .then(data => {
        setBookings(prev => {
          // Only update state if data actually changed (avoids re-renders)
          const newJson = JSON.stringify(data);
          const oldJson = JSON.stringify(prev);
          if (newJson !== oldJson) {
            // Sync open detail modal if its booking was updated
            if (data) {
              setViewItem(vi => vi ? (data.find(b => b.id === vi.id) || vi) : null);
            }
            return data || [];
          }
          return prev;
        });
        setLastUpdated(new Date());
      })
      .catch(() => {}); // silent — don't show error on background poll
  }, []);

  // Initial load
  const fetchBookings = useCallback(() => {
    setLoading(true);
    bookingsApi.adminAll()
      .then(data => {
        setBookings(data || []);
        setLastUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Manual refresh button
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await bookingsApi.adminAll();
      setBookings(data || []);
      setLastUpdated(new Date());
      if (data && viewItem) {
        const updated = data.find(b => b.id === viewItem.id);
        if (updated) setViewItem(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Start polling
    intervalRef.current = setInterval(silentRefresh, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current); // cleanup on unmount
  }, [fetchBookings, silentRefresh]);

  const filtered = bookings.filter(b => {
    const matchSearch = (b.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.booking_reference || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.room_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || b.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const updateStatus = async (id, status, paymentStatus = undefined) => {
    setActionLoading(id + status);
    setActionError('');
    try {
      const updated = await bookingsApi.updateStatus(id, status, paymentStatus);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      if (viewItem?.id === id) setViewItem(updated);
      setCheckoutStep('default');
    } catch (err) {
      setActionError(err.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePayment = async (id, paymentStatus) => {
    setActionLoading(id + 'pay');
    setActionError('');
    try {
      const updated = await bookingsApi.updatePayment(id, paymentStatus);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      if (viewItem?.id === id) setViewItem(updated);
    } catch (err) {
      setActionError(err.message || 'Failed to update payment status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmItem) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await bookingsApi.delete(deleteConfirmItem.id);
      setBookings(prev => prev.filter(b => b.id !== deleteConfirmItem.id));
      if (viewItem?.id === deleteConfirmItem.id) setViewItem(null);
      setDeleteConfirmItem(null);
    } catch (err) {
      setActionError(err.message || 'Failed to delete booking.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusBadge = (s) => {
    const map = {
      confirmed: 'bg-green-100 text-green-700',
      checked_in: 'bg-indigo-100 text-indigo-700 font-bold border border-indigo-200',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return map[s?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checked_in: bookings.filter(b => b.status === 'checked_in').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated: {lastUpdated.toLocaleTimeString()} &nbsp;·&nbsp; Auto-refreshes every 10s
            </p>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          ['Total', counts.all, 'blue'],
          ['Confirmed', counts.confirmed, 'green'],
          ['In-House Stay', counts.checked_in, 'indigo'],
          ['Completed', counts.completed, 'emerald'],
          ['Cancelled', counts.cancelled, 'red']
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
            <div className={`text-2xl font-bold text-${color}-600`}>{val}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search guest, room, reference..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
          {['All', 'Confirmed', 'Checked_In', 'Completed', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s === 'Checked_In' ? 'Checked In (In-House)' : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading bookings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                  <th className="p-4 font-medium">Reference</th>
                  <th className="p-4 font-medium">Guest</th>
                  <th className="p-4 font-medium">Room</th>
                  <th className="p-4 font-medium">Check-in</th>
                  <th className="p-4 font-medium">Check-out</th>
                  <th className="p-4 font-medium">Amount & Payment</th>
                  <th className="p-4 font-medium">Stay Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm text-gray-700">{b.booking_reference}</td>
                    <td className="p-4 font-medium text-gray-800">{b.guest_name || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{b.room_name || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{b.check_in}</td>
                    <td className="p-4 text-gray-600">{b.check_out}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 text-sm">{formatPrice(b.booking_amount)}</div>
                      <span className={`inline-block text-[10px] font-bold mt-0.5 px-1.5 py-0.2 rounded ${
                        (b.payment_status || '').toLowerCase() === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {(b.payment_status || '').toLowerCase() === 'paid' ? 'PAID' : 'UNPAID'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                        {b.status === 'checked_in' ? 'IN-HOUSE' : b.status?.toUpperCase()}
                      </span>
                      {b.status === 'confirmed' && (
                        <span className="block text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 text-center whitespace-nowrap">
                          Arrival / Check-in
                        </span>
                      )}
                      {b.status === 'checked_in' && (
                        getTodayStr() >= b.check_out ? (
                          <span className="block text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 text-center whitespace-nowrap">
                            Ready for Checkout
                          </span>
                        ) : (
                          <span className="block text-[10px] text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-1 text-center whitespace-nowrap">
                            In-House Stay
                          </span>
                        )
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => setReceiptModalItem(b)}
                        className="text-gray-400 hover:text-amber-600 p-1 rounded hover:bg-amber-50 transition-colors"
                        title="View E-Receipt / Voucher Pass"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => { setViewItem(b); setCheckoutStep('default'); setActionError(''); }}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setDeleteConfirmItem(b); setActionError(''); }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          Showing {filtered.length} of {bookings.length} bookings
        </div>
      </div>

      {/* Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold">Booking Details</h2>
              <button onClick={() => setViewItem(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ['Reference', viewItem.booking_reference, 'font-mono'],
                ['Guest', viewItem.guest_name],
                ['Room', viewItem.room_name],
                ['Check-in', viewItem.check_in],
                ['Check-out', viewItem.check_out],
                ['Guests', viewItem.number_of_guests],
                ['Amount', formatPrice(viewItem.booking_amount)],
                ['Booked on', viewItem.created_at?.split('T')[0]],
              ].map(([k, v, cls]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-medium text-gray-800 ${cls || ''}`}>{v || 'N/A'}</span>
                </div>
              ))}
              {/* Payment Status & Quick Toggle */}
              <div className="flex justify-between items-center py-1 px-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block">Payment Method</span>
                  <span className="text-xs font-bold text-gray-800">{viewItem.payment_method || 'Pay at Front Desk'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    (viewItem.payment_status || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {(viewItem.payment_status || '').toLowerCase() === 'paid' ? 'PAID' : 'UNPAID'}
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading === viewItem.id + 'pay'}
                    onClick={() => handleUpdatePayment(viewItem.id, (viewItem.payment_status || '').toLowerCase() === 'paid' ? 'unpaid' : 'paid')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                  >
                    {(viewItem.payment_status || '').toLowerCase() === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </button>
                </div>
              </div>

              {/* View / Print Official Pass Voucher */}
              <button
                type="button"
                onClick={() => setReceiptModalItem(viewItem)}
                className="w-full py-2 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileText size={15} className="text-amber-600" />
                View / Print E-Receipt & Pass
              </button>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Stay Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(viewItem.status)}`}>
                  {viewItem.status === 'checked_in' ? 'IN-HOUSE GUEST' : viewItem.status?.toUpperCase()}
                </span>
              </div>
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* FRONT DESK CHECK-IN WORKFLOW (When Confirmed / Reserved) */}
              {viewItem.status === 'confirmed' && (
                <div className="pt-3 border-t space-y-3">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5 text-xs text-blue-900">
                    <div className="flex items-start gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-gray-900">Front Desk Check-In (Guest Arrival)</p>
                        <p className="text-gray-600 mt-0.5">
                          Has <strong>{viewItem.guest_name}</strong> arrived at the lobby? Check them in to officially register as an in-house guest and issue the room key card.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actionLoading === viewItem.id + 'checked_in'}
                        onClick={() => updateStatus(viewItem.id, 'checked_in', 'paid')}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                        title="Check-in guest and mark front desk payment received"
                      >
                        <Check size={14} />
                        Check In (Paid at Front Desk)
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === viewItem.id + 'checked_in'}
                        onClick={() => updateStatus(viewItem.id, 'checked_in')}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <UserCheck size={14} />
                        Check In Only
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 italic text-center">
                    Note: Only the customer has the right to cancel their reservation before check-in.
                  </p>
                </div>
              )}

              {/* IN-HOUSE GUEST STAY & CHECK-OUT WORKFLOW (When Checked In) */}
              {viewItem.status === 'checked_in' && (
                <div className="pt-3 border-t space-y-3">
                  {(() => {
                    const isCheckoutDateReached = getTodayStr() >= viewItem.check_out;

                    if (!isCheckoutDateReached) {
                      if (checkoutStep === 'confirm_complete') {
                        return (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                            <div className="flex items-start gap-2 text-emerald-900">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-sm text-gray-900">Early Check-Out (Early Departure)</p>
                                <p className="text-gray-600 mt-1">
                                  <strong>{viewItem.guest_name}</strong> needs to leave before the scheduled date ({viewItem.check_out}). Upon completion, the booking will be marked as <strong>Completed</strong> and the room will automatically move to <strong>Needs Cleaning (Housekeeping)</strong>.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setCheckoutStep('default')}
                                className="flex-1 py-2 px-3 border border-gray-300 hover:bg-white text-gray-700 font-semibold rounded-lg"
                              >
                                Go Back
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === viewItem.id + 'completed'}
                                onClick={() => updateStatus(viewItem.id, 'completed', 'paid')}
                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                {actionLoading === viewItem.id + 'completed' ? 'Processing...' : 'Complete Early Check-out'}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">In-House Active Stay (Currently Staying)</p>
                              <p className="text-indigo-800 mt-0.5">
                                Guest is currently in the room. Scheduled check-out date: <strong>{viewItem.check_out}</strong>.
                              </p>
                              <p className="text-gray-500 text-[11px] mt-1">
                                ℹ️ If the guest wishes to extend, they can do so from their customer portal. If they need to leave early, you can check them out below.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep('confirm_complete')}
                            className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Check size={14} />
                            Check Out Now (Early Departure)
                          </button>
                        </div>
                      );
                    }

                    // Check-out date is reached / passed:
                    if (checkoutStep === 'confirm_complete') {
                      return (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                          <div className="flex items-start gap-2 text-emerald-900">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">Confirm Check-out Completion</p>
                              <p className="text-gray-600 mt-1">
                                <strong>{viewItem.guest_name}</strong>'s stay is done. Press the button to mark the booking as <strong>Completed</strong> and set the room as <strong>Needs Cleaning (Housekeeping)</strong>.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setCheckoutStep('default')}
                              className="flex-1 py-2 px-3 border border-gray-300 hover:bg-white text-gray-700 font-semibold rounded-lg"
                            >
                              Go Back
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === viewItem.id + 'completed'}
                              onClick={() => updateStatus(viewItem.id, 'completed', 'paid')}
                              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              {actionLoading === viewItem.id + 'completed' ? 'Processing...' : 'Complete Check-out Now'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Default state when check-out date is reached:
                    return (
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 text-xs">
                        <div className="flex items-start gap-2 text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-gray-900">Check-out Date Reached ({viewItem.check_out})</p>
                            <p className="text-gray-600 mt-0.5">
                              The check-out date has been reached. If the guest has not extended their stay, you may now complete the check-out and turn over the room to Housekeeping.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('confirm_complete')}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Check size={16} />
                          Stay Ended — Complete Check-out
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="text-center mb-4">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Booking?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete booking record <strong>{deleteConfirmItem.booking_reference}</strong> ({deleteConfirmItem.guest_name})?
              </p>
            </div>
            {actionError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center">
                {actionError}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setDeleteConfirmItem(null); setActionError(''); }}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-60 shadow-xs"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official E-Receipt / Voucher Pass Modal */}
      {receiptModalItem && (
        <ReceiptModal
          booking={receiptModalItem}
          onClose={() => setReceiptModalItem(null)}
        />
      )}
    </div>
  );
}
