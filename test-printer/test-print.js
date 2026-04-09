/**
 * 🖨️ In test đơn giản qua USB
 * 
 * Chạy: node test-print.js
 * Hoặc: node test-print.js "XP-80C"
 */
import { EscPos, printRaw } from './printer-core.js';

const PRINTER_NAME = process.argv[2] || 'XP-80C';

console.log(`\n🖨️  In test → "${PRINTER_NAME}"\n`);

try {
  const esc = new EscPos();

  esc.init()
    // Header
    .alignCenter()
    .bold(true).size(1, 1)
    .println('=== TEST USB ===')
    .bold(false).size(0, 0)
    .newLine()

    // Info
    .alignLeft()
    .println(`Printer: ${PRINTER_NAME}`)
    .println(`Mode:    USB / Raw ESC/POS`)
    .println(`Time:    ${new Date().toLocaleString('vi-VN')}`)
    .line()

    // Text sizes
    .alignCenter()
    .println('--- Kich thuoc chu ---')
    .size(0, 0).println('Normal (0,0)')
    .size(1, 0).println('Wide (1,0)')
    .size(0, 1).println('Tall (0,1)')
    .size(1, 1).println('Big (1,1)')
    .size(0, 0)
    .line()

    // Alignment
    .alignLeft().println('Canh trai (Left)')
    .alignCenter().println('Canh giua (Center)')
    .alignRight().println('Canh phai (Right)')
    .alignLeft()
    .bold(true).println('In dam (Bold)').bold(false)
    .line()

    // Vietnamese (no diacritics - safe)
    .alignCenter()
    .println('Ban 1 | To Dac Biet')
    .println('Ha Noi Xua - 0901 681 567')
    .println('Cam on quy khach!')
    .line()

    // Footer
    .bold(true).println('May in OK!').bold(false)
    .newLine(3)
    .cut();

  const ok = printRaw(PRINTER_NAME, esc.build());
  if (ok) {
    console.log('✅ In thanh cong! Kiem tra giay ra may in.');
  } else {
    console.log('❌ Khong in duoc.');
    console.log('   → Kiem tra ten may in: node test-connection.js');
    console.log('   → Thu chay lai voi quyen Admin');
  }
} catch (err) {
  console.log(`❌ Loi: ${err.message}`);
}
