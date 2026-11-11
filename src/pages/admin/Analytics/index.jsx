import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

export default function Analytics() {
  const { formatPrice } = useSettings();
  const [bookingsData, setBookingsData] = useState(null);
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.bookings(), analyticsApi.rooms()])
      .then(([bkgs, rooms]) => {
        setBookingsData(bkgs);
        setRoomsData(rooms || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="p-6 text-center text-gray-500">Loading analytics...</div>;

  const statusChartData = bookingsData?.by_status || [];
  const roomChartData = roomsData.map(r => ({ name: r.name, bookings: r.booking_count }))
    .sort((a, b) => b.bookings - a.bookings);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Booking Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookingsData?.total || 0, color: 'blue' },
          { label: 'Total Revenue', value: formatPrice(bookingsData?.total_revenue || 0), color: 'green' },
          ...(bookingsData?.by_status || []).map(s => ({
            label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
            value: s.count,
            color: s.status === 'confirmed' ? 'emerald' : s.status === 'cancelled' ? 'red' : s.status === 'completed' ? 'blue' : 'amber',
          })),
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold text-${card.color}-600 mt-1`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Booking Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bookings by Status</h2>
          {statusChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No booking data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                    {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Room popularity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Most Booked Rooms</h2>
          {roomChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">No room data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Room Details Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Room Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Current Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Total Bookings</th>
              </tr>
            </thead>
            <tbody>
              {roomsData.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{r.name}</td>
                  <td className="p-4 text-gray-600">{r.type}</td>
                  <td className="p-4 text-gray-600">{formatPrice(r.current_price)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.availability_status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.availability_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-indigo-600">{r.booking_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
