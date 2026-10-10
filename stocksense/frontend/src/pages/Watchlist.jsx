import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Star, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getWatchlists,
  createWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/api';

export default function Watchlist() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState(null);

  const load = () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getWatchlists()
      .then((res) => setLists(res.data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user]);

  const ensureList = async () => {
    if (lists.length > 0) return lists[0];
    const res = await createWatchlist('My Watchlist');
    setLists([res.data]);
    return res.data;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setError(null);
    try {
      const wl = await ensureList();
      await addToWatchlist(wl.id, symbol.trim().toUpperCase());
      setSymbol('');
      load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  const handleRemove = async (wlId, itemId) => {
    await removeFromWatchlist(wlId, itemId);
    load();
  };

  if (!user) {
    return (
      <div className="empty-state">
        <Star size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <h3>Sign in to use Watchlists</h3>
        <p>Create an account to save and track your favorite symbols.</p>
        <Link to="/auth" className="btn btn-primary" style={{ marginTop: 16 }}>
          Sign In / Register
        </Link>
      </div>
    );
  }

  const items = lists.flatMap((wl) =>
    (wl.items || []).map((item) => ({ ...item, watchlistId: wl.id }))
  );

  return (
    <div>
      <div className="disclaimer">
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Watchlist prices are delayed snapshots for research convenience only.</span>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
        My Watchlist
      </h2>

      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}
      >
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Add symbol (e.g. NVDA)"
          style={{ width: 200 }}
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={16} /> Add
        </button>
      </form>

      {error && (
        <div style={{ color: 'var(--bearish)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No symbols yet</h3>
          <p>Add stocks above to start tracking them.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to={`/analyze?symbol=${item.symbol}`}
                        style={{ fontWeight: 600, color: 'var(--accent)' }}
                      >
                        {item.symbol}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {item.company_name || '—'}
                    </td>
                    <td>
                      {item.current_price != null
                        ? `$${Number(item.current_price).toFixed(2)}`
                        : '—'}
                    </td>
                    <td>
                      {item.change_pct != null ? (
                        <span
                          style={{
                            color:
                              item.change_pct >= 0 ? 'var(--bullish)' : 'var(--bearish)',
                            fontWeight: 600,
                          }}
                        >
                          {item.change_pct >= 0 ? '+' : ''}
                          {item.change_pct}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleRemove(item.watchlistId, item.id)}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
