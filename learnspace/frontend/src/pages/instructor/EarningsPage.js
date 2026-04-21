// ============================================================
// LearnSpace - EarningsPage (Full Implementation)
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon, label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

// Minimal bar chart using plain divs — no chart library needed
const BarChart = ({ data }) => {
  if (!data?.length) return (
    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
      No earnings data yet
    </div>
  );

  const max = Math.max(...data.map(d => d.earning), 1);

  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">
            {d.earning > 0 ? `৳${Math.round(d.earning)}` : ''}
          </span>
          <div
            className="w-full bg-blue-500 rounded-t-md transition-all duration-500 min-h-[4px]"
            style={{ height: `${Math.max(4, (d.earning / max) * 160)}px` }}
            title={`৳${d.earning.toFixed(2)}`}
          />
          <span className="text-xs text-gray-500">{d.month}</span>
        </div>
      ))}
    </div>
  );
};

const EarningsPage = () => {
  const [stats, setStats]           = useState(null);
  const [earnings, setEarnings]     = useState([]);
  const [transactions, setTrans]    = useState([]);
  const [loading, setLoading]       = useState(true);
  const [txLoading, setTxLoading]   = useState(true);
  const [period, setPeriod]         = useState('6months');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await api.get('/analytics/instructor');
        const data = res.data?.data || {};
        setStats(data.stats   || { totalEarnings: 0, totalEnrollments: 0 });
        setEarnings(data.earningsByMonth || []);
      } catch {
        toast.error('Failed to load earnings data.');
      } finally {
        setLoading(false);
      }
    };

    const loadTransactions = async () => {
      try {
        // Try instructor earnings endpoint; graceful fallback if not available
        const res = await api.get('/analytics/instructor/transactions').catch(() => ({ data: { data: { transactions: [] } } }));
        setTrans(res.data?.data?.transactions || []);
      } catch {
        // Silently ignore — transactions section will show empty state
      } finally {
        setTxLoading(false);
      }
    };

    loadAnalytics();
    loadTransactions();
  }, []);

  const totalEarnings     = stats?.totalEarnings     || 0;
  const totalEnrollments  = stats?.totalEnrollments  || 0;
  const platformFee       = totalEarnings * 0.3;   // 30% platform cut assumption
  const netEarnings       = totalEarnings * 0.7;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Earnings</h1>
          <p className="text-gray-500 text-sm mt-1">Track your revenue and payouts</p>
        </div>
        <Link
          to="/instructor/analytics"
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          📊 Full Analytics
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="💵" label="Total Revenue"     value={`৳${parseFloat(totalEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="blue" />
            <StatCard icon="🏦" label="Your Net (70%)"   value={`৳${parseFloat(netEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}   color="green" />
            <StatCard icon="🎓" label="Total Students"   value={totalEnrollments.toLocaleString()} sub="enrolled across all courses" color="purple" />
            <StatCard icon="📊" label="Platform Fee (30%)" value={`৳${parseFloat(platformFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="orange" />
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Monthly Earnings</h2>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="6months">Last 6 months</option>
                <option value="12months">Last 12 months</option>
              </select>
            </div>
            <BarChart data={earnings} />
            {earnings.length === 0 && (
              <p className="text-center text-sm text-gray-400 mt-2">
                Earnings will appear here once students enroll in your courses.
              </p>
            )}
          </div>

          {/* Payout Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 How Payouts Work</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Instructors receive <strong>70%</strong> of each course sale (LearnSpace retains 30%)</p>
              <p>• Payouts are processed monthly on the <strong>1st of each month</strong></p>
              <p>• Minimum payout threshold: <strong>৳500</strong></p>
              <p>• Payment methods: bKash, Nagad, Bank Transfer</p>
            </div>
          </div>
        </>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Transaction History</h2>
        </div>

        {txLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Earnings will appear here when students purchase your courses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Your Share</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-xs truncate">
                      {tx.course?.title || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{tx.student?.name || '—'}</td>
                    <td className="px-5 py-3 text-right text-gray-700">৳{parseFloat(tx.amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">
                      ৳{parseFloat(tx.net_earning || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'paid'    ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsPage;
