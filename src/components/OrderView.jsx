import { useState } from 'react';
import useStore from '../store/useStore';
import { MENU_ITEMS, MENU_CATEGORIES, TABLE_STATUS_CONFIG, formatCurrency } from '../data/mockData';
import './OrderView.css';

export default function OrderView() {
  const tables = useStore(s => s.tables);
  const selectedTableId = useStore(s => s.selectedTableId);
  const selectTable = useStore(s => s.selectTable);
  const cart = useStore(s => s.cart);
  const cartNote = useStore(s => s.cartNote);
  const addToCart = useStore(s => s.addToCart);
  const updateCartQty = useStore(s => s.updateCartQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const setCartNote = useStore(s => s.setCartNote);
  const sendOrderToKitchen = useStore(s => s.sendOrderToKitchen);
  const orders = useStore(s => s.orders);
  const payOrder = useStore(s => s.payOrder);
  const addToast = useStore(s => s.addToast);

  const [activeCategory, setActiveCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableOrder = selectedTable?.orderId
    ? orders.find(o => o.id === selectedTable.orderId)
    : null;

  const filteredItems = activeCategory === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(m => m.category === activeCategory);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleSendOrder = () => {
    if (!selectedTableId) {
      addToast('Vui lòng chọn bàn trước!', 'warning');
      return;
    }
    if (!cart.length) {
      addToast('Vui lòng chọn món!', 'warning');
      return;
    }
    const orderId = sendOrderToKitchen();
    if (orderId) {
      addToast(`Đã gửi đơn ${orderId} cho bếp!`, 'success');
      setShowCart(false);
    }
  };

  const handlePay = (orderId) => {
    payOrder(orderId);
    addToast('Thanh toán thành công!', 'success');
    setShowPayment(false);
  };

  // Check if table has served order ready for payment
  const servedOrders = orders.filter(o => o.status === 'done');

  return (
    <div className="order-view" id="order-view">
      {/* Table Grid */}
      <section className="order-view__tables" id="table-grid-section">
        <div className="section-header">
          <h2 className="section-title">Sơ đồ bàn</h2>
          <div className="table-legend">
            {Object.entries(TABLE_STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="table-legend__item">
                <span className={`table-legend__dot table-legend__dot--${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        <div className="table-grid" id="table-grid">
          {tables.map(t => {
            const cfg = TABLE_STATUS_CONFIG[t.status];
            const isSelected = selectedTableId === t.id;
            const tOrder = t.orderId ? orders.find(o => o.id === t.orderId) : null;
            return (
              <button
                key={t.id}
                id={`table-${t.id}`}
                className={`table-card table-card--${cfg.color} ${isSelected ? 'table-card--selected' : ''}`}
                onClick={() => {
                  selectTable(t.id);
                  if (t.status === 'served') setShowPayment(true);
                  else setShowPayment(false);
                }}
              >
                <span className="table-card__icon">{cfg.icon}</span>
                <span className="table-card__name">{t.name}</span>
                <span className="table-card__seats">{t.seats} ghế</span>
                <span className={`table-card__status table-card__status--${cfg.color}`}>
                  {cfg.label}
                </span>
                {tOrder && (
                  <span className="table-card__total">
                    {formatCurrency(tOrder.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Payment Modal for served tables */}
      {showPayment && selectedTable && selectedTable.status === 'served' && tableOrder && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div className="payment-modal__header">
              <h3>💰 Thanh toán - {selectedTable.name}</h3>
              <button className="modal-close" onClick={() => setShowPayment(false)}>✕</button>
            </div>
            <div className="payment-modal__body">
              <div className="payment-items">
                {tableOrder.items.map((item, i) => (
                  <div key={i} className="payment-item">
                    <span className="payment-item__name">
                      {item.image} {item.name} × {item.quantity}
                    </span>
                    <span className="payment-item__price">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="payment-total">
                <span>Tổng cộng</span>
                <span className="payment-total__amount">{formatCurrency(tableOrder.total)}</span>
              </div>
            </div>
            <div className="payment-modal__actions">
              <button className="btn btn--secondary" onClick={() => setShowPayment(false)}>Huỷ</button>
              <button className="btn btn--primary btn--lg" id="btn-pay" onClick={() => handlePay(tableOrder.id)}>
                💵 Thanh toán tiền mặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu + Cart */}
      <section className="order-view__menu" id="menu-section">
        <div className="section-header">
          <h2 className="section-title">
            {selectedTable ? `🍽️ Gọi món - ${selectedTable.name}` : '🍽️ Chọn bàn để gọi món'}
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" id="category-tabs">
          <button
            className={`category-tab ${activeCategory === 'all' ? 'category-tab--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            🔥 Tất cả
          </button>
          {MENU_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'category-tab--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid" id="menu-grid">
          {filteredItems.map(item => {
            const inCart = cart.find(c => c.itemId === item.id);
            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                className={`menu-card ${inCart ? 'menu-card--in-cart' : ''}`}
                onClick={() => {
                  if (!selectedTableId || selectedTable?.status === 'waiting' || selectedTable?.status === 'served') {
                    if (!selectedTableId) addToast('Chọn bàn trống trước!', 'warning');
                    else addToast('Bàn này đang chờ/đã ra món, không thể gọi thêm!', 'warning');
                    return;
                  }
                  addToCart(item.id);
                }}
                disabled={!selectedTableId || selectedTable?.status === 'waiting' || selectedTable?.status === 'served'}
              >
                <span className="menu-card__image">{item.image}</span>
                <span className="menu-card__name">{item.name}</span>
                <span className="menu-card__price">{formatCurrency(item.price)}</span>
                {item.popular && <span className="menu-card__badge">HOT</span>}
                {inCart && (
                  <span className="menu-card__qty">{inCart.quantity}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && (
        <button className="fab-cart" id="fab-cart" onClick={() => setShowCart(true)}>
          <span className="fab-cart__icon">🛒</span>
          <span className="fab-cart__count">{cartCount}</span>
          <span className="fab-cart__total">{formatCurrency(cartTotal)}</span>
        </button>
      )}

      {/* Cart Panel */}
      {(showCart || cartCount > 0) && (
        <aside className={`cart-panel ${showCart ? 'cart-panel--open' : ''}`} id="cart-panel">
          <div className="cart-panel__header">
            <h3>🛒 Đơn hàng ({cartCount})</h3>
            <button className="modal-close cart-panel__close-mobile" onClick={() => setShowCart(false)}>✕</button>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty__icon">🍽️</span>
              <p>Chưa có món nào</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(c => (
                  <div key={c.itemId} className="cart-item">
                    <span className="cart-item__image">{c.image}</span>
                    <div className="cart-item__info">
                      <span className="cart-item__name">{c.name}</span>
                      <span className="cart-item__price">{formatCurrency(c.price)}</span>
                    </div>
                    <div className="cart-item__qty-controls">
                      <button className="qty-btn" onClick={() => updateCartQty(c.itemId, -1)}>−</button>
                      <span className="qty-value">{c.quantity}</span>
                      <button className="qty-btn" onClick={() => updateCartQty(c.itemId, +1)}>+</button>
                    </div>
                    <button className="cart-item__remove" onClick={() => removeFromCart(c.itemId)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="cart-note">
                <textarea
                  id="cart-note-input"
                  className="cart-note__input"
                  placeholder="Ghi chú cho bếp (ít cay, bỏ hành...)"
                  value={cartNote}
                  onChange={e => setCartNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Tổng cộng</span>
                  <span className="cart-total__amount">{formatCurrency(cartTotal)}</span>
                </div>
                <button className="btn btn--primary btn--lg btn--full" id="btn-send-kitchen" onClick={handleSendOrder}>
                  📤 Gửi cho bếp
                </button>
              </div>
            </>
          )}
        </aside>
      )}

      {/* Served Orders Notification Bar */}
      {servedOrders.length > 0 && (
        <div className="served-bar" id="served-bar">
          {servedOrders.map(o => (
            <div key={o.id} className="served-bar__item">
              <span>✅ {o.tableName} đã ra món!</span>
              <button className="btn btn--accent btn--sm" onClick={() => {
                selectTable(o.tableId);
                setShowPayment(true);
              }}>
                Thanh toán
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
