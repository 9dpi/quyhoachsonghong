# Checkpoint v9.0 - 2026-08-19
## Dữ liệu pháp lý 2026, Tra cứu 4 câu trả lời, GIS 12 polygon & Nền tảng v10 Nhóm E

> **Trạng thái: ✅ ĐÃ HOÀN THÀNH, ĐÃ KIỂM THỬ (daily checker WARNING — không còn CRITICAL), ĐÃ ĐỒNG BỘ LÊN GITHUB**

Đợt nâng cấp này hoàn thiện **kế hoạch v9.0** (`implementation_plan.md`) và mở đầu **v10.0** (`implementation_plan_v10.md` — Nhóm E: nền tảng dữ liệu). Hệ thống `dulieuquyhoach.com` chuyển sang bảng giá đất 2026 (NQ 52/2025 × hệ số K QĐ 19/2026), công cụ tra cứu "Nhà tôi có bị quy hoạch" hiển thị **4 câu trả lời** thực sự, bản đồ mở rộng **12 polygon** và hiển thị tin tức + dự án hot.

---

## 🚀 Các Tính năng Mới đã Triển khai

### 1. Dữ liệu pháp lý 2026 (Nhóm A)
*   **`data/bang_gia_dat_2026.json` (mới):** Bảng giá đất Hà Nội 2026 theo **NQ 52/2025/NQ-HĐND** (hiệu lực 01/01/2026) — cấu trúc **17 khu vực (KV1-KV17)**, mỗi tuyến có VT1-VT4, kèm hệ số K theo **QĐ 19/2026/QĐ-UBND**. Tổng hợp **103 tuyến đường** từ Phụ lục 5.1 (50 tuyến đã phân loại khu vực; 53 tuyến đang chờ đối chiếu văn bản chính thức — đã đánh dấu trung thực trong `meta.note`).
*   **`tools/land_price_2026_extractor.py` (mới):** Script trích xuất tự động từ `phu_luc_5_1_*.json` / CSV / PDF → chuẩn hóa JSON 17 khu vực, tự mapping quận/huyện → khu vực.
*   **`data/extra_data.json`:** Thay toàn bộ 6 tham chiếu pháp lý cũ **QĐ 23/2014 → NQ 52/2025 & QĐ 19/2026**; bổ sung **5 FAQ mới** (17 khu vực, hệ số K, quyền xây dựng theo Luật Đất đai 2024, đất ven sông Hồng); thêm **4 mốc tiến độ 2026** (QH tổng thể 100 năm, Cầu Tứ Liên, Metro, KĐT Lĩnh Nam).

### 2. Mở rộng GIS 12 polygon (Nhóm B)
*   Bổ sung **7 polygon mới** (đồng bộ `map.geojson` + `map.geojson.js`): `cau_tu_lien` (🌉), `metro_line2`, `metro_line5` (🚇), `kdt_linh_nam` (🏙️), `dai_lo_song_hong` (🌊), `vd4_cau_hong_ha`, `vd4_cau_me_so` (VĐ4).
*   `contextualDocuments` trong `app.js`: cập nhật văn bản pháp lý **NQ 52/2025 + QĐ 19/2026** cho toàn bộ polygon.
*   Sửa polygon `metro_line2` quá rộng (ban đầu phá vỡ test "Đống Đa an toàn") → hành lang hẹp sát tuyến thực.

### 3. Tra cứu "4 câu trả lời" thực sự (Nhóm C)
*   **`checkMyHome()` viết lại hoàn chỉnh:** Geocoding 3 tầng (Fuse nội bộ → Nominatim API có timeout → fallback tâm bản đồ) + Point-in-Polygon + tra bảng giá 2026 (lazy-load) + giá thị trường lân cận.
*   **`renderPlanningResult()`:** Template **4 câu trả lời**: ① Quy hoạch (🟢🟡🟠🔴 theo mức ảnh hưởng) ② Giá đền bù (NQ 52/2025 × K) ③ Giá thị trường (10 BĐS/500m, loại outlier) ④ Chênh lệch & khuyến nghị (🟣 NÊN GIỮ → 🔴 NÊN BÁN) + **biểu đồ Chart.js** so sánh.
*   **Point-in-Polygon (Ray-Casting)** hỗ trợ Polygon & MultiPolygon — chạy client-side, tìm mọi polygon chứa điểm.
*   **Cache hiệu năng:** tin tức TTL 30 phút → **2 giờ**; cache riêng bảng giá **24h**; cache geocode (localStorage).

