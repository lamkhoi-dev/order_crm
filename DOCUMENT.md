# ORDER_CRM — Tài Liệu Dự Án

**Tên dự án:** Order CRM — Hệ thống POS quản lý nhà hàng  
**Nhà hàng:** Hà Nội Xưa — Bún Riêu · Bún Đậu  
**Địa chỉ:** 220 Nguyễn Hoàng, P. An Phú, TP. Thủ Đức  
**Phiên bản tài liệu:** 1.0 — 15/05/2026

---

## 1. TỔNG QUAN DỰ ÁN

Order CRM là hệ thống Point-of-Sale (POS) nội bộ được xây dựng dành riêng cho nhà hàng Hà Nội Xưa. Hệ thống chạy trên nền web, được triển khai trên máy tính nội bộ (local network), hỗ trợ đa thiết bị (máy tính bàn, máy tính bảng, điện thoại). Mọi dữ liệu được lưu trữ cục bộ bằng SQLite, không phụ thuộc internet để vận hành.

### Mục tiêu
- Thay thế hoàn toàn sổ tay và phần mềm POS bên thứ ba tốn phí bản quyền
- Tích hợp quy trình từ gọi món → bếp/bar → thanh toán → báo cáo trong một hệ thống duy nhất
- Dễ sử dụng trên cả máy tính cảm ứng và điện thoại

---

## 2. KIẾN TRÚC HỆ THỐNG

```
Client (React + Vite)          Server (Node.js + Express)
┌─────────────────────┐        ┌──────────────────────────┐
│ OrderView           │◄──────►│ /api/data   (SQLite)     │
│ KitchenView         │        │ /api/print  (ESC/POS)    │
│ AdminView           │        │ /api/upload (Multer)     │
│ ShiftManager        │        └──────────────────────────┘
│ Header              │               │
└─────────────────────┘        ┌──────┴───────┐
        │                      │   pos.db     │
   Zustand Store               │  (SQLite)    │
   (useStore.js)               └──────────────┘
```

### Công nghệ
| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Vite 8, Zustand 5, Lucide Icons, XLSX |
| Backend | Node.js, Express, better-sqlite3 |
| Database | SQLite (file: server/pos.db) |
| In ấn | ESC/POS qua TCP (Xprinter) |
| Upload ảnh | Multer → public/images |
| Triển khai | Local server + ngrok (remote access) |

---

## 3. CẤU TRÚC DATABASE (HIỆN TẠI)

| Bảng | Mô tả |
|---|---|
| `tables` | Danh sách bàn: id, name, seats, area, status, order_id, guest_count |
| `orders` | Đơn hàng: id, table_id, items(JSON), status, total, payment_method, shift_id, ... |
| `drafts` | Đơn nháp chưa gửi bếp |
| `shifts` | Ca làm việc: opened_at, closed_at, doanh thu, thu/chi |
| `shift_expenses` | Thu chi trong ca: amount, reason, type |
| `categories` | Danh mục món: id, name, order_idx |
| `menu_items` | Món ăn: id, name, price, category, image, popular, no_kitchen, order_idx |
| `table_areas` | Khu vực bàn: A, B, S, MV |

---

## 4. CHỨC NĂNG HIỆN CÓ

