import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tag, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyticsApi, feedbackApi } from '../../../services/api';

const Themes = () => {
  const [themes, setThemes] = useState([]);   // [{ theme, count }]
  const [feedback, setFeedback] = useState([]); // all feedback for grouping
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.themes(), feedbackApi.adminAll()])
      .then(([th, fbs]) => {
        setThemes(th || []);
        setFeedback(fbs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build per-theme data with negative count for the chart
  const chartData = themes.map(t => {
    const negativeFeedback = feedback.filter(fb =>
      (fb.themes || []).includes(t.theme) && fb.sentiment === 'Negative'
    );
    return { name: t.theme, count: t.count, negative: negativeFeedback.length };
  });

  const priorityAreas = chartData.filter(c => c.negative > 0);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading themes...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thematic Analysis</h1>
        <p className="text-gray-500 mt-1">Frequently mentioned concerns and topics identified by AI keyword extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-indigo-500" />
            Top Mentioned Themes
          </h2>
          {chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400">No themes extracted yet.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.negative > 0 ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>Standard Theme</div>
            <div className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>Contains Negative Sentiments</div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle size={18} className="mr-2 text-amber-500" />
            Priority Areas
          </h2>
          <div className="space-y-4">
            {priorityAreas.map(cat => (
              <div key={cat.name} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Tag size={14} className="mr-1 text-gray-500" />
                    {cat.name}
                  </h3>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                    {cat.negative} Issues
                  </span>
                </div>
                <p className="text-sm text-gray-500">Requires attention based on negative feedback volume.</p>
              </div>
            ))}
            {priorityAreas.length === 0 && (
              <div className="text-center text-gray-500 py-4">No critical areas identified.</div>
            )}
          </div>
        </div>
      </div>

      {/* Theme breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Feedback by Theme</h2>
        </div>
        <div>
          {themes.map(t => {
            const related = feedback.filter(fb => (fb.themes || []).includes(t.theme));
            return (
              <div key={t.theme} className="border-b border-gray-50 last:border-b-0">
                <div className="p-4 bg-gray-50 font-medium text-gray-700 flex justify-between items-center">
                  <span>{t.theme}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{t.count} mentions</span>
                </div>
                <div className="p-4 space-y-3">
                  {related.slice(0, 3).map(fb => (
                    <div key={fb.id} className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-2 h-2 rounded-full ${fb.sentiment === 'Positive' ? 'bg-emerald-500' : fb.sentiment === 'Negative' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">"{fb.feedback_text}"</p>
                        <p className="text-xs text-gray-500 mt-1">{fb.guest_name} • {fb.created_at?.split('T')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {themes.length === 0 && <div className="p-8 text-center text-gray-400">No themes extracted yet. Submit some feedback to see results.</div>}
        </div>
      </div>
    </div>
  );
};

export default Themes;
