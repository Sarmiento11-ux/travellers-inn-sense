import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Check, X, RefreshCw, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pricingApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

export default function Pricing() {
  const { formatPrice, currencySymbol } = useSettings();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchRecs = () => {
    setLoading(true);
    pricingApi.list()
      .then(data => setRecommendations(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecs(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const recs = await pricingApi.generate();
      setRecommendations(recs || []);
      setMessage('New recommendations generated based on real booking data!');
    } catch (err) {
      setMessage('Error: ' + (err.message || 'Failed to generate recommendations.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      const updated = action === 'approve' ? await pricingApi.approve(id) : await pricingApi.reject(id);
      setRecommendations(prev => prev.map(r => r.id === id ? updated : r));
      if (action === 'approve') {
        setMessage(`Success: Price for "${updated.room_name || 'Room'}" has been approved and automatically updated to ${formatPrice(updated.recommended_price)}!`);
      } else {
        setMessage(`Recommendation for "${updated.room_name || 'Room'}" has been rejected.`);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (s) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const demandColor = (d) => {
    if (d === 'High') return 'text-red-600';
    if (d === 'Low') return 'text-blue-600';
    return 'text-amber-600';
  };

  const pending = recommendations.filter(r => r.status === 'pending').length;
  const approved = recommendations.filter(r => r.status === 'approved').length;
  const rejected = recommendations.filter(r => r.status === 'rejected').length;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pricing Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Algorithmic dynamic pricing suggestions. Approving a recommendation automatically updates the room's live price.
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          {generating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
          <span>{generating ? 'Generating...' : 'Generate New Recommendations'}</span>
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {message}
        </div>
      )}


      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: 'Pending', val: pending, color: 'amber' }, { label: 'Approved', val: approved, color: 'green' }, { label: 'Rejected', val: rejected, color: 'red' }].map(s => (
          <div key={s.label} className={`bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center`}>
            <div className={`text-2xl font-bold text-${s.color}-600`}>{s.val}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading recommendations...</div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p>No recommendations yet. Click "Generate New Recommendations" to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(rec => {
            const priceDiff = rec.price_difference || (rec.recommended_price - rec.current_price);
            const isUp = priceDiff >= 0;
            return (
              <div key={rec.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{rec.room_name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{rec.room_type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(rec.status)}`}>
                          {(rec.status || 'pending').charAt(0).toUpperCase() + (rec.status || 'pending').slice(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 mb-3">
                        <div>
                          <span className="text-xs text-gray-500">Current Price</span>
                          <div className="font-bold text-gray-800 text-lg">{formatPrice(rec.current_price)}</div>
                        </div>
                        <div className="text-gray-400 text-2xl">→</div>
                        <div>
                          <span className="text-xs text-gray-500">Recommended Price</span>
                          <div className={`font-bold text-lg flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {formatPrice(rec.recommended_price)}
                            <span className="text-sm font-normal">({isUp ? '+' : ''}{formatPrice(priceDiff)})</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Demand Level</span>
                          <div className={`font-semibold ${demandColor(rec.demand_level)}`}>{rec.demand_level}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Availability</span>
                          <div className="font-semibold text-gray-700">{rec.availability_level}</div>
                        </div>
                      </div>

                      {rec.recommendation_reason && (
                        <p className="text-sm text-gray-500 italic">{rec.recommendation_reason}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Generated: {rec.generated_at?.split('T')[0]}</p>
                      
                      {rec.status === 'approved' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={14} className="text-emerald-600" />
                          Live Price Applied: {formatPrice(rec.recommended_price)}
                        </div>
                      )}
                    </div>

                    {rec.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleAction(rec.id, 'approve')}
                          disabled={actionLoading === rec.id + 'approve'}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                          <Check size={16} />
                          {actionLoading === rec.id + 'approve' ? '...' : 'Approve'}
                        </button>
                        <button onClick={() => handleAction(rec.id, 'reject')}
                          disabled={actionLoading === rec.id + 'reject'}
                          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                          <X size={16} />
                          {actionLoading === rec.id + 'reject' ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}
                    {rec.status !== 'pending' && rec.reviewed_at && (
                      <div className="text-xs text-gray-400 text-right">
                        Reviewed: {rec.reviewed_at?.split('T')[0]}<br />
                        by {rec.reviewed_by || 'Admin'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