### 4.1 Màn hình Order (OrderView)
- **Sơ đồ bàn:** Hiển thị tất cả bàn theo khu vực (A, B, S, MV), màu sắc phân biệt trạng thái
- **Trạng thái bàn:** Trống / Đang gọi món / Đã phục vụ
- **Chọn bàn:** Tap vào bàn để mở panel gọi món
- **Nhập số khách:** Chọn số lượng khách trước khi gọi món
- **Danh mục món:** Hiển thị theo tab danh mục, có icon và ảnh
- **Tìm kiếm món:** Tìm theo tên realtime
- **Thêm vào giỏ:** Tap vào món để thêm, giỏ hiện ngay phía dưới
- **Chỉnh số lượng:** Tăng/giảm số lượng từng món trong giỏ
- **Ghi chú từng món:** Nhập ghi chú (ít cay, không hành, thêm phô mai...) cho từng item
- **Ghi chú toàn đơn:** Ghi chú chung cho cả đơn hàng
- **Gọi thêm món:** Bàn đang ăn vẫn có thể gọi thêm, merge vào đơn hiện tại
- **Gửi bếp:** Gửi order → tạo đơn trong DB → bếp nhận được ngay
- **Chuyển bàn:** Di chuyển toàn bộ đơn sang bàn khác
- **Tách hóa đơn:** Chọn các món để tách thành đơn mới ở bàn khác
- **Gộp hóa đơn:** Gộp nhiều đơn lại thành một
- **Thanh toán:** Tiền mặt hoặc chuyển khoản
- **Xóa món khỏi đơn:** Staff có thể xóa từng món đã order
- **Hủy đơn:** Hủy toàn bộ đơn, bàn về trống
- **Lịch sử đơn bàn:** Xem lịch sử đơn đã thanh toán của bàn đang chọn

### 4.2 Màn hình Bếp (KitchenView)
- **Xem đơn đang chờ:** Danh sách tất cả đơn đang pending/cooking
- **Trạng thái đơn:** pending (chờ) → cooking (đang làm) → done (xong)
- **Bắt đầu làm:** Nút "Bắt đầu" chuyển đơn sang trạng thái cooking
- **Hoàn thành:** Nút "Xong" đánh dấu đơn đã ra món
- **Hiển thị thời gian:** Thời gian tạo đơn, thời gian đang chờ (bao nhiêu phút)
- **Phân loại:** Hiển thị tên bàn, danh sách món, ghi chú
- **Tự động refresh:** Cập nhật realtime khi có đơn mới

### 4.3 Màn hình Admin (AdminView)

**Thống kê (Dashboard):**
- Doanh thu tổng / số đơn / bàn đang phục vụ
- Trung bình mỗi đơn / tổng khách / phân loại đơn
- Bộ lọc: Tất cả / Theo ngày / Theo tháng
- Biểu đồ món bán chạy (top 8)
- Lịch sử đơn hàng chi tiết (nhóm theo ngày)
- Xuất Excel toàn bộ báo cáo

**Cài đặt (AdminSettings):**
- CRUD danh mục món ăn (thêm/sửa/xóa/sắp xếp)
- CRUD món ăn (ảnh, giá, mô tả, danh mục, no_kitchen flag)
- Upload ảnh món (lưu vào server local)
- CRUD khu vực bàn
- CRUD bàn (tên, số ghế, khu vực)

**Bảo vệ bằng password:** Màn hình admin yêu cầu nhập mật khẩu (mặc định 123456)

### 4.4 Quản lý Ca (ShiftManager)
- Mở ca: Chọn tên ca, nhân viên, tiền mặt đầu ca
- Xem ca hiện tại: Doanh thu realtime, số đơn, tiền mặt / chuyển khoản
- Ghi thu: Nhập khoản thu ngoài đơn hàng
- Ghi chi: Nhập khoản chi (mua nguyên liệu, điện, gas...)
- Đóng ca: Kiểm kê tiền mặt, xác nhận chênh lệch, ghi chú bàn giao
- Lịch sử ca: Xem tất cả ca đã đóng

### 4.5 In ấn
- **In phiếu bếp:** In phiếu ESC/POS gửi bếp khi có order mới
- **In hóa đơn:** In bill thanh toán cho khách
- **In báo cáo ca:** In tổng kết cuối ca
- **Test máy in:** Kiểm tra kết nối máy in qua IP/TCP

### 4.6 Loại đơn hàng
- Tại bàn (dine_in)
- Mang về (take_away)
- Giao hàng (delivery)
- Đặt trước (pre_order)

---

## 5. TÍNH NĂNG BỔ SUNG (PHẦN MỚI)

> Đây là các tính năng **chưa có** trong hệ thống hiện tại, cần phát triển thêm.

---

### 5.1 QR Code — Khách Tự Đặt Món

