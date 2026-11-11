import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  MessageSquare,
  CalendarDays,
  BedDouble,
  Sparkles,
  Building2,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { bookingsApi, feedbackApi, pricingApi, analyticsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

/* ── CSV Exporter ────────────────────────────────────────────── */
function toCSV(headers, rows) {
  const escape = v => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { formatPrice, currencySymbol, settings } = useSettings();
  // Report Configuration States
  const [reportType, setReportType] = useState('bookings'); // bookings | feedback | pricing | rooms
  const [datePreset, setDatePreset] = useState('all'); // all | today | week | month | custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);

  // Raw Database Data
  const [bookingsData, setBookingsData] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [pricingData, setPricingData] = useState([]);
  const [roomsData, setRoomsData] = useState([]);

  // Fetch all live data on mount
  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      const [b, f, p, r] = await Promise.all([
        bookingsApi.adminAll().catch(() => []),
        feedbackApi.adminAll().catch(() => []),
        pricingApi.list().catch(() => []),
        analyticsApi.rooms().catch(() => []),
      ]);
      setBookingsData(b || []);
      setFeedbackData(f || []);
      setPricingData(p || []);
      setRoomsData(r || []);
      
      // Auto-generate on first load
      setHasGenerated(true);
      setLastGeneratedAt(new Date());
    } catch (err) {
      console.error('Failed to load report datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Handle Preset Changes
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const toDateStr = d => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const t = toDateStr(now);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'week') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(now));
    }
  };

  // Action: Trigger Report Generation
  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setHasGenerated(true);
      setLastGeneratedAt(new Date());
      setGenerating(false);
    }, 400);
  };

  // Filtered Data Computation
  const filteredData = useMemo(() => {
    let dataset = [];
    if (reportType === 'bookings') dataset = bookingsData;
    else if (reportType === 'feedback') dataset = feedbackData;
    else if (reportType === 'pricing') dataset = pricingData;
    else if (reportType === 'rooms') dataset = roomsData;

    return dataset.filter(item => {
      // Date filtering
      if (reportType !== 'rooms') {
        const rawDate = item.created_at || item.check_in || item.generated_at;
        if (rawDate) {
          const itemDate = new Date(rawDate);
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      // Status / Category filtering
      if (statusFilter !== 'all') {
        if (reportType === 'bookings' && item.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (reportType === 'feedback' && item.sentiment?.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (reportType === 'pricing' && item.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (reportType === 'rooms' && item.availability_status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Search term filtering
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (reportType === 'bookings') {
          const matchRef = item.booking_reference?.toLowerCase().includes(q);
          const matchGuest = item.guest_name?.toLowerCase().includes(q);
          const matchRoom = item.room_name?.toLowerCase().includes(q);
          if (!matchRef && !matchGuest && !matchRoom) return false;
        } else if (reportType === 'feedback') {
          const matchGuest = item.guest_name?.toLowerCase().includes(q);
          const matchText = item.feedback_text?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          if (!matchGuest && !matchText && !matchCategory) return false;
        } else if (reportType === 'pricing') {
          const matchRoom = item.room_name?.toLowerCase().includes(q);
          const matchReason = item.recommendation_reason?.toLowerCase().includes(q);
          if (!matchRoom && !matchReason) return false;
        } else if (reportType === 'rooms') {
          const matchName = item.name?.toLowerCase().includes(q);
          const matchType = item.type?.toLowerCase().includes(q);
          if (!matchName && !matchType) return false;
        }
      }

      return true;
    });
  }, [reportType, bookingsData, feedbackData, pricingData, roomsData, startDate, endDate, statusFilter, searchTerm]);

  // Summary Metrics Computation
  const summaryMetrics = useMemo(() => {
    if (reportType === 'bookings') {
      const total = filteredData.length;
      const revenue = filteredData
        .filter(b => ['confirmed', 'checked_in', 'completed'].includes(b.status?.toLowerCase()))
        .reduce((sum, b) => sum + (Number(b.booking_amount) || 0), 0);
      const confirmed = filteredData.filter(b => b.status === 'confirmed').length;
      const checkedIn = filteredData.filter(b => b.status === 'checked_in').length;
      const completed = filteredData.filter(b => b.status === 'completed').length;
      const cancelled = filteredData.filter(b => b.status === 'cancelled').length;
      return [
        { label: 'Total Bookings', value: total, color: 'text-gray-900' },
        { label: 'Total Revenue', value: formatPrice(revenue), color: 'text-emerald-600 font-bold' },
        { label: 'Confirmed', value: confirmed, color: 'text-blue-600' },
        { label: 'In-House Stay', value: checkedIn, color: 'text-indigo-600' },
        { label: 'Completed', value: completed, color: 'text-emerald-600' },
        { label: 'Cancelled', value: cancelled, color: 'text-rose-600' },
      ];
    } else if (reportType === 'feedback') {
      const total = filteredData.length;
      const avg = total > 0
        ? (filteredData.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / total).toFixed(2)
        : '0.00';
      const pos = filteredData.filter(f => f.sentiment === 'Positive').length;
      const neu = filteredData.filter(f => f.sentiment === 'Neutral').length;
      const neg = filteredData.filter(f => f.sentiment === 'Negative').length;
      return [
        { label: 'Total Reviews', value: total, color: 'text-gray-900' },
        { label: 'Average Rating', value: `${avg} / 5.0`, color: 'text-amber-500 font-bold' },
        { label: 'Positive', value: pos, color: 'text-emerald-600' },
        { label: 'Neutral', value: neu, color: 'text-gray-600' },
        { label: 'Negative', value: neg, color: 'text-rose-600' },
      ];
    } else if (reportType === 'pricing') {
      const total = filteredData.length;
      const pending = filteredData.filter(p => p.status === 'pending').length;
      const approved = filteredData.filter(p => p.status === 'approved').length;
      const rejected = filteredData.filter(p => p.status === 'rejected').length;
      const avgRec = total > 0
        ? Math.round(filteredData.reduce((sum, p) => sum + (Number(p.recommended_price) || 0), 0) / total)
        : 0;
      return [
        { label: 'Total Recommendations', value: total, color: 'text-gray-900' },
        { label: 'Pending Approval', value: pending, color: 'text-amber-600 font-semibold' },
        { label: 'Approved', value: approved, color: 'text-emerald-600' },
        { label: 'Rejected', value: rejected, color: 'text-rose-600' },
        { label: 'Avg Rec Price', value: formatPrice(avgRec), color: 'text-blue-600' },
      ];
    } else {
      const total = filteredData.length;
      const available = filteredData.filter(r => r.availability_status === 'available').length;
      const totalBookings = filteredData.reduce((sum, r) => sum + (Number(r.booking_count) || 0), 0);
      return [
        { label: 'Total Rooms', value: total, color: 'text-gray-900' },
        { label: 'Available', value: available, color: 'text-emerald-600' },
        { label: 'Booked / Unavailable', value: total - available, color: 'text-amber-600' },
        { label: 'Total Bookings Logged', value: totalBookings, color: 'text-blue-600' },
      ];
    }
  }, [reportType, filteredData]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    if (reportType === 'bookings') {
      const headers = ['Booking ID', 'Reference', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Guests', 'Amount (PHP)', 'Payment Status', 'Payment Method', 'Status', 'Date Booked'];
      const rows = filteredData.map(b => [
        b.id,
        b.booking_reference,
        b.guest_name || 'Guest',
        b.room_name || 'Room ' + b.room_id,
        b.check_in,
        b.check_out,
        b.number_of_guests,
        b.booking_amount,
        b.payment_status || 'unpaid',
        b.payment_method || 'Pay at Front Desk',
        b.status,
        b.created_at ? b.created_at.split('T')[0] : ''
      ]);
      downloadCSV(`Travellers_Inn_Bookings_Report_${dateStamp}.csv`, toCSV(headers, rows));
    } else if (reportType === 'feedback') {
      const headers = ['ID', 'Guest Name', 'Rating', 'Sentiment', 'Category', 'Feedback Text', 'Date Submitted'];
      const rows = filteredData.map(f => [
        f.id,
        f.guest_name || 'Guest',
        f.rating,
        f.sentiment || 'Unclassified',
        f.category || 'General',
        f.feedback_text,
        f.created_at ? f.created_at.split('T')[0] : ''
      ]);
      downloadCSV(`Travellers_Inn_Feedback_Sentiment_Report_${dateStamp}.csv`, toCSV(headers, rows));
    } else if (reportType === 'pricing') {
      const headers = ['ID', 'Room Name', 'Room Type', 'Current Price (PHP)', 'Recommended Price (PHP)', 'Difference (PHP)', 'Demand Level', 'Reason', 'Status', 'Generated Date'];
      const rows = filteredData.map(p => [
        p.id,
        p.room_name,
        p.room_type,
        p.current_price,
        p.recommended_price,
        p.price_difference,
        p.demand_level,
        p.recommendation_reason,
        p.status,
        p.generated_at ? p.generated_at.split('T')[0] : ''
      ]);
      downloadCSV(`Travellers_Inn_Dynamic_Pricing_Report_${dateStamp}.csv`, toCSV(headers, rows));
    } else if (reportType === 'rooms') {
      const headers = ['Room ID', 'Room Name', 'Type', 'Current Price (PHP)', 'Status', 'Booking Count'];
      const rows = filteredData.map(r => [
        r.id,
        r.name,
        r.type,
        r.current_price,
        r.availability_status,
        r.booking_count
      ]);
      downloadCSV(`Travellers_Inn_Rooms_Performance_Report_${dateStamp}.csv`, toCSV(headers, rows));
    }
  };

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return { name: 'Admin', email: 'admin@gmail.com' };
    }
  }, []);

  const reportTitles = {
    bookings: 'OFFICIAL BOOKINGS & REVENUE REPORT',
    feedback: 'GUEST FEEDBACK & SENTIMENT ANALYSIS REPORT',
    pricing: 'DYNAMIC PRICING & RATE RECOMMENDATIONS REPORT',
    rooms: 'ROOM INVENTORY & PERFORMANCE REPORT',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Print stylesheet to only print the clean document */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Page Title */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={26} />
            Report Generator
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate, filter, print, and export official operational and analytical reports directly from the database.
          </p>
        </div>
        <button
          onClick={loadDatabaseData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Database
        </button>
      </div>

      {/* ── Report Generation Control Center ─────────────────── */}
      <div className="no-print bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Step 1: Select Report Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'bookings', label: 'Bookings & Revenue', desc: 'Reservations, financial income & guest check-ins', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'feedback', label: 'Feedback & Sentiment', desc: 'Ratings, guest reviews & AI sentiment scores', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
              { id: 'pricing', label: 'Dynamic Pricing', desc: 'Price adjustments, ML recommendations & approvals', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              { id: 'rooms', label: 'Rooms & Occupancy', desc: 'Room utilization, inventory status & rates', icon: BedDouble, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(type => {
              const Icon = type.icon;
              const isSelected = reportType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setReportType(type.id);
                    setStatusFilter('all');
                  }}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/30'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`p-2 rounded-lg ${type.bg}`}>
                      <Icon size={20} className={type.color} />
                    </div>
                    {isSelected && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-base">{type.label}</span>
                  <span className="text-xs text-gray-500 mt-1 leading-relaxed">{type.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Filters & Date Ranges */}
        <div className="pt-4 border-t border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Step 2: Configure Filter & Date Scope
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Quick Date Presets */}
            {reportType !== 'rooms' && (
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range Preset</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'Last 7 Days' },
                    { id: 'month', label: 'This Month' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetChange(p.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        datePreset === p.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Date Pickers */}
            {reportType !== 'rooms' && (
              <div className="md:col-span-5 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Status / Category Dropdown */}
            <div className={reportType === 'rooms' ? 'md:col-span-8' : 'md:col-span-3'}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {reportType === 'bookings' && 'Filter by Booking Status'}
                {reportType === 'feedback' && 'Filter by Sentiment'}
                {reportType === 'pricing' && 'Filter by Status'}
                {reportType === 'rooms' && 'Filter by Availability'}
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="all">All Records</option>
                {reportType === 'bookings' && (
                  <>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In (In-House)</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
                {reportType === 'feedback' && (
                  <>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </>
                )}
                {reportType === 'pricing' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
                {reportType === 'rooms' && (
                  <>
                    <option value="available">Available</option>
                    <option value="needs_cleaning">Needs Cleaning</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button Area */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {filteredData.length} records found matching the current criteria.
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generating || loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {generating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Generating Document...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Generated Formal Report Document ─────────────────── */}
      {hasGenerated && (
        <div className="space-y-4">
          {/* Action Toolbar on Top of Report */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-700">
                Report Generated Successfully
              </span>
              <span className="text-xs text-gray-400">
                ({lastGeneratedAt ? lastGeneratedAt.toLocaleTimeString() : 'Just now'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Printer size={15} />
                Print / Save as PDF
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Download size={15} />
                Download CSV
              </button>
            </div>
          </div>

          {/* Printable Document Box */}
          <div
            id="printable-report"
            className="bg-white rounded-xl shadow-md border border-gray-200 p-8 md:p-12 space-y-8 font-sans"
          >
            {/* Formal Report Header */}
            <div className="border-b-2 border-gray-900 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-extrabold text-2xl tracking-wide uppercase">
                    <Building2 className="text-blue-600" size={28} />
                    {settings.hotelName}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 tracking-wider uppercase font-medium">
                    Hotel Hospitality & Management System
                  </p>
                </div>
                <div className="sm:text-right text-xs text-gray-600 space-y-1">
                  <div><strong>Document Ref:</strong> TI-REP-{Date.now().toString().slice(-6)}</div>
                  <div><strong>Generated:</strong> {lastGeneratedAt ? lastGeneratedAt.toLocaleString() : new Date().toLocaleString()}</div>
                  <div><strong>Generated By:</strong> {currentUser.name || 'Admin'} ({currentUser.email || 'admin@gmail.com'})</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
                  {reportTitles[reportType]}
                </h2>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  <span>
                    <strong>Scope:</strong>{' '}
                    {startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : startDate
                      ? `From ${startDate}`
                      : endDate
                      ? `Up to ${endDate}`
                      : 'All Historical Records'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Filter:</strong> {statusFilter.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Executive Summary Metrics Banner */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Executive Summary Highlights
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {summaryMetrics.map(m => (
                  <div key={m.label} className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 text-center">
                    <div className="text-xs text-gray-500 font-medium mb-1">{m.label}</div>
                    <div className={`text-xl font-extrabold ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Search & In-Document Controls */}
            <div className="no-print flex items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in table..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-gray-500">
                Showing {filteredData.length} entries
              </div>
            </div>

            {/* Detailed Data Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                    {reportType === 'bookings' && (
                      <>
                        <th className="p-3">Ref #</th>
                        <th className="p-3">Guest Name</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Check-In</th>
                        <th className="p-3">Check-Out</th>
                        <th className="p-3">Guests</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Status</th>
                      </>
                    )}
                    {reportType === 'feedback' && (
                      <>
                        <th className="p-3">ID</th>
                        <th className="p-3">Guest Name</th>
                        <th className="p-3 text-center">Rating</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Feedback Comment</th>
                        <th className="p-3 text-center">Sentiment</th>
                        <th className="p-3">Date</th>
                      </>
                    )}
                    {reportType === 'pricing' && (
                      <>
                        <th className="p-3">Room</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Current Rate</th>
                        <th className="p-3 text-right">Suggested Rate</th>
                        <th className="p-3 text-right">Variance</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3 text-center">Status</th>
                      </>
                    )}
                    {reportType === 'rooms' && (
                      <>
                        <th className="p-3">Room #</th>
                        <th className="p-3">Room Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Rate / Night</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Bookings Count</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No records match the selected report parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-gray-50/70">
                        {reportType === 'bookings' && (
                          <>
                            <td className="p-3 font-mono font-medium text-blue-600">{row.booking_reference}</td>
                            <td className="p-3 font-medium text-gray-800">{row.guest_name || 'Guest'}</td>
                            <td className="p-3 text-gray-600">{row.room_name || `Room ${row.room_id}`}</td>
                            <td className="p-3 text-gray-600">{row.check_in}</td>
                            <td className="p-3 text-gray-600">{row.check_out}</td>
                            <td className="p-3 text-center text-gray-600">{row.number_of_guests}</td>
                            <td className="p-3 text-right">
                              <span className="font-semibold text-gray-900 block">{formatPrice(row.booking_amount || 0)}</span>
                              <span className={`text-[10px] font-bold ${row.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {row.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                row.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                row.status === 'checked_in' ? 'bg-indigo-100 text-indigo-700' :
                                row.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {row.status === 'checked_in' ? 'IN-HOUSE' : row.status?.toUpperCase()}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'feedback' && (
                          <>
                            <td className="p-3 text-gray-400 font-mono">#{row.id}</td>
                            <td className="p-3 font-medium text-gray-800">{row.guest_name || 'Guest'}</td>
                            <td className="p-3 text-center font-bold text-amber-500">⭐ {row.rating}</td>
                            <td className="p-3 text-gray-600">{row.category || 'General'}</td>
                            <td className="p-3 text-gray-700 max-w-xs truncate italic">"{row.feedback_text}"</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                row.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700' :
                                row.sentiment === 'Negative' ? 'bg-rose-100 text-rose-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {row.sentiment || 'Neutral'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500">{row.created_at ? row.created_at.split('T')[0] : '-'}</td>
                          </>
                        )}
                        {reportType === 'pricing' && (
                          <>
                            <td className="p-3 font-medium text-gray-800">{row.room_name}</td>
                            <td className="p-3 text-gray-500">{row.room_type}</td>
                            <td className="p-3 text-right text-gray-600">{formatPrice(row.current_price)}</td>
                            <td className="p-3 text-right font-bold text-blue-600">{formatPrice(row.recommended_price)}</td>
                            <td className={`p-3 text-right font-semibold ${
                              Number(row.price_difference) < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {Number(row.price_difference) > 0 ? '+' : ''}{formatPrice(row.price_difference)}
                            </td>
                            <td className="p-3 text-gray-600 max-w-xs text-[11px]">{row.recommendation_reason}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                row.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {row.status?.toUpperCase()}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'rooms' && (
                          <>
                            <td className="p-3 font-mono font-medium text-gray-500">#{row.id}</td>
                            <td className="p-3 font-semibold text-gray-800">{row.name}</td>
                            <td className="p-3 text-gray-500">{row.type}</td>
                            <td className="p-3 text-right font-semibold text-gray-900">{formatPrice(row.current_price)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                row.availability_status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {row.availability_status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-blue-600">{row.booking_count}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Formal Report Footer & Sign-off Block */}
            <div className="pt-8 border-t border-gray-200 mt-8 grid grid-cols-2 gap-8 text-xs text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-8">Prepared by:</p>
                <div className="border-b border-gray-400 w-48 mb-1"></div>
                <p className="font-medium">{currentUser.name || 'Admin User'}</p>
                <p className="text-gray-400">System Administrator / Staff</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 mb-8">Noted & Approved by:</p>
                <div className="border-b border-gray-400 w-48 mb-1 ml-auto"></div>
                <p className="font-medium">Hotel General Manager</p>
                <p className="text-gray-400">{settings.hotelName} Executive Management</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
