# Kế hoạch Nâng cấp DULIEUQUYHOACH.COM v10.0
## Trải nghiệm người dân, Dữ liệu chính thức & Vận hành tự động

### Bối cảnh & Phạm vi

Hệ thống v9.0 đã hoàn thành nhiều hạng mục trọng yếu: bảng giá đất 2026 theo NQ 52/2025 (khung 17 khu vực), 12 polygon GIS, công cụ tra cứu "4 câu trả lời", cache hiệu năng, mở rộng RSS, SEO, làm mới dữ liệu thị trường & sửa deploy an toàn.

Tuy nhiên, sau khi tổng kết v9.0 và lắng nghe phản hồi (người cao tuổi cần chữ to, map cần sống động, mobile cần thao tác dễ), hệ thống còn **4 nhóm nâng cấp chính** cho v10.0:

> [!IMPORTANT]
> **Ưu tiên chiến lược v10:** (1) Đưa dữ liệu pháp lý về trạng thái **chính thức, đầy đủ**; (2) Nâng trải nghiệm **mobile & accessibility**; (3) Thêm tính năng **giá trị thật cho người dân** (báo cáo, theo dõi, so sánh); (4) **Tự động hóa vận hành** giảm công sức thủ công.

---

## Open Questions (cần xác nhận trước khi làm)

> [!IMPORTANT]
> 1. **File PDF/Excel chính thức NQ 52/2025** — Anh/chị có bản đầy đủ chưa? (Quyết định phạm vi Nhóm A.1)
> 2. **Bản vẽ/tọa độ chính thức** Cầu Tứ Liên, Metro 2/5, Đại lộ sông Hồng — có nguồn nào để thay vị trí minh họa không? (Nhóm A.2)
> 3. **Kênh theo dõi người dùng** — Nên dùng Zalo OA / Telegram / email? (Quyết định thiết kế Nhóm C.4)

---

## Proposed Changes — 5 nhóm nâng cấp

---

### Nhóm A: Dữ liệu pháp lý Chính thức & Đầy đủ (Ưu tiên cao nhất)

#### [MODIFY] `data/bang_gia_dat_2026.json`
- Cập nhật **đầy đủ 17 khu vực** theo văn bản gốc NQ 52/2025 (hiện mới 103 tuyến, **53 tuyến chưa phân loại khu vực**)
- Bổ sung hệ số K **chính thức theo từng khu vực** từ QĐ 19/2026 (hiện dùng mặc định 1.2)
- Thêm trường `nguonVanBan` + `soHieuDieuKhoan` cho từng tuyến để truy vết nguồn

#### [MODIFY] `data/map.geojson` + `map.geojson.js`
- Thay thế **vị trí minh họa** bằng tọa độ chính thức (Cầu Tứ Liên, Metro 2/5, Đại lộ sông Hồng) khi có bản vẽ
- Bổ sung `buffer` (vùng đệm) cho từng dự án → hỗ trợ trạng thái "🟡 Giáp ranh" chính xác theo khoảng cách thực

#### [NEW] `tools/legal_docs_crawler.py`
- Crawl & đối chiếu văn bản pháp luật từ `thuvienphapluat.vn` / `vanban.hanoi.gov.vn`
- Tự phát hiện văn bản mới, cảnh báo văn bản hết hiệu lực
- Đồng bộ vào `official_documents.json` + `planning_updates.json`

---

### Nhóm B: Mobile & Accessibility (Người cao tuổi)

#### [MODIFY] `index.html` + `app.js`

**B1. Bottom Sheet thay Side Panel trên mobile** (nhỏ hơn 768px)
- Kết quả tra cứu hiển thị dạng bottom sheet trượt lên — dễ thao tác bằng tay
- Nút kéo (drag handle) để mở rộng/thu gọn
- Giữ nguyên side panel trên desktop

**B2. Pull-to-refresh danh sách tin** (mobile)
- Kéo xuống đầu danh sách → làm mới dữ liệu từ cache/nhẹ

**B3. Chế độ "Phông chữ lớn"** (toggle accessibility)
- Nút trên header: chuyển đổi cỡ chữ cơ bản (A / A+ / A++)
- Lưu lựa chọn vào localStorage
- Áp dụng cho toàn bộ sidebar, panel kết quả, popup bản đồ

**B4. Tương phản & focus**
- Đảm bảo tỷ lệ tương phản màu ≥ 4.5:1 cho text
- Focus ring rõ ràng cho bàn phím/điều hướng
- ARIA labels cho widget toggle, popup, nút

**B5. Skeleton loading chuẩn hóa**
- Thống nhất animation `qhpulse` cho tất cả tab (BẢN TIN, HỎI ĐÁP, DỰ ÁN)

---

### Nhóm C: Tính năng Giá trị cao cho Người dân

#### [MODIFY] `app.js` — sau `renderPlanningResult()`

**C1. Xuất báo cáo PDF**
- Nút "📄 Xuất báo cáo PDF" trong panel kết quả
- Tổng hợp: 4 câu trả lời + bản đồ chụp + biểu đồ so sánh
- Dùng `html2canvas` + `jsPDF` (tải CDN, không cần backend)

**C2. Lịch sử tra cứu** (localStorage `dqh_history_v1`)
- Lưu 20 địa chỉ đã tra gần nhất
- Hiển thị trong tab "DỰ ÁN" hoặc dropdown lịch sử
- Click → tra lại ngay

