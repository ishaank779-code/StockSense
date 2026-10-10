import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import { compareStocks } from '../services/api';

export default function Compare() {
  const [symbols, setSymbols] = useState('AAPL,MSFT,GOOGL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    const list = symbols
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 6);
    if (list.length < 2) {
      setError('Enter at least 2 symbols');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await compareStocks(list);
      setData(res.data);
      setSelected(list[0]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="disclaimer">
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Comparison is for educational analysis of historical price relationships only.</span>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Stock Comparison
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Compare up to 6 symbols side-by-side (historical performance & correlation).
      </p>

      <form
        onSubmit={handleCompare}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          value={symbols}
          onChange={(e) => setSymbols(e.target.value)}
          placeholder="AAPL, MSFT, GOOGL, TSLA"
          style={{ flex: 1, minWidth: 240 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'var(--bearish)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {data.stocks.map((s) => (
              <div
                key={s.symbol}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  borderColor: selected === s.symbol ? 'var(--accent)' : undefined,
                }}
                onClick={() => setSelected(s.symbol)}
              >
                <div className="stat-label">{s.symbol}</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>
                  {s.current_price != null ? `$${Number(s.current_price).toFixed(2)}` : '—'}
                </div>
                <div
                  className={`stat-change ${
                    s.change_pct != null ? (s.change_pct >= 0 ? 'up' : 'down') : ''
                  }`}
                >
                  {s.change_pct != null
                    ? `${s.change_pct >= 0 ? '+' : ''}${s.change_pct}% (period)`
                    : s.name || ''}
                </div>
              </div>
            ))}
          </div>

          {selected && data.historical[selected] && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">Chart — {selected}</div>
              <PriceChart historical={data.historical[selected]} height={300} />
            </div>
          )}

          {data.correlation && (
            <div className="card">
              <div className="card-title">Price Correlation Matrix</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      {Object.keys(data.correlation).map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.correlation).map(([row, cols]) => (
                      <tr key={row}>
                        <td style={{ fontWeight: 600 }}>{row}</td>
                        {Object.entries(cols).map(([col, val]) => (
                          <td
                            key={col}
                            style={{
                              color:
                                val > 0.7
                                  ? 'var(--bullish)'
                                  : val < 0.3
                                  ? 'var(--bearish)'
                                  : 'var(--text-secondary)',
                            }}
                          >
                            {typeof val === 'number' ? val.toFixed(2) : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Values close to 1 indicate strong positive co-movement; near 0 means little linear
                relationship over the period.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
