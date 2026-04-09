/**
 * Print API Client — gọi từ browser → Server (qua Vite proxy)
 */

async function callPrintAPI(endpoint, data) {
  try {
    const res = await fetch(`${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Lỗi in');
    return json;
  } catch (err) {
    console.warn('[Print]', err.message);
    return { success: false, error: err.message };
  }
}

export async function printKitchenTicket({ orderId, tableName, items, note, staffName }) {
  return callPrintAPI('/api/print/kitchen', {
    orderId,
    tableName,
    items,
    note,
    staffName,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  });
}

export async function printReceipt({ orderId, tableName, items, total, paymentMethod, staffName }) {
  return callPrintAPI('/api/print/receipt', {
    orderId,
    tableName,
    items,
    total,
    paymentMethod,
    staffName,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  });
}

export async function testPrinterConnection() {
  try {
    const res = await fetch(`/api/printer/test`);
    return await res.json();
  } catch {
    return { connected: false, error: 'Print server không chạy' };
  }
}