**C3. So sánh 2 địa chỉ**
- Nút "+ So sánh thêm địa chỉ" → bảng so sánh song song 4 chỉ số
- Hỗ trợ quyết định mua bán so sánh 2 khu vực

**C4. Theo dõi khu vực**
- Nút "🔔 Theo dõi" trên kết quả → lưu khu vực vào localStorage
- GAS kiểm tra định kỳ → gửi thông báo qua **Zalo OA / Telegram** khi có quy hoạch/giá mới
- *(Cần xác nhận kênh ở Open Questions)*

**C5. Công cụ Đo khoảng cách / Diện tích** (checkpoint v8.0 còn nợ)
- Plugin đo trên bản đồ chính `index.html` (2 điểm = khoảng cách; polygon = diện tích)
- Hiển thị kết quả bằng mét/ha

---

### Nhóm D: Vận hành & Tự động hóa

#### [MODIFY] `.github/workflows/*`

**D1. Telegram Notification**
- Cấu hình secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `daily_checker.py` đã hỗ trợ → chỉ cần bật trong workflow
- Cảnh báo CRITICAL (GIS fail, link chết, dữ liệu cũ) qua Telegram

**D2. Chuẩn hóa `QA.json`** thành mảng chuẩn (checkpoint v8.0 còn nợ)
- Định dạng `[{q, a, source}]` để `daily_checker` đếm chính xác
- Đảm bảo mọi câu trả lời có nguồn

**D3. CI crawler hàng tuần** (đã có `crawler.yml`)
- Kiểm tra & bật schedule, thêm cache để giảm random không cần thiết
- Thêm bước validate JSON trước khi commit

**D4. Structured Data (SEO nâng cao)**
- Thêm JSON-LD `LocalBusiness` / `WebSite` / `FAQPage`
- Schema FAQ cho 34 câu hỏi → tăng cơ hội rich snippet Google

**D5. Theo dõi lỗi frontend**
- `window.onerror` gửi về GAS API (tối giản, 0 chi phí)
- Báo cáo lỗi theo phiên bản trong dashboard

---

### Nhóm E: Nền tảng Dữ liệu (chuẩn bị Toàn quốc)

#### [MODIFY] `app.js` cache engine
- Chuyển dữ liệu lớn (>5MB, `market_prices`) từ localStorage → **IndexedDB**
- Thư viện nhẹ `idb-keyval` (CDN) hoặc wrapper tự viết
- Tránh tràn quota localStorage

#### [MODIFY] `Code.gs`
- Thêm logic lọc tin theo **quận/huyện** (gắn `location_keyword`)
- Hỗ trợ mở rộng RSS theo tỉnh thành khác (nền tảng toàn quốc)

---

## Verification Plan

### Automated
```bash
# 1. GIS — mọi polygon mới phải pass Ray-Casting
python tools/gis_verify_engine.py

# 2. Sức khỏe tổng thể (9 checks)
python tools/daily_checker.py

# 3. Validate JSON + JS
python -c "import json; [json.load(open('data/'+f, encoding='utf-8')) for f in ['map.geojson','bang_gia_dat_2026.json','official_documents.json','extra_data.json','planning_updates.json']]"
node --check app.js
```

### Manual
1. **Tra cứu trên mobile** (iPhone SE, Samsung Galaxy): bottom sheet, pull-to-refresh, phông chữ lớn
2. **Accessibility**: kiểm tra tương phản, điều hướng bàn phím, phóng chữ A++
3. **Xuất PDF**: báo cáo đủ 4 câu trả lời + bản đồ + biểu đồ
4. **So sánh 2 địa chỉ**: đúng dữ liệu từng khu vực
5. **Deploy staging** → test → merge `main`

---

## Lộ trình Triển khai

| Giai đoạn | Nội dung | Ước lượng |
|:---|:---|:---|
| **Phase 1** | Nhóm A: dữ liệu pháp lý chính thức (cần file NQ 52/2025) | Ưu tiên đầu |
| **Phase 2** | Nhóm B: mobile & accessibility | Sau Phase 1 |
| **Phase 3** | Nhóm C: tính năng giá trị cao (PDF, lịch sử, so sánh, đo đạc) | Sau Phase 2 |
| **Phase 4** | Nhóm D: vận hành tự động + Nhóm E: nền tảng dữ liệu | Song song |
| **Verify** | Kiểm tra tổng thể, deploy production | Cuối cùng |

---

## Tiêu chí hoàn thành v10.0

- ✅ Bảng giá 2026 **đầy đủ 17 khu vực**, hệ số K chính thức, không còn tuyến "chưa phân loại"
- ✅ Tra cứu hoạt động tốt trên **mobile** với bottom sheet + pull-to-refresh + phông chữ lớn
- ✅ Người dân **xuất được báo cáo PDF**, **theo dõi khu vực**, **so sánh 2 địa chỉ**
- ✅ Cảnh báo **Telegram tự động** khi hệ thống lỗi CRITICAL
- ✅ Dữ liệu lớn chuyển sang **IndexedDB**, không tràn localStorage
- ✅ Sẵn sàng nền tảng mở rộng **toàn quốc** (tầm nhìn DNA)
