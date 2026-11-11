import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, X } from 'lucide-react';
import { feedbackApi } from '../../../services/api';

const Feedback = () => {
  const [allFeedback, setAllFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    feedbackApi.adminAll()
      .then(data => setAllFeedback(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = allFeedback.filter(item => {
    const matchSearch = (item.guest_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.feedback_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSentiment = filterSentiment === 'All' || item.sentiment === filterSentiment;
    return matchSearch && matchSentiment;
  });

  const sentimentBadge = (s) => {
    if (s === 'Positive') return 'bg-emerald-100 text-emerald-700';
    if (s === 'Negative') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Feedback Management</h1>
        <span className="text-sm text-gray-500">{allFeedback.length} total entries</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search feedback..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)}>
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading feedback...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Guest</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Sentiment</th>
                  <th className="p-4 font-medium">Confidence</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{item.guest_name || 'Anonymous'}</td>
                    <td className="p-4 text-gray-600">{item.rating}/5</td>
                    <td className="p-4 text-gray-600">{item.category}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentBadge(item.sentiment)}`}>
                        {item.sentiment || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td className="p-4 text-gray-600">{item.created_at?.split('T')[0]}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setViewItem(item)} className="text-gray-400 hover:text-blue-600 transition-colors" title="View Details">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No feedback found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          Showing {filtered.length} of {allFeedback.length} entries
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Feedback Details</h2>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Guest</h3><p className="text-gray-800 font-medium">{viewItem.guest_name || 'Anonymous'}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</h3><p className="text-gray-800">{viewItem.created_at?.split('T')[0]}</p></div>
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Rating</h3><p className="text-gray-800">{viewItem.rating}/5</p></div>
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</h3><p className="text-gray-800">{viewItem.category}</p></div>
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Sentiment</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentBadge(viewItem.sentiment)}`}>{viewItem.sentiment || 'N/A'}</span>
                </div>
              </div>
              {viewItem.themes?.length > 0 && (
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Themes Detected</h3>
                  <div className="flex flex-wrap gap-1">
                    {viewItem.themes.map(t => <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{t}</span>)}
                  </div>
                </div>
              )}
              <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Comment</h3><p className="text-gray-700 italic">"{viewItem.feedback_text}"</p></div>
              {viewItem.confidence_score && (
                <div><h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Confidence</h3>
                  <p className="text-gray-800">{(viewItem.confidence_score * 100).toFixed(1)}%</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
