import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageSquare, ThumbsUp, ThumbsDown, Activity, TrendingUp, CalendarDays, DollarSign, BedDouble } from 'lucide-react';
import { analyticsApi, roomsApi } from '../../../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard().catch(console.error),
      roomsApi.list().catch(() => [])
    ])
      .then(([dashData, roomsData]) => {
        setData(dashData);
        setRooms(roomsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading dashboard...</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Failed to load dashboard data.</div>;

  const sentimentData = [
    { name: 'Positive', value: data.positive_feedback },
    { name: 'Neutral',  value: data.neutral_feedback },
    { name: 'Negative', value: data.negative_feedback },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const categoryData = data.recent_feedback.reduce((acc, curr) => {
    const ex = acc.find(i => i.name === curr.category);
    if (ex) ex.count += 1;
    else acc.push({ name: curr.category, count: 1 });
    return acc;
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Feedback', value: data.total_feedback, icon: MessageSquare, color: 'blue' },
          { label: 'Positive',       value: data.positive_feedback, icon: ThumbsUp,    color: 'emerald' },
          { label: 'Neutral',        value: data.neutral_feedback,  icon: Activity,     color: 'amber' },
          { label: 'Negative',       value: data.negative_feedback, icon: ThumbsDown,   color: 'red' },
        ].map(card => (
          <div key={card.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-full`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg. Rating</p>
            <p className="text-2xl font-bold text-gray-800">{data.average_rating}/5</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-full"><CalendarDays size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-800">{data.total_bookings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><BedDouble size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Available Rooms</p>
            <p className="text-2xl font-bold text-emerald-600">
              {rooms.filter(r => r.availability_status === 'available').length} / {rooms.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Pricing Recs</p>
            <p className="text-2xl font-bold text-gray-800">{data.pending_pricing_recommendations}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Guest Sentiment</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Feedback by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Recent Feedback</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Guest</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Sentiment</th>
                <th className="p-4 font-medium">Comment</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_feedback.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{item.guest_name}</td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700' : item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.sentiment || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{item.feedback_text}</td>
                  <td className="p-4 text-gray-600">{item.created_at?.split('T')[0]}</td>
                </tr>
              ))}
              {data.recent_feedback.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No feedback yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