### 4. Mở rộng thu thập dữ liệu (Nhóm D — `Code.gs`)
*   **+4 nguồn RSS:** Thanh Niên, Dân Trí, Báo Đầu Tư, Hà Nội Mới (tổng 9 nguồn).
*   **Keywords mở rộng:** Metro, NQ 52, hệ số K, Đại lộ sông Hồng, QH tổng thể 100 năm, Cầu Hồng Hà/Mễ Sở...
*   **`isRelatedToQuyHoach` nâng cấp:** 3 lớp từ khóa (Strong / Base+Context / Fallback) + loại bỏ tin tỉnh khác; **`classifyNews()`** tự phân loại 6 nhóm (Quy hoạch/Giao thông/Đền bù/TĐC/Metro/Tin tức).

### 5. Giao diện & Trải nghiệm (Nhóm E)
*   **Legend:** thêm mã đất `DGT-METRO` + `DCS`; **`projectsData`** fallback đầy đủ 8 dự án; **skeleton loading** (keyframe `qhpulse`).
*   **Fix bug có sẵn:** `switchSideTab is not defined` (nút tab Chú Giải Đất không hoạt động).
*   **SEO:** tab "Tin Mới" bổ sung mục 5 (QH tổng thể 100 năm & 22 cầu vượt sông Hồng), mục 6 (Cầu Tứ Liên & Metro 8 tuyến), mục 3 theo NQ 52/2025; cập nhật meta description/keywords/OG/Twitter.
*   **Bản đồ sống động:** ranh giới dự án **ẩn mặc định** (bật qua toggle); **marker tin tức** hiển thị theo danh sách BẢN TIN (lazy-load đồng bộ); pin to + text to cho người cao tuổi.
*   **Dự án HOT:** `HOT_PROJECTS` + `detectHotProject()` — 15 dự án hot có icon riêng (🌉🛣️🚇🌊...), hiển thị badge trên **bài viết** và **pin bản đồ** (divIcon emoji + hiệu ứng pulse).

### 6. Nền tảng dữ liệu (v10 Nhóm E)
*   **IndexedDB Storage Engine** trong `app.js` (`dqh_db`): `dbGet/dbSet/dbDel` tự fallback localStorage — chuyển cache tin tức, bảng giá 2026, giá thị trường (5.200 BĐS ~4MB) sang IndexedDB.
*   **`Code.gs` đa tỉnh:** `location_keyword` + `LOCATION_MAP` (9 tỉnh) + `EXTRA_RSS_SOURCES`; **Google News RSS** (8 query — gom nhiều báo) + **`fetchFullArticle()`** (Readability-lite — trích nội dung đầy đủ `noiDungDayDu`, `hinhAnh`, `ngayDangGoc`, `nguonBao`).

### 7. Làm mới dữ liệu & Hạ tầng
*   **`market_prices.json/.js`:** tái tạo 5.200 BĐS bằng `crawler.py` (nâng cấp dùng **NQ 52/2025 × hệ số K**, nhận diện đủ 12 polygon GIS), timestamp tươi mới.
*   **`planning_updates.json`:** +7 cập nhật 2026; **`database.json`:** 15 tin (làm mới ngày + 5 tin mới).
*   **`deploy.bat`:** đơn giản hóa chỉ **commit + push**; sửa bug dấu ngoặc kép (`set "msg="`) khiến commit fail khi bấm Enter và bug `(hoac da commit san).` gây lỗi `. was unexpected` — **đã test E2E trong môi trường mô phỏng (EXIT 0)**.
*   **Dọn dẹp file thừa:** xóa `v1/` (backup), `*.bak`, `fix_v1.bat`, `sample-planning.geojson`, `diff_report.json`, `gis_verify_report.json`.
*   **`implementation_plan_v10.md` (mới):** kế hoạch v10.0 gồm 5 nhóm.

---

## 📂 Danh sách file được cập nhật/thêm mới