**Mô tả:**  
Mỗi bàn có một mã QR riêng. Khách quét QR bằng điện thoại → mở trang web → xem menu → tự chọn món → gửi order trực tiếp vào hệ thống. Staff không cần đến bàn lấy order.

**Luồng hoạt động:**
```
Khách quét QR bàn A3
    → Mở trang /order/3 (mobile-friendly)
    → Xem menu theo danh mục
    → Thêm món vào giỏ
    → Ghi chú từng món
    → Nhấn "Gửi Order"
    → Hệ thống nhận → bếp thấy ngay → staff thấy trên sơ đồ bàn
```

**Cần xây dựng:**
- Route `/order/:tableId` — public, không cần đăng nhập
- Component `GuestOrderView.jsx` — UI mobile-first
- API `POST /api/guest-order` — nhận và xử lý order từ khách
- Sinh QR code cho từng bàn (thư viện `qrcode.react`)
- In/download QR bàn trong AdminSettings
- Merge logic: nếu bàn đã có order → thêm vào, chưa có → tạo mới
- Hiển thị thông báo "Đã gửi thành công" cho khách

**Schema bổ sung trong orders:**
```
source: 'staff' | 'guest'  (đơn từ staff hay từ khách)
```

---

### 5.2 Phân Quyền Nhân Viên Bằng PIN

**Mô tả:**  
Mỗi nhân viên đăng nhập bằng mã PIN riêng. Hệ thống phân quyền theo role, chỉ hiển thị đúng chức năng cần thiết.

**Bảng role và quyền:**
| Role | Order | Thanh toán | Bếp | Chuyển bàn | Admin | Ca làm |
|---|---|---|---|---|---|---|
| cashier (Thu ngân) | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| waiter (Phục vụ) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| kitchen (Bếp) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| manager (Quản lý) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Cần xây dựng:**
- Bảng DB `staff`: id, name, pin(4-6 số), role, is_active
- Màn hình PIN login (bàn phím số, thân thiện cảm ứng)
- Session lưu trong localStorage: staff_id + role
- Middleware frontend ẩn/hiện tab theo role
- API quản lý staff trong AdminSettings
- Gắn staffName thực từ DB vào mỗi order

---

### 5.3 VAT / Phí Phục Vụ / Giảm Giá

**Mô tả:**  
Tính thêm VAT và phí phục vụ vào hóa đơn. Hỗ trợ nhập mã giảm giá khi thanh toán.

**Cách tính hóa đơn mới:**
```
Tổng món:       150,000đ
+ Phí phục vụ (5%): 7,500đ
+ VAT (8%):        12,600đ
─────────────────────────
Tổng cộng:     170,100đ
- Giảm giá (10%): -17,010đ
═════════════════════════
THANH TOÁN:    153,090đ
```

**Cần xây dựng:**
- Bảng DB `settings`: key TEXT, value TEXT (lưu cấu hình)
  - key: `vat_rate`, `service_charge_rate`, `vat_enabled`, `service_charge_enabled`
- Bảng DB `discount_codes`: code, name, type (percent/fixed), value, min_order, is_active, expires_at
- Thêm fields vào `orders`: vat_amount, service_charge, discount_code, discount_amount, subtotal
- UI breakdown hóa đơn khi thanh toán (hiện chi tiết từng dòng)
- Cài đặt VAT/phí trong AdminSettings
- Màn hình quản lý mã giảm giá

---

### 5.4 Thanh Toán Mở Rộng

**Phương thức bổ sung:**
- **QR Ngân hàng:** Tích hợp VietQR API (miễn phí) — sinh QR động theo số tiền
- **Ví điện tử:** MoMo, ZaloPay (thủ công xác nhận)
- **Thẻ tín dụng/ghi nợ:** Ghi nhận thủ công

**Cần xây dựng:**
- Thêm options trong màn hình thanh toán: `qr_bank`, `momo`, `zalopay`, `card`
- Component hiển thị QR VietQR với số tiền tự động
- Cài đặt số tài khoản ngân hàng trong AdminSettings
- Cập nhật báo cáo phân loại thanh toán đầy đủ

---

