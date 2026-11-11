import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BrainCircuit, RefreshCw, CheckCircle2 } from 'lucide-react';
import { analyticsApi } from '../../../services/api';

const Sentiment = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    analyticsApi.sentiment()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const sentimentData = data ? [
    { name: 'Positive', value: data.positive },
    { name: 'Neutral',  value: data.neutral },
    { name: 'Negative', value: data.negative },
  ] : [];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const positivePct = data?.total ? Math.round((data.positive / data.total) * 100) : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sentiment Analysis</h1>
        <button onClick={fetchData} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
          <span>{loading ? 'Loading...' : 'Refresh Analysis'}</span>
        </button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Overall Sentiment Distribution</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                      {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-800">{positivePct}%</span>
                  <span className="text-sm text-gray-500">Positive</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: 'Positive', pct: data.positive_pct, color: 'emerald' },
                  { label: 'Neutral',  pct: data.neutral_pct,  color: 'amber' },
                  { label: 'Negative', pct: data.negative_pct, color: 'red' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 p-2 rounded`}>
                    <div className={`font-bold text-${s.color}-700`}>{s.pct}%</div>
                    <div className={`text-${s.color}-600 text-xs`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Recent Negative Insights</h2>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              {(data?.items || []).filter(f => f.sentiment === 'Negative').map(item => (
                <div key={item.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">{item.category}</span>
                    <span className="text-xs text-gray-500">{item.created_at?.split('T')[0]}</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">"{item.feedback_text}"</p>
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    AI Confidence: {item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
              ))}
              {(data?.items || []).filter(f => f.sentiment === 'Negative').length === 0 && (
                <div className="text-center text-gray-500 p-8">No negative feedback found!</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">All Analyzed Feedback</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="p-4 font-medium">Guest</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Sentiment</th>
                <th className="p-4 font-medium">Confidence</th>
                <th className="p-4 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{item.guest_name}</td>
                  <td className="p-4 text-gray-600">{item.rating}/5</td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700' : item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.sentiment || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : '-'}</td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{item.feedback_text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sentiment;
