import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { getPopular } from '../services/api';

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPopular()
      .then((res) => setStocks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="disclaimer">
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Educational tool only.</strong> Forecasts are uncertain estimates based on
          historical patterns. They are <em>not</em> financial advice and should never be used
          for real trading decisions.
        </span>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
        Market Overview
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Quick snapshot of popular stocks. Click any symbol to analyze & forecast.
      </p>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span>Loading market data...</span>
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {stocks.map((s) => {
            const change =
              s.current_price && s.previous_close
                ? ((s.current_price - s.previous_close) / s.previous_close) * 100
                : null;
            return (
              <Link
                key={s.symbol}
                to={`/analyze?symbol=${s.symbol}`}
                className="stat-card"
                style={{ textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="stat-label">{s.symbol}</div>
                <div className="stat-value">
                  {s.current_price != null
                    ? `$${Number(s.current_price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '—'}
                </div>
                <div
                  className={`stat-change ${change != null ? (change >= 0 ? 'up' : 'down') : ''}`}
                >
                  {change != null ? (
                    <>
                      {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{' '}
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </>
                  ) : (
                    s.name || ''
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">What is StockSense?</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            StockSense is an educational ML-powered market analyzer. It fetches historical
            price data, computes technical indicators, and runs time-series forecasting models
            (XGBoost, ARIMA, Ensemble) to produce estimated future price ranges with uncertainty
            bands.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/analyze" className="btn btn-primary">
              <Activity size={16} /> Start Analyzing
            </Link>
            <Link to="/learn" className="btn btn-outline">
              Learn ML
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Models Used</div>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1.1rem' }}>
            <li>
              <strong style={{ color: 'var(--accent)' }}>XGBoost</strong> — Gradient boosting
              on lag & technical features
            </li>
            <li>
              <strong style={{ color: 'var(--info)' }}>ARIMA</strong> — Classical statistical
              time-series model
            </li>
            <li>
              <strong style={{ color: 'var(--warning)' }}>Ensemble</strong> — Weighted blend of
              XGBoost + ARIMA
            </li>
          </ul>
          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            All forecasts include uncertainty ranges and model metrics (MAE, RMSE, direction
            accuracy).
          </p>
        </div>
      </div>
    </div>
  );
}