### 5.5 Trạng Thái Từng Món (Item-level Status)

**Mô tả:**  
Hiện tại trạng thái áp dụng cho cả đơn. Cần theo dõi từng món riêng lẻ.

**Luồng trạng thái món:**
```
pending → cooking → done → served
(chờ)    (đang làm)  (xong) (đã mang ra bàn)
```

**Cần xây dựng:**
- Thêm field `status` vào mỗi item object trong JSON orders
- KitchenView: nút "Xong" cho từng món, không chỉ cả đơn
- OrderView: staff đánh dấu "Đã phục vụ" khi mang món ra bàn
- API `PUT /orders/:id/items/:index` cập nhật status từng món
- Store action `updateItemStatus(orderId, itemIndex, status)`

---

### 5.6 In Tự Động Phân Luồng Bếp / Bar

**Mô tả:**  
Khi order gửi vào, hệ thống tự động tách và in theo khu vực chế biến.

**Luồng:**
```
Order gửi vào
    → Lọc món có no_kitchen = 0 → in máy in BẾP
    → Lọc món có no_kitchen = 1 → in máy in BAR/QUẦY NƯỚC
```

**Cần xây dựng:**
- Cài đặt IP máy in bếp + IP máy in bar riêng biệt trong AdminSettings
- Lưu vào bảng `settings`: `kitchen_printer_ip`, `bar_printer_ip`
- Sửa `sendOrderToKitchen()`: sau khi POST thành công → trigger 2 lệnh in riêng
- API `/api/print/bar` cho máy in bar

---

### 5.7 Báo Cáo Theo Tuần

**Mô tả:**  
Bổ sung bộ lọc theo tuần vào màn hình báo cáo.

**Cần xây dựng:**
- Thêm `filterType = 'week'` vào dropdown bộ lọc
- Input `<input type="week">` để chọn tuần (ISO week)
- Logic filter: lấy đơn có created_at nằm trong tuần đã chọn
- Xuất Excel với tên file `BaoCao_Tuan_2026-W20.xlsx`

---

### 5.8 Đặt Bàn Trước (Reservation)

**Mô tả:**  
Cho phép nhận đặt bàn trước với thông tin khách hàng, hiển thị trên sơ đồ bàn.

**Cần xây dựng:**
- Bảng DB `reservations`: id, table_id, customer_name, phone, party_size, reserved_at, note, status (pending/confirmed/cancelled/arrived)
- Thêm status `reserved` cho bàn
- Màn hình quản lý đặt bàn trong Admin
- Sơ đồ bàn: hiển thị bàn đã đặt trước với tên khách và giờ hẹn
- Tự động nhắc nhở khi gần đến giờ đặt bàn (toast notification)

---

### 5.9 Quản Lý Kho Nguyên Liệu

**Mô tả:**  
Theo dõi tồn kho nguyên liệu, tự động trừ khi bán, cảnh báo khi sắp hết.

**Cần xây dựng:**

Bảng DB mới:
```sql
ingredients (id, name, unit, quantity, min_threshold, cost_per_unit)
menu_item_ingredients (item_id, ingredient_id, amount_per_unit)
inventory_logs (id, ingredient_id, type, amount, reason, created_at, staff_id)
```

Tính năng:
- Cài đặt nguyên liệu cho từng món trong AdminSettings
- Tự động trừ kho khi order được đánh dấu `done`
- Cảnh báo tồn kho thấp: badge đỏ trên Header + toast notification
- Màn hình kho trong Admin:
  - Xem tồn kho hiện tại
  - Nhập kho (ghi lý do, số lượng)
  - Lịch sử xuất/nhập theo ngày
- Báo cáo kho: tiêu thụ theo ngày/tháng, chi phí nguyên liệu

---

## 6. LUỒNG VẬN HÀNH (END-TO-END)

