import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { isConfigured } from './lib/firebase';
import { CreateEvent } from './pages/CreateEvent';
import { EventPage } from './pages/EventPage';
import { Setup } from './pages/Setup';

function Brand() {
  return (
    <Link to="/" className="brand">
      <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <g fill="var(--accent-text)">
          <rect x="7" y="7" width="7" height="7" rx="1.5" opacity=".55" />
          <rect x="18" y="7" width="7" height="7" rx="1.5" />
          <rect x="7" y="18" width="7" height="7" rx="1.5" />
          <rect x="18" y="18" width="7" height="7" rx="1.5" opacity=".8" />
        </g>
      </svg>
      Overlap
    </Link>
  );
}

export function App() {
  return (
    <HashRouter>
      <div className="shell">
        <nav className="topbar">
          <Brand />
          <div className="row" style={{ gap: 8 }}>
            <ThemeSwitcher />
            <Link to="/" className="btn btn-sm">
              New event
            </Link>
          </div>
        </nav>
        {isConfigured ? (
          <Routes>
            <Route path="/" element={<CreateEvent />} />
            <Route path="/e/:id" element={<EventPage />} />
            <Route path="*" element={<CreateEvent />} />
          </Routes>
        ) : (
          <Setup />
        )}
      </div>
    </HashRouter>
  );
}
