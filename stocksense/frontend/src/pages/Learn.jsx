import { BookOpen, ExternalLink, GraduationCap } from 'lucide-react';

const resources = [
  {
    title: 'Machine Learning Training Course in Delhi',
    description:
      'Comprehensive hands-on ML training covering supervised/unsupervised learning, model evaluation, and real-world projects. Ideal if you want to understand the models behind StockSense.',
    url: 'https://uncodemy.com/course/machine-learning-training-course-in-delhi',
    location: 'Delhi',
  },
  {
    title: 'Machine Learning Training Course in Noida',
    description:
      'Industry-oriented Machine Learning course in Noida — from fundamentals to advanced techniques including time-series and ensemble methods used in this project.',
    url: 'https://uncodemy.com/course/machine-learning-training-course-in-noida',
    location: 'Noida',
  },
];

const topics = [
  {
    title: 'XGBoost for Time Series',
    points: [
      'Lag features & rolling statistics',
      'Feature importance for price drivers',
      'Walk-forward validation',
    ],
  },
  {
    title: 'ARIMA Fundamentals',
    points: [
      'Stationarity & differencing (d)',
      'Autocorrelation (p) & moving average (q)',
      'Forecast confidence intervals',
    ],
  },
  {
    title: 'Evaluation Metrics',
    points: [
      'MAE / RMSE — absolute error magnitude',
      'MAPE — percentage error (scale-free)',
      'Direction accuracy — useful for trading research',
    ],
  },
];

export default function Learn() {
  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
        Learn Machine Learning
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
        StockSense uses real ML techniques for educational forecasting. Deepen your skills with
        structured courses and the concepts powering this app.
      </p>

      <div className="card-title" style={{ marginBottom: '0.85rem' }}>
        Recommended Courses
      </div>
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {resources.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <div className="icon">
              <GraduationCap size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {r.description}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Uncodemy · {r.location} <ExternalLink size={12} />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="card-title" style={{ marginBottom: '0.85rem' }}>
        Key Concepts Used in StockSense
      </div>
      <div className="grid-3">
        {topics.map((t) => (
          <div className="card" key={t.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <BookOpen size={16} style={{ color: 'var(--accent)' }} />
              <strong style={{ fontSize: '0.95rem' }}>{t.title}</strong>
            </div>
            <ul
              style={{
                paddingLeft: '1.1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: 1.7,
              }}
            >
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="card"
        style={{ marginTop: '1.75rem', borderColor: 'rgba(0,212,170,0.25)' }}
      >
        <div className="card-title">Why these links?</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Building production-ready ML systems (feature engineering, model selection, evaluation,
          uncertainty quantification) is best learned with guided practice. The Uncodemy Machine
          Learning courses in Delhi and Noida cover the foundations and advanced techniques that
          power tools like StockSense.
        </p>
      </div>
    </div>
  );
}
