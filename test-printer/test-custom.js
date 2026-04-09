/**
 * 📋 In phiếu bếp + hoá đơn mẫu
 * 
 * Chạy: node test-custom.js
 * Hoặc: node test-custom.js "XP-80C"
 */
import { EscPos, printRaw } from './printer-core.js';

const PRINTER_NAME = process.argv[2] || 'XP-80C';

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'd';
}

// --- In phiếu bếp ---
function buildKitchenTicket({ table, orderId, time, items, note }) {
  const esc = new EscPos();

  esc.init()
    .alignCenter()
    .bold(true).size(1, 1).println('PHIEU BEP').bold(false).size(0, 0)
    .newLine()

    .alignLeft()
    .println(`Don: #${orderId}`)
    .bold(true).size(1, 0).println(`Ban: ${table}`).size(0, 0).bold(false)
    .println(`Gio: ${time}`)
    .line();

  for (const item of items) {
    esc.bold(true).size(0, 1).println(item.name).size(0, 0).bold(false)
       .println(`  SL: ${item.qty}`);
  }

  if (note) {
    esc.line()
       .bold(true).println(`Ghi chu: ${note}`).bold(false);
  }

  esc.line()
     .alignCenter().println('--- HET ---')
     .newLine(3).cut();

  return esc.build();
}

// --- In hoá đơn ---
function buildReceipt({ table, orderId, time, items, paymentMethod }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const esc = new EscPos();

  esc.init()
    .alignCenter()
    .bold(true).size(1, 1).println('HA NOI XUA').size(0, 0).bold(false)
    .println('Bun rieu - Bun dau')
    .println('220 Nguyen Hoang, An Phu, Thu Duc')
    .println('Tel: 0901 681 567')
    .line()

    .alignLeft()
    .println(`Don: #${orderId}    ${time}`)
    .println(`Ban: ${table}`)
    .line()

    // Header
    .bold(true)
    .tableRow([
      { text: 'Mon', width: 0.5, align: 'left' },
      { text: 'SL', width: 0.1, align: 'center' },
      { text: 'T.Tien', width: 0.4, align: 'right' },
    ])
    .bold(false)
    .line();

  for (const item of items) {
    esc.tableRow([
      { text: item.name, width: 0.5, align: 'left' },
      { text: String(item.qty), width: 0.1, align: 'center' },
      { text: formatVND(item.price * item.qty), width: 0.4, align: 'right' },
    ]);
  }

  esc.line()
    .bold(true).size(0, 1)
    .tableRow([
      { text: 'TONG:', width: 0.5, align: 'left' },
      { text: formatVND(total), width: 0.5, align: 'right' },
    ])
    .size(0, 0).bold(false)
    .println(`TT: ${paymentMethod === 'transfer' ? 'Chuyen khoan' : 'Tien mat'}`)
    .line()
    .alignCenter()
    .println('Cam on quy khach!')
    .println('Hen gap lai :)')
    .newLine(3).cut();

  return esc.build();
}

// --- Main ---
console.log(`\n🖨️  In phieu mau → "${PRINTER_NAME}"\n`);

const sampleData = {
  table: 'Ban 1',
  orderId: 'HD-001',
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  note: 'It cay, khong hanh',
  paymentMethod: 'cash',
  items: [
    { name: 'To Dac Biet', qty: 2, price: 68000 },
    { name: 'To Day Du', qty: 1, price: 59000 },
    { name: 'Bun Dau Cha Com', qty: 1, price: 55000 },
    { name: 'Tra Da', qty: 3, price: 10000 },
  ],
};

// In phiếu bếp
console.log('  📋 In phieu bep...');
try {
  const ok = printRaw(PRINTER_NAME, buildKitchenTicket(sampleData));
  console.log(ok ? '  ✅ Phieu bep OK!\n' : '  ❌ Phieu bep FAIL\n');
} catch (err) {
  console.log(`  ❌ Loi: ${err.message}\n`);
}

// Nghỉ 1 giây rồi in hoá đơn
await new Promise(r => setTimeout(r, 1000));

// In hoá đơn
console.log('  🧾 In hoa don...');
try {
  const ok = printRaw(PRINTER_NAME, buildReceipt(sampleData));
  console.log(ok ? '  ✅ Hoa don OK!\n' : '  ❌ Hoa don FAIL\n');
} catch (err) {
  console.log(`  ❌ Loi: ${err.message}\n`);
}

console.log('🎉 Xong! Kiem tra giay ra may in.');