### Quy trình phục vụ chuẩn
```
1. Mở ca (ShiftManager)
        ↓
2. Khách vào bàn
        ↓
3a. Staff gọi món (OrderView)    hoặc    3b. Khách quét QR tự gọi
        ↓
4. Gửi order → Bếp/Bar nhận (KitchenView)
        ↓
5. Bếp làm xong → cập nhật trạng thái "Xong"
        ↓
6. Staff mang món ra bàn → đánh dấu "Đã phục vụ"
        ↓
7. Khách gọi thêm → lặp lại bước 3-6
        ↓
8. Khách thanh toán (tiền mặt / QR / chuyển khoản / thẻ)
        ↓
9. In hóa đơn → Bàn về trống
        ↓
10. Đóng ca → In báo cáo ca
```

---

## 7. SƠ ĐỒ TRANG (SCREENS MAP)

```
App
├── Header (tab navigation)
│   ├── [Order] → OrderView
│   │   ├── Sơ đồ bàn
│   │   ├── Panel gọi món
│   │   ├── Giỏ hàng
│   │   └── Thanh toán
│   ├── [Bếp] → KitchenView
│   │   └── Danh sách đơn đang chờ/làm
│   └── [Admin] → AdminView
│       ├── Dashboard (Thống kê)
│       └── Cài đặt (AdminSettings)
│
├── ShiftManager (Sidebar phải)
│
└── /order/:tableId (Public — GuestOrderView) [MỚI]
    └── Menu → Giỏ → Gửi order
```

---

## 8. API ENDPOINTS

### Hiện có
| Method | Path | Mô tả |
|---|---|---|
| GET | /api/data/sync | Load toàn bộ state (tables, orders, drafts, shift, menu) |
| GET/PUT | /api/data/tables/:id | Cập nhật bàn |
| GET/POST | /api/data/orders | Lấy / tạo order |
| PUT | /api/data/orders/:id | Cập nhật status/items |
| POST | /api/data/orders/:id/items | Thêm món vào order |
| DELETE | /api/data/orders/:id/items/:idx | Xóa món khỏi order |
| POST | /api/data/orders/:id/transfer | Chuyển bàn |
| POST | /api/data/orders/:id/split | Tách bill |
| POST | /api/data/orders/:id/merge | Gộp bill |
| DELETE | /api/data/orders/:id | Hủy order |
| GET/POST | /api/data/drafts | Draft orders |
| POST | /api/data/shifts | Mở ca |
| POST | /api/data/shifts/:id/close | Đóng ca |
| POST | /api/data/shifts/:id/expenses | Ghi thu/chi |
| GET | /api/data/shifts/current | Ca hiện tại |
| POST | /api/data/config | CRUD menu/categories/areas/tables |
| POST | /api/upload | Upload ảnh món |
| POST | /api/print/kitchen | In phiếu bếp |
| POST | /api/print/receipt | In hóa đơn |
| POST | /api/print/shift | In báo cáo ca |
| GET | /api/health | Health check |

### Cần bổ sung (Phần mới)
| Method | Path | Mô tả |
|---|---|---|
| POST | /api/guest-order | Nhận order từ khách (QR) |
| GET | /api/menu/public/:tableId | Menu public cho khách |
| POST | /api/auth/login | Đăng nhập PIN |
| GET/POST | /api/staff | Quản lý nhân viên |
| GET/PUT | /api/settings | Đọc/ghi cấu hình (VAT, phí DV, IP máy in) |
| GET/POST | /api/discount-codes | Quản lý mã giảm giá |
| POST | /api/discount-codes/validate | Kiểm tra mã giảm giá |
| PUT | /api/orders/:id/items/:idx/status | Cập nhật status từng món |
| GET/POST | /api/reservations | Quản lý đặt bàn |
| GET/POST | /api/ingredients | Quản lý nguyên liệu |
| POST | /api/ingredients/:id/stock | Nhập kho |
| GET | /api/inventory-logs | Lịch sử xuất/nhập kho |
| POST | /api/print/bar | In phiếu quầy bar |

---

## 9. SO SÁNH TRƯỚC / SAU

