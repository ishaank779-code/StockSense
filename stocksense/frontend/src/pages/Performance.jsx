import { useEffect, useState } from 'react';
import { AlertTriangle, Play } from 'lucide-react';
import { getPerformanceSummary, evaluateModel } from '../services/api';

export default function Performance() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalSymbol, setEvalSymbol] = useState('AAPL');
  const [evalModel, setEvalModel] = useState('ensemble');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    getPerformanceSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError(null);
    setEvalResult(null);
    try {
      const res = await evaluateModel(evalSymbol.trim().toUpperCase(), evalModel);
      setEvalResult(res.data);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div>
      <div className="disclaimer">
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Model metrics reflect performance on historical hold-out data. They do not predict
          future accuracy.
        </span>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Model Performance Dashboard
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Evaluate models on any symbol and track MAE, RMSE, MAPE and direction accuracy over time.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Run Evaluation</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={evalSymbol}
            onChange={(e) => setEvalSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol"
            style={{ width: 140 }}
          />
          <select value={evalModel} onChange={(e) => setEvalModel(e.target.value)}>
            <option value="ensemble">Ensemble</option>
            <option value="xgboost">XGBoost</option>
            <option value="arima">ARIMA</option>
          </select>
          <button className="btn btn-primary" onClick={handleEvaluate} disabled={evaluating}>
            <Play size={14} />
            {evaluating ? 'Evaluating...' : 'Evaluate & Store'}
          </button>
        </div>
        {error && (
          <div style={{ color: 'var(--bearish)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        {evalResult && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              fontSize: '0.9rem',
            }}
          >
            <strong>{evalResult.performance?.symbol}</strong> · {evalResult.performance?.model_type}{' '}
            · Trend: <span className={`badge badge-${evalResult.trend}`}>{evalResult.trend}</span>
            <div style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
              MAE: {evalResult.performance?.mae?.toFixed(3)} · RMSE:{' '}
              {evalResult.performance?.rmse?.toFixed(3)} · Dir Acc:{' '}
              {evalResult.performance?.direction_accuracy?.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : !summary || summary.total_evaluations === 0 ? (
        <div className="empty-state">
          <h3>No evaluations yet</h3>
          <p>Run an evaluation above to populate the dashboard.</p>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Evaluations</div>
              <div className="stat-value">{summary.total_evaluations}</div>
            </div>
            {Object.entries(summary.by_model || {}).map(([model, m]) => (
              <div className="stat-card" key={model}>
                <div className="stat-label">{model}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                  {m.count} runs
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Avg MAE {m.avg_mae} · Dir {m.avg_direction_accuracy}%
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Recent Evaluations</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Model</th>
                    <th>MAE</th>
                    <th>RMSE</th>
                    <th>MAPE %</th>
                    <th>Dir Acc %</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.recent || []).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.symbol}</td>
                      <td>{r.model_type}</td>
                      <td>{r.mae?.toFixed(3)}</td>
                      <td>{r.rmse?.toFixed(3)}</td>
                      <td>{r.mape?.toFixed(2)}</td>
                      <td>{r.direction_accuracy?.toFixed(1)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {r.evaluated_at
                          ? new Date(r.evaluated_at).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