| Đường dẫn tệp tin | Loại | Trạng thái | Vai trò chính |
| :--- | :--- | :--- | :--- |
| `app.js` | JS Main | **MODIFIED** | Tra cứu 4 câu trả lời, PIP, IndexedDB, marker tin + dự án hot, accessibility |
| `Code.gs` | GAS | **MODIFIED** | RSS mở rộng, classifyNews, location_keyword, Google News + full article (ngoài git — paste thủ công) |
| `index.html` | HTML | **MODIFIED** | SEO Tin Mới, legend, skeleton, pulse hot pin |
| `data/bang_gia_dat_2026.json` | Data | **NEW** | Bảng giá 2026: 17 khu vực, VT1-VT4, hệ số K |
| `data/map.geojson` + `map.geojson.js` | GIS | **MODIFIED** | 12 polygon (7 dự án mới) |
| `data/extra_data.json` | Data | **MODIFIED** | FAQ 2026 + tiến độ |
| `data/planning_updates.json` | Data | **MODIFIED** | +7 cập nhật 2026 |
| `data/market_prices.json` + `.js` | Data | **MODIFIED** | 5.200 BĐS (NQ 52/2025 × K) |
| `data/database.json` | Data | **MODIFIED** | 15 tin tuyển chọn |
| `tools/land_price_2026_extractor.py` | Python | **NEW** | Trích xuất bảng giá 2026 |
| `tools/crawler.py` | Python | **MODIFIED** | Dùng NQ 52/2025 × K |
| `tools/daily_checker.py` | Python | **MODIFIED** | Check 9 (bảng giá 2026) + polygon bắt buộc |
| `deploy.bat` | Script | **MODIFIED** | Commit + push đơn giản, đã fix bug |
| `implementation_plan.md` | Docs | **MODIFIED** | Trạng thái triển khai |
| `implementation_plan_v10.md` | Docs | **NEW** | Kế hoạch v10.0 |

---

## 🧪 Kết quả Kiểm chứng & Độ tin cậy

*   **GIS Verification:** 🟢 **6/6 PASS** (đã sửa polygon metro_line2 phá vỡ test bất biến).
*   **Daily Checker (9 checks):** 🟢 **Từ CRITICAL → WARNING** — 7/9 OK (GIS, Freshness, Link, Data Quality, Market Prices, Q&A, Map Polygons); 2 WARNING thông tin (văn bản ≤2022 để tham khảo lịch sử + bảng giá 2026 chờ đối chiếu chính thức).
*   **Test trình duyệt thực tế:**
    *   "Phố Ấu Triệu, Hoàn Kiếm" → 🟢 AN TOÀN + giá đền bù **267 tr/m²** (Ấu Triệu KV1, VT1=243tr × K=1.1) + giá thị trường **164 tr/m²** (10 tin/500m) + 🟣 NÊN GIỮ, CHỜ ĐỀN BÙ (chênh -62%) + Chart.js.
    *   "Phường Ngọc Thụy, Long Biên" → 🟠 TRONG KHU QUY HOẠCH sông Hồng R1-R2.
    *   IndexedDB: cache tin 280, market 5.200, bảng giá 17 khu vực.
    *   Dự án hot: 10 pin icon trên bản đồ + 12 badge trên bài viết; nhận diện đúng (Metro, Vành đai 4, Sông Hồng...).
*   **deploy.bat:** test E2E mô phỏng → commit + push thành công, EXIT 0.

---

## 🔮 Kế hoạch Giai đoạn tiếp theo (v10.0)

1.  **Nhóm A — Dữ liệu chính thức:** cập nhật `bang_gia_dat_2026.json` đầy đủ theo văn bản gốc NQ 52/2025 (53 tuyến chưa phân loại), hệ số K chính thức từng khu vực; tọa độ thật Cầu Tứ Liên/Metro; `tools/legal_docs_crawler.py`.
2.  **Nhóm B — Mobile & Accessibility:** bottom sheet kết quả trên mobile, pull-to-refresh, chế độ "Phông chữ lớn" A/A+/A++, tương phản + focus + ARIA.
3.  **Nhóm C — Tính năng giá trị cao:** xuất báo cáo PDF (4 câu trả lời + bản đồ + biểu đồ), lịch sử tra cứu, so sánh 2 địa chỉ, theo dõi khu vực (Zalo/Telegram), công cụ đo khoảng cách/diện tích.
4.  **Nhóm D — Vận hành tự động:** Telegram cảnh báo CRITICAL, chuẩn hóa QA.json, CI crawler, structured data (Schema.org), theo dõi lỗi frontend.
5.  **Cần người dùng cung cấp:** file PDF/Excel **NQ 52/2025 chính thức**; bản vẽ/tọa độ chính thức; chọn kênh theo dõi (Zalo OA/Telegram/email).
