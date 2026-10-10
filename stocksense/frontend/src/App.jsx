import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import Compare from './pages/Compare';
import Watchlist from './pages/Watchlist';
import Performance from './pages/Performance';
import Learn from './pages/Learn';
import Auth from './pages/Auth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="compare" element={<Compare />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="performance" element={<Performance />} />
        <Route path="learn" element={<Learn />} />
        <Route path="auth" element={<Auth />} />
      </Route>
    </Routes>
  );
}
