import { create } from 'zustand';
import { INITIAL_TABLES, MENU_ITEMS, generateOrderId } from '../data/mockData';

// Load from localStorage
function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(`orderflow_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

function saveState(key, value) {
  try {
    localStorage.setItem(`orderflow_${key}`, JSON.stringify(value));
  } catch { /* quota exceeded */ }
}

const useStore = create((set, get) => ({
  // --- Role ---
  role: loadState('role', 'order'),
  setRole: (role) => {
    saveState('role', role);
    set({ role });
  },

  // --- Tables ---
  tables: loadState('tables', INITIAL_TABLES),
  selectedTableId: null,

  selectTable: (tableId) => set({ selectedTableId: tableId }),

  updateTable: (tableId, updates) => {
    const tables = get().tables.map(t =>
      t.id === tableId ? { ...t, ...updates } : t
    );
    saveState('tables', tables);
    set({ tables });
  },

  // --- Current Cart (for ordering) ---
  cart: [],
  cartNote: '',

  addToCart: (itemId) => {
    const cart = [...get().cart];
    const existing = cart.find(c => c.itemId === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      const item = MENU_ITEMS.find(m => m.id === itemId);
      cart.push({ itemId, name: item.name, price: item.price, image: item.image, quantity: 1 });
    }
    set({ cart });
  },

  removeFromCart: (itemId) => {
    const cart = get().cart.filter(c => c.itemId !== itemId);
    set({ cart });
  },

  updateCartQty: (itemId, delta) => {
    const cart = get().cart.map(c => {
      if (c.itemId === itemId) {
        const qty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: qty };
      }
      return c;
    }).filter(c => c.quantity > 0);
    set({ cart });
  },

  setCartNote: (note) => set({ cartNote: note }),

  clearCart: () => set({ cart: [], cartNote: '' }),

  // --- Orders (sent to kitchen) ---
  orders: loadState('orders', []),

  sendOrderToKitchen: () => {
    const { cart, cartNote, selectedTableId, tables } = get();
    if (!cart.length || !selectedTableId) return null;

    const table = tables.find(t => t.id === selectedTableId);
    const orderId = generateOrderId();
    const order = {
      id: orderId,
      tableId: selectedTableId,
      tableName: table.name,
      items: [...cart],
      note: cartNote,
      status: 'pending', // pending | cooking | done | paid
      total: cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
      createdAt: new Date().toISOString(),
      completedAt: null,
      paidAt: null,
    };

    const orders = [...get().orders, order];
    saveState('orders', orders);

    // Update table status
    const newTables = tables.map(t =>
      t.id === selectedTableId
        ? { ...t, status: 'waiting', orderId }
        : t
    );
    saveState('tables', newTables);

    set({
      orders,
      tables: newTables,
      cart: [],
      cartNote: '',
      selectedTableId: null,
    });

    return orderId;
  },

  // Kitchen actions
  startCooking: (orderId) => {
    const orders = get().orders.map(o =>
      o.id === orderId ? { ...o, status: 'cooking' } : o
    );
    saveState('orders', orders);
    set({ orders });
  },

  completeOrder: (orderId) => {
    const orders = get().orders.map(o =>
      o.id === orderId ? { ...o, status: 'done', completedAt: new Date().toISOString() } : o
    );
    saveState('orders', orders);

    // Update table
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const tables = get().tables.map(t =>
        t.id === order.tableId ? { ...t, status: 'served' } : t
      );
      saveState('tables', tables);
      set({ orders, tables });
    } else {
      set({ orders });
    }
  },

  // Payment
  payOrder: (orderId) => {
    const orders = get().orders.map(o =>
      o.id === orderId ? { ...o, status: 'paid', paidAt: new Date().toISOString() } : o
    );
    saveState('orders', orders);

    const order = orders.find(o => o.id === orderId);
    if (order) {
      const tables = get().tables.map(t =>
        t.id === order.tableId ? { ...t, status: 'empty', orderId: null } : t
      );
      saveState('tables', tables);
      set({ orders, tables, selectedTableId: null });
    } else {
      set({ orders });
    }
  },

  // --- Toasts / Notifications ---
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    }, 3500);
  },

  // --- Admin helpers ---
  getStats: () => {
    const orders = get().orders;
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'done' || o.status === 'paid').length;

    // Top items
    const itemCounts = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, image: item.image, count: 0, revenue: 0 };
        }
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Revenue by hour
    const revenueByHour = {};
    paidOrders.forEach(o => {
      const h = new Date(o.paidAt).getHours();
      revenueByHour[h] = (revenueByHour[h] || 0) + o.total;
    });

    return { totalRevenue, totalOrders, completedOrders, paidOrders: paidOrders.length, topItems, revenueByHour };
  },

  // Reset all data
  resetAll: () => {
    localStorage.removeItem('orderflow_tables');
    localStorage.removeItem('orderflow_orders');
    set({ tables: INITIAL_TABLES, orders: [], cart: [], cartNote: '', selectedTableId: null });
  },
}));

export default useStore;
