import useStore from '../store/useStore';
import './Header.css';

const ROLES = [
  { id: 'order',   label: 'Order',   icon: '🛎️', desc: 'Phục vụ' },
  { id: 'kitchen', label: 'Bếp',     icon: '👨‍🍳', desc: 'Nhà bếp' },
  { id: 'admin',   label: 'Admin',   icon: '📊', desc: 'Quản lý' },
];

export default function Header() {
  const role = useStore(s => s.role);
  const setRole = useStore(s => s.setRole);
  const orders = useStore(s => s.orders);

  const pendingKitchen = orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;
  const doneOrders = orders.filter(o => o.status === 'done').length;

  return (
    <header className="header" id="main-header">
      <div className="header__brand">
        <span className="header__logo">🍽️</span>
        <div>
          <h1 className="header__title">OrderFlow</h1>
          <span className="header__subtitle">Restaurant POS</span>
        </div>
      </div>

      <nav className="header__roles" id="role-switcher">
        {ROLES.map(r => (
          <button
            key={r.id}
            id={`role-btn-${r.id}`}
            className={`header__role-btn ${role === r.id ? 'header__role-btn--active' : ''}`}
            onClick={() => setRole(r.id)}
          >
            <span className="header__role-icon">{r.icon}</span>
            <span className="header__role-label">{r.label}</span>
            {r.id === 'kitchen' && pendingKitchen > 0 && (
              <span className="header__badge header__badge--warning">{pendingKitchen}</span>
            )}
            {r.id === 'order' && doneOrders > 0 && (
              <span className="header__badge header__badge--success">{doneOrders}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="header__meta">
        <span className="header__time" id="header-time">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}
