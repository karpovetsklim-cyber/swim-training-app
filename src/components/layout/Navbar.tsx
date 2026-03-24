import { Link, useLocation } from 'react-router-dom';
import { Waves, LayoutDashboard, Calendar, Zap, History, Settings } from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/session',   label: 'Session',   icon: Zap },
  { to: '/weekly',    label: 'Weekly',    icon: Calendar },
  { to: '/history',   label: 'History',   icon: History },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-black/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
          <Waves className="text-slate-500 group-hover:text-slate-300 transition-colors" size={16} />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
            SwimCoach
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-800 shrink-0" />

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active =
              pathname === to ||
              (to !== '/dashboard' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono tracking-widest uppercase whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'text-slate-100 bg-slate-800/60'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-px bg-slate-400/60 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
