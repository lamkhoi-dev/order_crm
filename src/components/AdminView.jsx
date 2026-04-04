import { useMemo } from 'react';
import useStore from '../store/useStore';
import { formatCurrency, STAFF_LIST, ORDER_TYPES, RESTAURANT_INFO } from '../data/mockData';
import {
  LayoutDashboard, Trash2, CircleDollarSign, Package, Armchair,
  TrendingUp, Users, ClipboardList, Trophy, Timer, Flame,
  CircleCheck, Banknote, UserRound, BarChart3, Landmark
} from 'lucide-react';
import './AdminView.css';

export default function AdminView() {
  const getStats = useStore(s => s.getStats);
  const orders = useStore(s => s.orders);
  const tables = useStore(s => s.tables);
  const resetAll = useStore(s => s.resetAll);
  const addToast = useStore(s => s.addToast);

  const stats = useMemo(() => getStats(), [orders]);

  const activeTables = tables.filter(t => t.status !== 'empty').length;

  const handleReset = () => {
    if (window.confirm('Xoá tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
      resetAll();
      addToast('Đã xoá toàn bộ dữ liệu!', 'warning');
    }
  };

  const maxCount = Math.max(...stats.topItems.map(i => i.count), 1);

  return (
    <div className="admin-view" id="admin-view">
      <div className="admin-view__header">
        <div>
          <h2 className="section-title"><LayoutDashboard size={20} /> Dashboard</h2>
          <span className="admin-view__subtitle">Tổng quan hoạt động · {RESTAURANT_INFO.name}</span>
        </div>
        <button className="btn btn--danger btn--sm" id="btn-reset" onClick={handleReset}>
          <Trash2 size={14} /> Reset dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" id="kpi-grid">
        <div className="kpi-card kpi-card--revenue">
          <div className="kpi-card__icon"><CircleDollarSign size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Doanh thu</span>
            <span className="kpi-card__value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="kpi-card__sub">{stats.paidOrders} đơn đã thanh toán</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--orders">
          <div className="kpi-card__icon"><Package size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Tổng đơn hàng</span>
            <span className="kpi-card__value">{stats.totalOrders}</span>
            <span className="kpi-card__sub">{stats.completedOrders} đã hoàn thành</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--tables">
          <div className="kpi-card__icon"><Armchair size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Bàn đang phục vụ</span>
            <span className="kpi-card__value">{activeTables}/{tables.length}</span>
            <span className="kpi-card__sub">{tables.length - activeTables} bàn trống</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--avg">
          <div className="kpi-card__icon"><TrendingUp size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">TB / Đơn</span>
            <span className="kpi-card__value">
              {stats.paidOrders > 0
                ? formatCurrency(Math.round(stats.totalRevenue / stats.paidOrders))
                : '—'
              }
            </span>
            <span className="kpi-card__sub">Giá trị trung bình</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--guests">
          <div className="kpi-card__icon"><Users size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Tổng khách</span>
            <span className="kpi-card__value">{stats.totalGuests || 0}</span>
            <span className="kpi-card__sub">
              {stats.paidOrders > 0 ? `TB ${Math.round(stats.totalGuests / stats.paidOrders)} khách/đơn` : 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-card--types">
          <div className="kpi-card__icon"><ClipboardList size={22} /></div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Loại đơn</span>
            <div className="kpi-card__types">
              {ORDER_TYPES.map(t => (
                <span key={t.id} className="kpi-card__type-item">
                  {t.label} {stats.ordersByType?.[t.id] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Items Chart */}
      <div className="admin-section" id="top-items-section">
        <h3 className="admin-section__title"><Trophy size={16} /> Món bán chạy</h3>
        {stats.topItems.length === 0 ? (
          <div className="admin-empty">
            <BarChart3 size={32} strokeWidth={1.5} />
            <p>Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="top-items-chart">
            {stats.topItems.map((item, i) => (
              <div key={i} className="top-item">
                <div className="top-item__rank">#{i + 1}</div>
                <img className="top-item__image" src={item.image} alt={item.name} />
                <div className="top-item__info">
                  <span className="top-item__name">{item.name}</span>
                  <div className="top-item__bar-container">
                    <div
                      className="top-item__bar"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="top-item__stats">
                  <span className="top-item__count">{item.count} phần</span>
                  <span className="top-item__revenue">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="admin-section" id="order-history-section">
        <h3 className="admin-section__title"><ClipboardList size={16} /> Lịch sử đơn hàng</h3>
        {orders.length === 0 ? (
          <div className="admin-empty">
            <ClipboardList size={32} strokeWidth={1.5} />
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="order-history">
            {[...orders].reverse().map(order => (
              <div key={order.id} className="order-row" id={`order-row-${order.id}`}>
                <div className="order-row__main">
                  <span className={`order-row__status order-row__status--${order.status}`}>
                    {order.status === 'pending' && <Timer size={16} />}
                    {order.status === 'cooking' && <Flame size={16} />}
                    {order.status === 'done' && <CircleCheck size={16} />}
                    {order.status === 'paid' && <Banknote size={16} />}
                  </span>
                  <div className="order-row__info">
                    <span className="order-row__id">{order.id}</span>
                    <span className="order-row__table">{order.tableName}</span>
                  </div>
                </div>
                <div className="order-row__items">
                  {order.items.map((item, i) => (
                    <span key={i} className="order-row__item-tag">
                      {item.name} ×{item.quantity}
                    </span>
                  ))}
                </div>
                <div className="order-row__extra">
                  {order.guestCount > 0 && <span><Users size={11} /> {order.guestCount}</span>}
                  {order.staffId && <span><UserRound size={11} /> {STAFF_LIST.find(s => s.id === order.staffId)?.name}</span>}
                  {order.orderType && order.orderType !== 'dine_in' && (
                    <span>{ORDER_TYPES.find(t => t.id === order.orderType)?.label}</span>
                  )}
                </div>
                <div className="order-row__meta">
                  <span className="order-row__total">{formatCurrency(order.total)}</span>
                  {order.paymentMethod && (
                    <span className={`order-row__payment order-row__payment--${order.paymentMethod}`}>
                      {order.paymentMethod === 'cash' ? <Banknote size={11} /> : <Landmark size={11} />}
                      {order.paymentMethod === 'cash' ? 'TM' : 'CK'}
                    </span>
                  )}
                  <span className="order-row__time">
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
