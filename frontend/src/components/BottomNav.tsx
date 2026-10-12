import { Home, ScanLine, BookOpen, AlertTriangle, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/recognize', icon: ScanLine, label: '识别' },
  { to: '/vocabulary', icon: BookOpen, label: '词库' },
  { to: '/emergency', icon: AlertTriangle, label: '求助' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function BottomNav() {
  return (
    <nav
      className="shrink-0 bg-white border-t border-slate-100 px-2 pb-[max(8px,var(--safe-bottom))] pt-2 grid grid-cols-5 z-50"
      aria-label="主导航"
    >
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors ${
              isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} />
          <span className="text-[11px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
