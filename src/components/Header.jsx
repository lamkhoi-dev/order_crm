import useStore from '../store/useStore';
import { RESTAURANT_INFO } from '../data/mockData';
import { Utensils, ChefHat, BarChart3, Clock } from 'lucide-react';
import React, { useState } from 'react';
import ShiftManager from './ShiftManager';
import './Header.css';

const ROLES = [
  { id: 'order',   label: 'Order',   Icon: Utensils, desc: 'Phục vụ' },
  { id: 'kitchen', label: 'Bếp',     Icon: ChefHat,  desc: 'Nhà bếp' },
  { id: 'admin',   label: 'Admin',   Icon: BarChart3, desc: 'Quản lý' },
];

export default function Header() {
  const role = useStore(s => s.role);
  const setRole = useStore(s => s.setRole);
  const orders = useStore(s => s.orders);
  const currentShift = useStore(s => s.currentShift);
  const [showShiftModal, setShowShiftModal] = useState(false);

  const pendingKitchen = orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;
  const doneOrders = orders.filter(o => o.status === 'done').length;

  return (
    <header className="header" id="main-header">
      <div className="header__brand">
        <Utensils size={22} className="header__logo-icon" />
        <div>
          <h1 className="header__title">{RESTAURANT_INFO.name}</h1>
          <span className="header__subtitle">{RESTAURANT_INFO.subtitle}</span>
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
            <r.Icon size={16} className="header__role-icon" />
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
        <button 
          className={`header__shift-btn ${currentShift ? 'active' : ''}`}
          onClick={() => setShowShiftModal(true)}
        >
          <Clock size={16} />
          <span>{currentShift ? `Đang mở: ${currentShift.name}` : 'Chưa mở ca'}</span>
        </button>
        <span className="header__time" id="header-time">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      {showShiftModal && <ShiftManager onClose={() => setShowShiftModal(false)} />}
    </header>
  );
}