| # | Tính năng | Trước | Sau |
|---|---|---|---|
| 1 | Khách tự order | ❌ | ✅ QR Code |
| 2 | Phân quyền | ⚠️ Giả (localStorage) | ✅ PIN thực |
| 3 | VAT / Phí DV | ❌ | ✅ Cấu hình được |
| 4 | Mã giảm giá | ❌ | ✅ |
| 5 | QR ngân hàng | ❌ | ✅ VietQR |
| 6 | Ví điện tử / Thẻ | ❌ | ✅ |
| 7 | Status từng món | ❌ (cả đơn) | ✅ Từng item |
| 8 | In phân luồng tự động | ⚠️ Thủ công | ✅ Tự động |
| 9 | Báo cáo tuần | ❌ | ✅ |
| 10 | Đặt bàn trước | ❌ | ✅ |
| 11 | Quản lý kho | ❌ | ✅ |
| 12 | Cảnh báo tồn kho | ❌ | ✅ |

---

## 10. ƯỚC TÍNH THỜI GIAN PHÁT TRIỂN

| Hạng mục | Ưu tiên | Ước tính |
|---|---|---|
| QR khách tự order | 🔴 Cao | 2-3 ngày |
| Phân quyền PIN | 🔴 Cao | 2 ngày |
| VAT / Phí / Giảm giá | 🟠 Trung | 1 ngày |
| Thanh toán mở rộng | 🟠 Trung | 1 ngày |
| Trạng thái từng món | 🟠 Trung | 1 ngày |
| In tự động phân luồng | 🟠 Trung | 1 ngày |
| Báo cáo theo tuần | 🟢 Thấp | 3 giờ |
| Đặt bàn trước | 🟡 Thấp | 2 ngày |
| Quản lý kho | 🟡 Thấp | 4-5 ngày |
| **Tổng** | | **~15-18 ngày** |

---

## 11. THIẾT KẾ UI / UX

### 11.1 Triết Lý Thiết Kế

Hệ thống Order_CRM được thiết kế theo hai lớp giao diện riêng biệt:

| Lớp | Màn hình | Đối tượng | Phong cách |
|---|---|---|---|
| **Staff Interface** | OrderView, KitchenView, AdminView | Nhân viên | Tối màu, chuyên nghiệp, thao tác nhanh |
| **Guest Interface** | GuestOrderView (/order/:tableId) | Khách hàng | Sáng, visual, cảm hứng Haidilao |

---

### 11.2 Guest Interface — Cảm Hứng Haidilao

Giao diện dành cho khách (QR tự order) lấy cảm hứng từ hệ thống ordering của **Haidilao** — chuỗi lẩu nổi tiếng với trải nghiệm tự gọi món trực quan trên tablet/điện thoại.

#### Màu Sắc (Guest UI)

```
Màu chủ đạo:    #C0392B  (Đỏ Haidilao — ấm, kích thích vị giác)
Màu phụ:        #E74C3C  (Đỏ nhạt hơn — hover, accent)
Màu nền:        #FFF8F6  (Trắng kem nhẹ — không chói)
Màu nền card:   #FFFFFF  (Trắng thuần — nổi bật ảnh món)
Màu text chính: #1A1A1A  (Gần đen — dễ đọc)
Màu text phụ:   #888888  (Xám — mô tả, giá phụ)
Màu giá tiền:   #C0392B  (Đỏ — nhất quán với brand)
Màu badge:      #FF6B35  (Cam — "Bán chạy", "Mới")
Màu xanh OK:    #27AE60  (Xanh lá — nút xác nhận, thành công)
Màu nền header: #C0392B  (Đỏ đậm — topbar)
```

#### Typography

```
Font chính:     'Be Vietnam Pro' hoặc 'Nunito' (Google Fonts)
Tên món:        16-18px, SemiBold, #1A1A1A
Mô tả món:      13px, Regular, #888888
Giá tiền:       15px, Bold, #C0392B
Tên danh mục:   13px, SemiBold, uppercase, letter-spacing 0.5px
Header nhà hàng: 20px, Bold, White
```

#### Layout Guest UI

