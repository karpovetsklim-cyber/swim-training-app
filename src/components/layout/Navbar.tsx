import { Link, useLocation } from 'react-router-dom';
import { Waves, LayoutDashboard, Calendar, Zap, History, Settings } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/session', label: 'Session', icon: Zap },
  { to: '/weekly', label: 'Weekly', icon: Calendar },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14">
        <Link to="/" className="flex items-center gap-2 mr-8 shrink-0">
          <Waves className="text-sky-400" size={22} />
          <span className="font-semibold text-white text-sm tracking-wide">SwimCoach AI</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
