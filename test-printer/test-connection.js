/**
 * 🔌 Test kết nối - liệt kê máy in Windows
 * 
 * Chạy: node test-connection.js
 * Hoặc: node test-connection.js "XP-80C"
 */
import { listPrinters } from './printer-core.js';

const TARGET = process.argv[2] || 'XP-80C';

console.log('');
console.log('╔══════════════════════════════════════╗');
console.log('║  🖨️  XPRINTER USB CONNECTION TEST    ║');
console.log('╚══════════════════════════════════════╝');
console.log(`  Tim: "${TARGET}"`);
console.log('');

console.log('━━━ Danh sach may in Windows ━━━');
const printers = listPrinters();

if (printers.length === 0) {
  console.log('  ❌ Khong lay duoc danh sach may in!');
  console.log('     Thu chay lai voi quyen Admin.');
  process.exit(1);
}

let found = false;
for (const p of printers) {
  const name = p.Name || p.name || '';
  const status = p.PrinterStatus === 0 || p.PrinterStatus === 'Normal' ? '✅ Ready' : `⚠️  ${p.PrinterStatus}`;
  const match = name === TARGET ? ' ← MAY IN CAN TEST' : '';
  console.log(`  ${status}  ${name}${match}`);
  if (name === TARGET) found = true;
}

console.log('');
if (found) {
  console.log(`  ✅ Tim thay "${TARGET}"!`);
  console.log('\n  Buoc tiep theo:');
  console.log('    npm run print   → In test');
  console.log('    npm run custom  → In phieu bep mau');
  console.log('    npm run web     → Web UI');
} else {
  console.log(`  ❌ Khong tim thay "${TARGET}"`);
  console.log('     Su dung ten may in chinh xac tu danh sach tren:');
  console.log('     node test-connection.js "TEN_MAY_IN"');
}
console.log('');
