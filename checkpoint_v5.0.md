# Checkpoint v5.0 - 2026-05-19
## Tích hợp Thư viện Tài liệu, Lịch sử Giá Đất, Hybrid Fuzzy Search & Sửa lỗi Critical

> **Trạng thái: ✅ HOÀN THÀNH & ĐÃ KIỂM CHỨNG**
> Tất cả tính năng đã được xác nhận hoạt động trên cả local (file://) và production (dulieuquyhoach.com).

---

## 🔴 HOTFIX CRITICAL: SyntaxError trong app.js

### Nguyên nhân gốc rễ
Một dấu `}` thừa nằm ở **dòng 791** trong `app.js` (ngay sau hàm `renderHistoricalChart()`) khiến toàn bộ file JavaScript bị **SyntaxError** khi trình duyệt parse. Hậu quả:
- Bản đồ Leaflet trắng xóa (không có map tiles)
- Không có tin tức, FAQ, dữ liệu dự án
- Không thể tìm kiếm, click polygon hay hiển thị bất kỳ nội dung nào
- **Ảnh hưởng cả local lẫn production** (dulieuquyhoach.com)

### Cách sửa
Xóa dấu `}` thừa tại dòng 791 trong `app.js`.

```diff
     } catch (e) {
         console.error("Lỗi khi vẽ biểu đồ lịch sử giá đền bù:", e);
     }
 }
-}
 
 function renderPlanningWarning(addr, coords) {
```

---

## 🛡️ HOTFIX #2: Tương thích giao thức file:// (CORS bypass)

### Vấn đề
Khi mở `index.html` trực tiếp bằng cách click đúp (giao thức `file://`), trình duyệt chặn tất cả `fetch()` do CORS policy → hàm `init()` không tải được `data/sheet_data.json` → dữ liệu trống.

### Giải pháp triển khai

| Thay đổi | Mô tả |
|----------|-------|
| Tạo `data/map.geojson.js` | Inline dữ liệu GeoJSON 5 polygon quy hoạch thành biến `mapGeojsonData` |
| Thêm sync XHR trong `index.html` | Pre-load `sheet_data.json` vào `window.sheetDataInlined` bằng XMLHttpRequest đồng bộ (hoạt động trên file://) |
| Sửa `init()` trong `app.js` | Ưu tiên `window.sheetDataInlined` → bỏ qua fetch nếu dữ liệu đã sẵn sàng |
| Sửa `loadPlanningGIS()` trong `app.js` | Ưu tiên `mapGeojsonData` → fallback fetch nếu chạy trên web server |
| Thêm timeout 8s cho GAS API | Tránh treo vô hạn khi GAS API không phản hồi |

---

## 🚀 Tính năng mới: Checkpoint v5.0

### 1. Kho tài liệu theo ngữ cảnh (Contextual Document Library)
- **Cơ sở dữ liệu `contextualDocuments`:** Lưu trữ danh sách PDF/CAD pháp lý cho 5 polygon quy hoạch:
  - `sh_r1` (Sông Hồng): QĐ 1045/QĐ-UBND + QĐ 71/2024
  - `vd4_sec1` (Vành đai 4): QĐ phê duyệt VĐ4 + QĐ 30/2019
  - `taidinhcu_ml` (TĐC Mê Linh): QĐ quy hoạch 1/500
  - `taidinhcu_ln` (TĐC Lĩnh Nam): QĐ bồi thường Hoàng Mai
  - `giapranh_vd4` (Hành lang an toàn VĐ4): Quy chế quản lý
- **Popup Leaflet nâng cấp:** Click polygon → hiển thị tài liệu PDF kèm icon `fa-file-pdf`
- **Panel chi tiết nâng cấp:** Card "Thư viện tài liệu pháp lý" trong kết quả tra cứu

### 2. Biểu đồ Lịch sử Giá Đất Đền Bù (Chart.js)
- **Tích hợp Chart.js CDN** trong `index.html`
- **Line Chart mượt mà:** 4 mốc thời gian (QĐ 30/2019 → Đầu 2024 → QĐ 71/2024 → Dự kiến 2026)
- **Thiết kế premium:** Tension 0.35, gradient fill, tooltip tương tác, gam xanh hoàng gia `#2563eb`
- **Quản lý bộ nhớ:** `currentChartInstance.destroy()` trước khi vẽ biểu đồ mới

### 3. Tìm kiếm Hybrid Fuzzy (Tiếng Việt không dấu)
- **Direct Polygon Match:** Chuẩn hóa input → đối chiếu trực tiếp tên/loại/category của polygon
- **Ví dụ:** Gõ `"Vanh dai 4"`, `"Song Hong"`, `"taidinhcu"` → tự động zoom + hiển thị chi tiết
- **Fallback Nominatim:** Nếu không trùng polygon → tìm qua OSM Nominatim + Fuse.js

---

## 📂 Danh sách file đã chỉnh sửa

### File mới tạo
- `data/map.geojson.js` — Dữ liệu GeoJSON inline cho 5 polygon quy hoạch

### File đã sửa
- `index.html`
  - Nhúng CDN Chart.js
  - Nhúng `data/map.geojson.js`
  - Thêm sync XHR pre-load `sheet_data.json`
- `app.js`
  - **[CRITICAL]** Xóa `}` thừa dòng 791
  - Khai báo `contextualDocuments` + `currentChartInstance`
  - Sửa `init()`: ưu tiên `window.sheetDataInlined`, timeout GAS API 8s
  - Sửa `loadPlanningGIS()`: ưu tiên `mapGeojsonData` inline
  - Nâng cấp `checkMyHome()`: Direct Polygon Match + `normalizeAddress()`
  - Nâng cấp `renderPlanningResult()`: Card tài liệu + canvas Chart.js
  - Thêm `renderHistoricalChart()`: Vẽ biểu đồ giá đền bù lịch sử

---

## 🧪 Kết quả kiểm tra

| Hạng mục | Local (file://) | Production (dulieuquyhoach.com) |
|----------|----------------|-------------------------------|
| Map tiles | ✅ | ✅ |
| Polygon quy hoạch | ✅ 5 polygons | ✅ 5 polygons |
| Ranh giới 30 quận huyện | ✅ | ✅ |
| Tin tức sidebar | ✅ Mock data | ✅ Real data từ GAS API |
| Tab HỎI ĐÁP | ✅ | ✅ |
| Tab DỰ ÁN | ✅ | ✅ |
| Click polygon → popup | ✅ + PDF links | ✅ + PDF links |
| Tìm kiếm "Vanh dai 4" | ✅ Direct match | ✅ Direct match |
| Biểu đồ giá Chart.js | ✅ | ✅ |

---

## 🔮 Kế hoạch phát triển tiếp theo (Checkpoint v6.0)

1. **So sánh đơn giá đền bù** giữa hai khu vực bằng Double Bar Chart
2. **Xuất báo cáo PDF** tải về trực tiếp từ panel kết quả
3. **Overlay bản đồ quy hoạch gốc** (ảnh raster) lên Leaflet
4. **Tích hợp dữ liệu tiến độ thực** từ Google Sheets API tự động
