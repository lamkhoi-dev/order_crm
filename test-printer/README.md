# 🖨️ Xprinter USB Test — Không cần Python/Build Tools!

Test in Xprinter XP-80C qua USB bằng raw ESC/POS qua PowerShell.

## ✅ Yêu cầu
- **Node.js** >= 18 (đã có)
- **Windows** (đang dùng)
- **Không cần** Python, Build Tools, hay native module!

## Cài đặt

```bash
# Xoá node_modules cũ (nếu có)
rmdir /s /q node_modules

# Cài lại (chỉ có express, rất nhanh)
npm install
```

## Sử dụng

### 1. Kiểm tra tên máy in
```bash
npm test
```
→ Liệt kê tất cả máy in Windows, chỉ ra máy nào là `XP-80C`

### 2. In test cơ bản
```bash
npm run print
```

### 3. In phiếu bếp + hoá đơn mẫu
```bash
npm run custom
```

### 4. Web UI (dễ nhất)
```bash
npm run web
# → Mở browser: http://localhost:3333
```

## Truyền tên máy in khác

```bash
node test-connection.js "XP-80C (copy 1)"
node test-print.js "XP-80C (copy 1)"
node web-test.js "XP-80C (copy 1)"
```

## Cấu trúc

| File | Mục đích |
|------|----------|
| `printer-core.js` | ESC/POS builder + PowerShell raw print |
| `test-connection.js` | Liệt kê máy in Windows |
| `test-print.js` | In test sizes/alignment/bold |
| `test-custom.js` | In phiếu bếp + hoá đơn |
| `web-test.js` | Web UI đầy đủ |

## Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| Printer not found | Chạy `npm test` xem tên đúng |
| FAIL (không in) | Thử chạy CMD với quyền Admin |
| PowerShell lỗi | Chạy: `Set-ExecutionPolicy RemoteSigned` trong PowerShell Admin |
