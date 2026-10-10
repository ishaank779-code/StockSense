import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  BarChart3,
  BookOpen,
  LogIn,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze', icon: TrendingUp, label: 'Analyze & Forecast' },
  { to: '/compare', icon: BarChart3, label: 'Compare' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/performance', icon: BarChart3, label: 'Model Performance' },
  { to: '/learn', icon: BookOpen, label: 'Learn ML' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/analyze?symbol=${search.trim().toUpperCase()}`);
      setSearch('');
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">SS</div>
          <div>
            <h1>StockSense</h1>
            <span>ML Market Analyzer</span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div>
              <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
                {user.username}
              </div>
              <button className="btn btn-ghost" onClick={logout} style={{ padding: '0.3rem 0' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <NavLink to="/auth" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <LogIn size={18} /> Sign In
            </NavLink>
          )}
          <div style={{ marginTop: 10, fontSize: '0.7rem' }}>
            Educational use only · Not financial advice
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button
            className="btn btn-ghost"
            style={{ display: 'none' }}
            id="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <form onSubmit={handleSearch} className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search symbol (e.g. AAPL, RELIANCE.NS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {user ? `Hi, ${user.username}` : 'Guest'}
            </span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
