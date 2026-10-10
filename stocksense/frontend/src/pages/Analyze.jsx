import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import PriceChart from '../components/PriceChart';
import { getStockInfo, getHistorical, runForecast } from '../services/api';

export default function Analyze() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'AAPL');
  const [inputSymbol, setInputSymbol] = useState(symbol);
  const [period, setPeriod] = useState('1y');
  const [model, setModel] = useState('ensemble');
  const [days, setDays] = useState(7);

  const [info, setInfo] = useState(null);
  const [hist, setHist] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (sym) => {
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const [infoRes, histRes] = await Promise.all([
        getStockInfo(sym),
        getHistorical(sym, period),
      ]);
      setInfo(infoRes.data);
      setHist(histRes.data);
      setSymbol(sym);
      setSearchParams({ symbol: sym });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      setInfo(null);
      setHist(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(symbol);
  }, [period]);

  useEffect(() => {
    const s = searchParams.get('symbol');
    if (s && s !== symbol) {
      setInputSymbol(s);
      loadData(s);
    }
  }, [searchParams]);

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (inputSymbol.trim()) loadData(inputSymbol.trim().toUpperCase());
  };

  const handleForecast = async () => {
    setForecastLoading(true);
    setError(null);
    try {
      const res = await runForecast({
        symbol,
        days: Number(days),
        model,
        lookback_days: 365,
      });
      setForecast(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Forecast failed');
    } finally {
      setForecastLoading(false);
    }
  };

  const change =
    info?.current_price && info?.previous_close
      ? ((info.current_price - info.previous_close) / info.previous_close) * 100
      : null;

  const trendIcon = (t) => {
    if (t === 'bullish') return <TrendingUp size={16} />;
    if (t === 'bearish') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  return (
    <div>
      <div className="disclaimer">
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Predictions are <strong>educational estimates</strong> with uncertainty ranges. They
          are not guaranteed and must not be treated as buy/sell advice.
        </span>
      </div>

      <form
        onSubmit={handleAnalyze}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
      >
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (AAPL, TSLA, RELIANCE.NS...)"
          style={{ width: 220 }}
        />
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="3mo">3 Months</option>
          <option value="6mo">6 Months</option>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="5y">5 Years</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Load
        </button>
      </form>

      {error && (
        <div
          style={{
            background: 'rgba(255,82,82,0.1)',
            border: '1px solid rgba(255,82,82,0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            color: 'var(--bearish)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <span>Fetching market data...</span>
        </div>
      )}

      {!loading && info && (
        <>
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">{info.symbol}</div>
              <div className="stat-value">
                {info.current_price != null
                  ? `$${Number(info.current_price).toFixed(2)}`
                  : '—'}
              </div>
              <div className={`stat-change ${change != null ? (change >= 0 ? 'up' : 'down') : ''}`}>
                {change != null
                  ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
                  : info.name}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Day Range</div>
              <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                {info.day_low != null && info.day_high != null
                  ? `$${Number(info.day_low).toFixed(2)} – $${Number(info.day_high).toFixed(2)}`
                  : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">52W Range</div>
              <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                {info.fifty_two_week_low != null
                  ? `$${Number(info.fifty_two_week_low).toFixed(0)} – $${Number(
                      info.fifty_two_week_high
                    ).toFixed(0)}`
                  : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Volume</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                {info.volume != null
                  ? Number(info.volume).toLocaleString()
                  : '—'}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div className="card-title" style={{ marginBottom: 0 }}>
                Price Chart — {info.name || info.symbol}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="ensemble">Ensemble</option>
                  <option value="xgboost">XGBoost</option>
                  <option value="arima">ARIMA</option>
                </select>
                <select value={days} onChange={(e) => setDays(e.target.value)}>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={21}>21 Days</option>
                  <option value={30}>30 Days</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleForecast}
                  disabled={forecastLoading}
                >
                  <Play size={14} />
                  {forecastLoading ? 'Running...' : 'Run Forecast'}
                </button>
              </div>
            </div>

            <PriceChart
              historical={hist?.data || []}
              predictions={forecast?.predictions || []}
              indicators={hist?.indicators}
            />
          </div>

          {forecast && (
            <div className="grid-2">
              <div className="pred-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="symbol">{forecast.symbol}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Model: {forecast.model_used} · {forecast.forecast_days} day forecast
                    </div>
                  </div>
                  <span className={`badge badge-${forecast.trend}`}>
                    {trendIcon(forecast.trend)} {forecast.trend}
                  </span>
                </div>
                <div className="price">
                  Last: ${forecast.last_actual_price}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                    ({forecast.last_actual_date})
                  </span>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Predicted</th>
                          <th>Lower</th>
                          <th>Upper</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.predictions.map((p) => (
                          <tr key={p.date}>
                            <td>{p.date}</td>
                            <td style={{ color: 'var(--warning)', fontWeight: 600 }}>
                              ${p.predicted}
                            </td>
                            <td>${p.lower}</td>
                            <td>${p.upper}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {forecast.confidence_note}
                </p>
              </div>

              <div className="card">
                <div className="card-title">Model Metrics (on hold-out set)</div>
                {forecast.metrics ? (
                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="stat-card" style={{ padding: '0.85rem' }}>
                      <div className="stat-label">MAE</div>
                      <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {forecast.metrics.mae?.toFixed(3) ?? '—'}
                      </div>
                    </div>
                    <div className="stat-card" style={{ padding: '0.85rem' }}>
                      <div className="stat-label">RMSE</div>
                      <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {forecast.metrics.rmse?.toFixed(3) ?? '—'}
                      </div>
                    </div>
                    <div className="stat-card" style={{ padding: '0.85rem' }}>
                      <div className="stat-label">MAPE %</div>
                      <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {forecast.metrics.mape?.toFixed(2) ?? '—'}
                      </div>
                    </div>
                    <div className="stat-card" style={{ padding: '0.85rem' }}>
                      <div className="stat-label">Direction Acc.</div>
                      <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {forecast.metrics.direction_accuracy != null
                          ? `${forecast.metrics.direction_accuracy.toFixed(1)}%`
                          : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No metrics available</p>
                )}
                <p
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Metrics are computed on a held-out portion of historical data. Lower MAE/RMSE
                  and higher direction accuracy indicate better in-sample performance, but do
                  not guarantee future accuracy.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
