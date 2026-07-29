import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import useStore from '../store/useStore';
import { formatCurrency, STAFF_LIST, ORDER_TYPES, RESTAURANT_INFO, vnDateStr, vnMonthStr } from '../data/mockData';
import {
  LayoutDashboard, Trash2, CircleDollarSign, Package, Armchair,
  TrendingUp, Users, ClipboardList, Trophy, Timer, Flame,
  CircleCheck, Banknote, UserRound, BarChart3, Landmark, Lock, Calendar, Download, Settings
} from 'lucide-react';
import AdminSettings from './AdminSettings';
import './AdminView.css';

export default function AdminView() {
  const getStats = useStore(s => s.getStats);
  const orders = useStore(s => s.orders);
  const tables = useStore(s => s.tables);
  const resetAll = useStore(s => s.resetAll);
  const addToast = useStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('all'); // all, day, month
  const [filterDate, setFilterDate] = useState(vnDateStr());
  const [filterMonth, setFilterMonth] = useState(vnMonthStr());

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterType === 'all') return true;
      const orderDateStr = o.createdAt || o.created_at;
      if (!orderDateStr) return false;
      // Compare using Vietnam local date (UTC+7), not the browser/server's own timezone
      if (filterType === 'day') {
        return vnDateStr(new Date(orderDateStr)) === filterDate;
      }
      if (filterType === 'month') {
        return vnMonthStr(new Date(orderDateStr)) === filterMonth;
      }
      return true;
    });
  }, [orders, filterType, filterDate, filterMonth]);

  const stats = useMemo(() => getStats(filteredOrders), [filteredOrders, getStats]);

  const MONEY_FMT = '#,##0" đ"';

  const exportExcel = () => {
    const paidOrders = filteredOrders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgPerOrder = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;
    const periodLabel =
      filterType === 'day' ? `Theo ngày ${new Date(filterDate + 'T00:00:00').toLocaleDateString('vi-VN')}` :
      filterType === 'month' ? `Theo tháng ${filterMonth}` :
      'Toàn bộ thời gian';

    // ───────────── Sheet 1: Tổng Quan ─────────────
    const overview = [];
    const moneyCells = []; // cells to reformat as currency after the sheet is built
    const addRow = (row) => overview.push(row) - 1;

    addRow([RESTAURANT_INFO.name]);
    addRow([RESTAURANT_INFO.address]);
    addRow([]);
    addRow(['Kỳ báo cáo', periodLabel]);
    addRow(['Xuất lúc', new Date().toLocaleString('vi-VN')]);
    addRow([]);
    addRow(['CHỈ SỐ TỔNG QUAN']);
    moneyCells.push({ r: addRow(['Doanh thu', totalRevenue]), c: 1 });
    addRow(['Số đơn đã thanh toán', paidOrders.length]);
    addRow(['Tổng số đơn (mọi trạng thái)', filteredOrders.length]);
    moneyCells.push({ r: addRow(['Giá trị trung bình / đơn', avgPerOrder]), c: 1 });
    addRow(['Tổng số khách', stats.totalGuests || 0]);
    addRow([]);
    addRow(['PHÂN LOẠI ĐƠN']);
    ORDER_TYPES.forEach(t => addRow([t.label, stats.ordersByType?.[t.id] || 0]));
    addRow([]);
    addRow(['MÓN BÁN CHẠY (TOP 8)']);
    addRow(['Hạng', 'Tên món', 'Số lượng bán', 'Doanh thu']);
    stats.topItems.forEach((item, i) => {
      moneyCells.push({ r: addRow([i + 1, item.name, item.count, item.revenue]), c: 3 });
    });

    const wsOverview = XLSX.utils.aoa_to_sheet(overview);
    wsOverview['!cols'] = [{ wch: 26 }, { wch: 26 }, { wch: 16 }, { wch: 16 }];
    moneyCells.forEach(({ r, c }) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (wsOverview[ref]) wsOverview[ref].z = MONEY_FMT;
    });

    // ───────────── Sheet 2: Chi Tiết Đơn Hàng ─────────────
    const HEADER = ['Mã Đơn', 'Ngày', 'Giờ Vào', 'Giờ Thanh Toán', 'Khu/Bàn', 'Loại Đơn', 'Thu Ngân', 'Khách', 'Món Đã Gọi', 'Tổng Tiền', 'Thanh Toán', 'Trạng Thái'];
    const detailRows = filteredOrders.map(o => {
      const created = new Date(o.createdAt || o.created_at);
      const paidTime = o.paidAt || o.paid_at;
      return {
        'Mã Đơn': o.id,
        'Ngày': vnDateStr(created),
        'Giờ Vào': created.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        'Giờ Thanh Toán': paidTime ? new Date(paidTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        'Khu/Bàn': o.tableName,
        'Loại Đơn': ORDER_TYPES.find(t => t.id === (o.orderType || o.order_type))?.label || 'Tại bàn',
        'Thu Ngân': o.staffName || STAFF_LIST.find(s => s.id === o.staffId)?.name || '—',
        'Khách': o.guestCount || 0,
        'Món Đã Gọi': (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', '),
        'Tổng Tiền': o.total,
        'Thanh Toán': o.paymentMethod === 'cash' ? 'Tiền Mặt' : o.paymentMethod === 'transfer' ? 'Chuyển Khoản' : '',
        'Trạng Thái': o.status === 'paid' ? 'Đã thu tiền' : o.status === 'done' ? 'Đã ra món' : o.status,
      };
    });

    const wsDetail = detailRows.length ? XLSX.utils.json_to_sheet(detailRows) : XLSX.utils.aoa_to_sheet([HEADER]);
    const moneyColIdx = HEADER.indexOf('Tổng Tiền');
    const range = XLSX.utils.decode_range(wsDetail['!ref']);

    for (let r = 1; r <= range.e.r; r++) {
      const ref = XLSX.utils.encode_cell({ r, c: moneyColIdx });
      if (wsDetail[ref]) wsDetail[ref].z = MONEY_FMT;
    }

    // Totals row + autofilter on the header
    wsDetail['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: range.e.r, c: range.e.c } }) };
    const totalRow = range.e.r + 1;
    wsDetail[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = { t: 's', v: `TỔNG CỘNG (${filteredOrders.length} đơn)` };
    wsDetail[XLSX.utils.encode_cell({ r: totalRow, c: moneyColIdx })] = { t: 'n', v: filteredOrders.reduce((s, o) => s + o.total, 0), z: MONEY_FMT };
    wsDetail['!ref'] = XLSX.utils.encode_range({ s: range.s, e: { r: totalRow, c: range.e.c } });

    wsDetail['!cols'] = [
      { wch: 16 }, // Mã Đơn
      { wch: 12 }, // Ngày
      { wch: 9 },  // Giờ Vào
      { wch: 13 }, // Giờ Thanh Toán
      { wch: 10 }, // Khu/Bàn
      { wch: 11 }, // Loại Đơn
      { wch: 13 }, // Thu Ngân
      { wch: 8 },  // Khách
      { wch: 55 }, // Món Đã Gọi
      { wch: 14 }, // Tổng Tiền
      { wch: 13 }, // Thanh Toán
      { wch: 13 }, // Trạng Thái
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng Quan');
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi Tiết Đơn Hàng');

    let fName = 'BaoCao_ToanBo.xlsx';
    if (filterType === 'day') fName = `BaoCao_Ngay_${filterDate}.xlsx`;
    if (filterType === 'month') fName = `BaoCao_Thang_${filterMonth}.xlsx`;

    XLSX.writeFile(wb, fName);
  };

  const activeTables = tables.filter(t => t.status !== 'empty').length;

  const handleReset = () => {
    if (window.confirm('Xoá tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
      resetAll();
      addToast('Đã xoá toàn bộ dữ liệu!', 'warning');
    }
  };

  // Note: maxCount computed inside render to avoid -Infinity when topItems is empty

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="admin-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', gap: 'var(--space-4)' }}>
        <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
          <Lock size={40} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
          <h3>Xác thực Quản trị</h3>
          <input 
            type="password" 
            value={passInput} 
            onChange={e => setPassInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (passInput === '123456') {
                  setIsAuthenticated(true);
                } else {
                  addToast('Sai mật khẩu!', 'error');
                }
              }
            }}
            placeholder="Nhập 123456..." 
            style={{ padding: '10px 14px', fontSize: '16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', width: '100%', outline: 'none' }}
            autoFocus
          />
          <button 
            className="btn btn--primary" 
            onClick={() => {
              if (passInput === '123456') {
                setIsAuthenticated(true);
              } else {
                addToast('Sai mật khẩu!', 'error');
              }
            }}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view" id="admin-view">
      <div className="admin-view__header" style={{ marginBottom: '10px' }}>
        <div>
          <h2 className="section-title"><LayoutDashboard size={20} /> Ban Quản Trị</h2>
          <span className="admin-view__subtitle">Hệ thống phân tích · {RESTAURANT_INFO.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${activeTab === 'dashboard' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setActiveTab('dashboard')}>
            <BarChart3 size={16} /> Thống Kê
          </button>
          <button className={`btn ${activeTab === 'settings' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setActiveTab('settings')}>
            <Settings size={16} /> Cài Đặt
          </button>
          <button className="btn btn--danger" id="btn-reset" onClick={handleReset}>
            <Trash2 size={16} /> Xóa Dữ Liệu
          </button>
        </div>
      </div>
      
      {activeTab === 'settings' ? (
        <AdminSettings />
      ) : (
      <>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--color-surface)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <strong><Calendar size={18} /> Bộ Lọc:</strong>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
          <option value="all">Tất cả thời gian</option>
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
        </select>
        
        {filterType === 'day' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />}
        {filterType === 'month' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />}

        <button className="btn btn--primary" onClick={exportExcel} style={{ marginLeft: 'auto' }}>
          <Download size={16} /> Xuất Excel
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
            {stats.topItems.map((item, i) => {
              const maxCount = Math.max(...stats.topItems.map(x => x.count), 1);
              return (
                <div key={i} className="top-item">
                  <div className="top-item__rank">#{i + 1}</div>
                  <img className="top-item__image" src={item.image || '/food/topping.png'} alt={item.name} onError={e => { e.target.src = '/food/topping.png'; }} />
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
              );
            })}
          </div>
        )}
      </div>


      {/* Order History — Grouped by Date */}
      <div className="admin-section" id="order-history-section">
        <h3 className="admin-section__title"><ClipboardList size={16} /> Lịch sử đơn hàng ({filteredOrders.length})</h3>
        {filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <ClipboardList size={32} strokeWidth={1.5} />
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (() => {
          // Group orders by date — use Vietnam timezone (UTC+7)
          const grouped = {};
          [...filteredOrders].reverse().forEach(order => {
            const dateStr = order.createdAt || order.created_at;
            let dateKey = 'unknown';
            if (dateStr) {
              // Convert to Vietnam local date (UTC+7) to avoid grouping midnight orders on wrong day
              dateKey = vnDateStr(new Date(dateStr));
            }
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(order);
          });
          return (
            <div className="order-history">
              {Object.entries(grouped).map(([dateKey, dateOrders]) => (
                <div key={dateKey}>
                  <div className="order-history__date-header">
                    <Calendar size={14} />
                    <span>{dateKey === 'unknown' ? 'Không rõ ngày' : new Date(dateKey + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <span className="order-history__date-count">{dateOrders.length} đơn</span>
                  </div>
                  {dateOrders.map(order => (
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
                        {(order.items || []).map((item, i) => (
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
                        <span className="order-row__time" title="Giờ tạo đơn">
                          Vào: {new Date(order.createdAt || order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(order.paidAt || order.paid_at) && (
                          <span className="order-row__time order-row__time--paid" title="Giờ thanh toán">
                            Ra: {new Date(order.paidAt || order.paid_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      </>
      )}
    </div>
  );
}
