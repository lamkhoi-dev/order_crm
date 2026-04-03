import { useMemo } from 'react';
import useStore from '../store/useStore';
import { formatCurrency } from '../data/mockData';
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

  // Simple bar chart for top items
  const maxCount = Math.max(...stats.topItems.map(i => i.count), 1);

  return (
    <div className="admin-view" id="admin-view">
      <div className="admin-view__header">
        <div>
          <h2 className="section-title">📊 Dashboard</h2>
          <span className="admin-view__subtitle">Tổng quan hoạt động nhà hàng</span>
        </div>
        <button className="btn btn--danger btn--sm" id="btn-reset" onClick={handleReset}>
          🗑️ Reset dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" id="kpi-grid">
        <div className="kpi-card kpi-card--revenue">
          <div className="kpi-card__icon">💰</div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Doanh thu</span>
            <span className="kpi-card__value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="kpi-card__sub">{stats.paidOrders} đơn đã thanh toán</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--orders">
          <div className="kpi-card__icon">📦</div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Tổng đơn hàng</span>
            <span className="kpi-card__value">{stats.totalOrders}</span>
            <span className="kpi-card__sub">{stats.completedOrders} đã hoàn thành</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--tables">
          <div className="kpi-card__icon">🪑</div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Bàn đang phục vụ</span>
            <span className="kpi-card__value">{activeTables}/{tables.length}</span>
            <span className="kpi-card__sub">{tables.length - activeTables} bàn trống</span>
          </div>
        </div>

        <div className="kpi-card kpi-card--avg">
          <div className="kpi-card__icon">📈</div>
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
      </div>

      {/* Top Items Chart */}
      <div className="admin-section" id="top-items-section">
        <h3 className="admin-section__title">🏆 Món bán chạy</h3>
        {stats.topItems.length === 0 ? (
          <div className="admin-empty">
            <span>📊</span>
            <p>Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="top-items-chart">
            {stats.topItems.map((item, i) => (
              <div key={i} className="top-item">
                <div className="top-item__rank">#{i + 1}</div>
                <span className="top-item__image">{item.image}</span>
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
        <h3 className="admin-section__title">📋 Lịch sử đơn hàng</h3>
        {orders.length === 0 ? (
          <div className="admin-empty">
            <span>📋</span>
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="order-history">
            {[...orders].reverse().map(order => (
              <div key={order.id} className="order-row" id={`order-row-${order.id}`}>
                <div className="order-row__main">
                  <span className={`order-row__status order-row__status--${order.status}`}>
                    {order.status === 'pending' && '⏳'}
                    {order.status === 'cooking' && '🔥'}
                    {order.status === 'done' && '✅'}
                    {order.status === 'paid' && '💰'}
                  </span>
                  <div className="order-row__info">
                    <span className="order-row__id">{order.id}</span>
                    <span className="order-row__table">{order.tableName}</span>
                  </div>
                </div>
                <div className="order-row__items">
                  {order.items.map((item, i) => (
                    <span key={i} className="order-row__item-tag">
                      {item.image} ×{item.quantity}
                    </span>
                  ))}
                </div>
                <div className="order-row__meta">
                  <span className="order-row__total">{formatCurrency(order.total)}</span>
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