```
┌─────────────────────────────────┐
│  🔴 Header (đỏ)                 │  ← Logo + Tên nhà hàng + Tên bàn
│  "Hà Nội Xưa · Bàn A3"         │
├─────────────────────────────────┤
│  [Bán Chạy] [Bún Riêu] [Đồ Uống]│  ← Danh mục cuộn ngang (sticky)
├─────────────────────────────────┤
│  ┌───────┐  Tô Đặc Biệt        │
│  │  ảnh  │  Đậu, giò, bò, trứng│  ← Card món: ảnh trái, info phải
│  │  to   │  68.000đ        [+] │
│  └───────┘                      │
│  ┌───────┐  Mẹt Tá Lả          │
│  │  ảnh  │  Bún đậu mắm tôm    │
│  │  to   │  78.000đ        [+] │
│  └───────┘                      │
├─────────────────────────────────┤
│  🛒 Giỏ hàng (floating bottom)  │  ← Luôn hiện, hiển thị số món + tổng
│  [ 3 món · 195.000đ → Xem giỏ ]│
└─────────────────────────────────┘
```

#### Đặc Điểm UI Theo Phong Cách Haidilao

1. **Ảnh món to và rõ** — mỗi card có ảnh 80-100px chiều cao, full-width hoặc left-aligned, không crop xấu
2. **Danh mục sticky + cuộn ngang** — thanh danh mục cố định phía trên khi scroll, tab active màu đỏ gạch chân
3. **Floating cart bar** — thanh giỏ hàng nổi dưới cùng, không che nội dung, animation slide-up
4. **Nút "+" nổi bật** — màu đỏ, to, dễ tap trên điện thoại (min 44px touch target)
5. **Counter trực tiếp trên card** — khi đã thêm, hiện `[-] 2 [+]` thay cho nút `+`
6. **Badge "Bán Chạy"** — màu cam `#FF6B35`, góc trên trái ảnh món
7. **Ghi chú món** — tap vào ghi chú icon → bottom sheet slide up nhập text
8. **Animation thêm vào giỏ** — hiệu ứng "bay vào giỏ" nhẹ khi tap `+`
9. **Màn hình xác nhận** — sau khi gửi order: animation checkmark xanh + "Đã gửi! Bếp đang chuẩn bị"
10. **Mobile-first** — toàn bộ thiết kế ưu tiên màn hình 390-430px (iPhone/Android phổ biến)

---

### 11.3 Staff Interface — Màu Sắc Hiện Tại

Giao diện nhân viên giữ nguyên phong cách tối hiện tại:

```
Màu nền app:    #0f0f0f  (Đen gần như tuyệt đối)
Màu nền card:   #1a1a1a / #1e1e1e
Màu viền:       #2a2a2a / #333333
Màu accent:     #e8b86d  (Vàng đồng — brand màu chính)
Màu accent 2:   #d4963a  (Vàng đậm hơn — hover)
Màu text chính: #f5f5f5  (Trắng ngà)
Màu text phụ:   #888888  (Xám trung)
Màu thành công: #4ade80  (Xanh lá sáng)
Màu nguy hiểm:  #f87171  (Đỏ nhạt)
Màu cảnh báo:   #fbbf24  (Vàng cảnh báo)
```

**Trạng thái bàn:**
```
Trống:          #1a1a1a nền  + viền #333
Đang phục vụ:   #1a2e1a nền  + viền #4ade80  (xanh lá)
Đặt trước:      #2a1f0e nền  + viền #fbbf24  (vàng)
```

**Trạng thái đơn (KitchenView):**
```
Pending (chờ):  #2a1f0e nền  + badge vàng
Cooking (làm):  #1a2a3a nền  + badge xanh dương
Done (xong):    #1a2e1a nền  + badge xanh lá
```

---

### 11.4 Responsive Breakpoints

```
Mobile:   < 768px   → GuestOrderView tối ưu
Tablet:   768-1024px → OrderView staff (iPad quầy thu ngân)
Desktop: > 1024px   → AdminView + KitchenView (màn hình lớn)
```

---

*Tài liệu này mô tả toàn bộ hệ thống Order_CRM phiên bản hiện tại và kế hoạch phát triển.*
