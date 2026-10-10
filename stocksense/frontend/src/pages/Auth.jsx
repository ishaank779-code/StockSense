import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, username, password });
      }
      navigate('/watchlist');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {mode === 'login'
            ? 'Access your watchlists and saved analysis.'
            : 'Register to save watchlists and track models.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Register'}
          </button>
        </form>

        <p
          style={{
            marginTop: '1.25rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                className="btn btn-ghost"
                style={{ padding: 0, color: 'var(--accent)' }}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="btn btn-ghost"
                style={{ padding: 0, color: 'var(--accent)' }}
                onClick={() => setMode('login')}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
