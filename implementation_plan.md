# Kế hoạch Nâng cấp DULIEUQUYHOACH.COM v9.0
## Tối ưu Hiệu năng, Cập nhật Dữ liệu Chính xác & Mở rộng Dự án Quy hoạch Hà Nội

### Bối cảnh & Phạm vi

Hệ thống hiện tại (v8.0) đã có nền tảng vững chắc: bản đồ GIS Leaflet, hệ thống thu thập tin tức RSS tự động, kiểm tra sức khỏe hàng ngày, và giao diện Glassmorphism cao cấp. Tuy nhiên, sau khi khảo sát toàn bộ codebase và đối chiếu với thực tế quy hoạch Hà Nội 2026, hệ thống còn **nhiều điểm cần nâng cấp trọng yếu** để đảm bảo độ chính xác và tính hữu ích cho người dân.

---

## User Review Required

> [!IMPORTANT]
> **Thay đổi pháp lý quan trọng:** Bảng giá đất Hà Nội 2026 được quy định bởi **Nghị quyết 52/2025/NQ-HĐND** (có hiệu lực từ 01/01/2026), thay thế hoàn toàn QĐ 71/2024. Hệ thống hiện tại vẫn tham chiếu QĐ 71/2024 và QĐ 30/2019 — cần cập nhật gấp.

> [!WARNING]
> **Hệ số K mới:** UBND Hà Nội đã ban hành **Quyết định 19/2026/QĐ-UBND** (hiệu lực từ 02/02/2026) về hệ số điều chỉnh giá đất. Toàn bộ công thức tính đền bù trong hệ thống cần được cập nhật theo văn bản này.

> [!IMPORTANT]
> **Dự án hạ tầng mới cần bổ sung:** Cầu Tứ Liên (khởi công 19/5/2025, ~20.000 tỷ), hệ thống Metro 8 tuyến (khởi công đồng loạt 2025-2026), Quy hoạch tổng thể Thủ đô tầm nhìn 100 năm (phê duyệt 13/5/2026) — hiện chưa có trong hệ thống.

---

## Open Questions

> [!IMPORTANT]
> 1. **Nguồn dữ liệu bảng giá đất 2026:** Anh/chị có file PDF/Excel bảng giá đất theo Nghị quyết 52/2025/NQ-HĐND chưa? Nếu có, tôi sẽ viết script trích xuất tự động. Nếu chưa, tôi sẽ crawl từ các cổng thông tin chính thức.

> [!IMPORTANT]
> 2. **Phạm vi GeoJSON mở rộng:** Hiện tại `map.geojson` chỉ có 5 polygon (Sông Hồng R1-R2, Vành đai 4, TĐC Mê Linh, TĐC Lĩnh Nam, Giáp ranh VĐ4). Có cần bổ sung polygon cho Cầu Tứ Liên, tuyến Metro, và các khu đô thị mới không?

> [!IMPORTANT]
> 3. **Bảng giá đất mới chia 17 khu vực** (thay vì theo quận/huyện như cũ). Logic tra cứu và cấu trúc dữ liệu `BangGiaDat` cần thiết kế lại hoàn toàn. Xác nhận hướng đi này?

---

## Proposed Changes

Kế hoạch chia thành **5 nhóm nâng cấp chính**, sắp xếp theo mức độ ưu tiên:

---

### Nhóm A: Cập nhật Dữ liệu Pháp lý & Bảng giá đất 2026 (Ưu tiên Cao nhất)

#### [MODIFY] [official_documents.json](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/data/official_documents.json)
- Thêm **Nghị quyết 52/2025/NQ-HĐND** (Bảng giá đất 2026) — thay thế QĐ 71/2024 làm văn bản chính
- Thêm **Quyết định 19/2026/QĐ-UBND** (Hệ số K điều chỉnh giá đất 2026)
- Thêm **Quy hoạch tổng thể Thủ đô tầm nhìn 100 năm** (phê duyệt 13/5/2026)
- Cập nhật link PDF chính thức cho các văn bản mới
- Đánh dấu QĐ 71/2024 và QĐ 30/2019 là "Hết hiệu lực / Tham khảo lịch sử"

#### [MODIFY] [extra_data.json](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/data/extra_data.json)
- Cập nhật FAQ: thay tham chiếu QĐ 30/2019, QĐ 23/2014 bằng Nghị quyết 52/2025 và QĐ 19/2026
- Bổ sung FAQ mới về: bảng giá đất chia 17 khu vực, hệ số K theo QĐ 19/2026, quyền xây dựng trên đất quy hoạch theo Luật Đất đai 2024
- Cập nhật `progress` với các mốc tiến độ thực tế 2026

#### [NEW] `data/bang_gia_dat_2026.json`
- Cấu trúc mới theo 17 khu vực (thay vì theo quận/huyện)
- Hỗ trợ 4 vị trí (VT1-VT4) cho đất phi nông nghiệp
- Bao gồm hệ số K mặc định theo QĐ 19/2026
- Trường dữ liệu: `khuVuc`, `tuyenDuong`, `loaiDat`, `vt1`, `vt2`, `vt3`, `vt4`, `heSoK`, `ghiChu`

#### [NEW] `tools/land_price_2026_extractor.py`
- Script Python trích xuất bảng giá đất từ file PDF Nghị quyết 52/2025
- Xuất ra `bang_gia_dat_2026.json` chuẩn
- Tự động mapping quận/huyện cũ → 17 khu vực mới

---

### Nhóm B: Mở rộng Dữ liệu GIS & Dự án Quy hoạch

#### [MODIFY] [map.geojson](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/data/map.geojson)
Bổ sung polygon cho các dự án hạ tầng trọng điểm mới:

| ID Polygon | Tên dự án | Loại | Màu |
|:---|:---|:---|:---|
| `cau_tu_lien` | Cầu Tứ Liên & đường dẫn 2 đầu cầu | Hạ tầng giao thông | `#8b5cf6` |
| `metro_line2` | Tuyến Metro số 2 (Nam Thăng Long – Trần Hưng Đạo) | Metro | `#06b6d4` |
| `metro_line5` | Tuyến Metro số 5 (Văn Cao – Hòa Lạc) | Metro | `#14b8a6` |
| `kdt_linh_nam` | Khu đô thị mới phường Lĩnh Nam | Khu đô thị | `#6366f1` |
| `dai_lo_song_hong` | Trục Đại lộ cảnh quan sông Hồng | Hạ tầng cảnh quan | `#0891b2` |
| `vd4_cau_hong_ha` | Cầu Hồng Hà (Vành đai 4) | Hạ tầng giao thông | `#ef4444` |
| `vd4_cau_me_so` | Cầu Mễ Sở (Vành đai 4) | Hạ tầng giao thông | `#ef4444` |

#### [MODIFY] [contextualDocuments trong app.js](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/app.js#L28-L46)
- Bổ sung tài liệu pháp lý cho các polygon mới (cầu Tứ Liên, Metro, KĐT Lĩnh Nam)
- Cập nhật link QĐ 71/2024 → Nghị quyết 52/2025

#### [MODIFY] [planning_updates.json](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/data/planning_updates.json)
- Bổ sung 5+ cập nhật quy hoạch mới (Cầu Tứ Liên, Metro, KĐT Lĩnh Nam, VĐ4 tiến độ mới, Quy hoạch sông Hồng)

---

### Nhóm C: Tối ưu Logic Tra cứu & Hiệu năng

#### [MODIFY] [app.js](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/app.js)

**C1. Nâng cấp hàm `checkMyHome()` (dòng 651-665)**
- Hiện tại chỉ hiển thị placeholder "Đang đối soát" → Tích hợp đầy đủ logic tra cứu:
  - Geocoding địa chỉ → tọa độ (Nominatim API)
  - Point-in-polygon kiểm tra tọa độ với tất cả GeoJSON polygon
  - Tra cứu bảng giá đất 2026 theo tên đường + khu vực
  - Hiển thị kết quả "4 câu trả lời" đầy đủ (Quy hoạch, Đền bù, Thị trường, Khuyến nghị)

**C2. Nâng cấp hàm `renderPlanningResult()` (dòng 668-692)**
- Thay thế layout placeholder bằng template "4 câu trả lời" đã thiết kế trong V6.md
- Tích hợp biểu đồ Chart.js so sánh giá đền bù vs giá thị trường
- Thuật toán verdict tự động (🟣 Giữ / 🔵 Cân nhắc / 🟡 Trung lập / 🟠 Cân nhắc bán / 🔴 Bán ngay)

**C3. Cải thiện hiệu năng cache (dòng 56-82)**
- Nâng cache TTL từ 30 phút → 2 giờ cho dữ liệu tin tức
- Thêm cache riêng cho dữ liệu bảng giá đất (TTL 24h — hiếm thay đổi)
- Thêm cache cho kết quả geocoding đã tra (tránh gọi API lặp)
- IndexedDB thay localStorage cho dữ liệu > 5MB (market_prices)

**C4. Bổ sung hàm Point-in-Polygon JavaScript**
- Thuật toán Ray-Casting chạy client-side
- Hỗ trợ cả Polygon và MultiPolygon
- Tìm tất cả polygon chứa điểm (một địa chỉ có thể nằm trong nhiều vùng quy hoạch)

**C5. Bổ sung tra cứu giá thị trường lân cận**
- Hàm tìm 10 BĐS gần nhất trong bán kính 500m từ `market_prices.json`
- Tính giá trung bình, loại bỏ outlier
- Hiển thị khoảng dao động giá

---

### Nhóm D: Mở rộng Nguồn Thu thập Dữ liệu

#### [MODIFY] [Code.gs](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/Code.gs)

**D1. Bổ sung RSS Sources mới (dòng 18-24)**
```
Thêm nguồn:
- https://thanhnien.vn/rss/bat-dong-san.rss
- https://dantri.com.vn/rss/bat-dong-san.htm
- https://baodautu.vn/bat-dong-san-rss.rss
- https://hanoimoi.vn/rss/bat-dong-san.rss (báo Hà Nội Mới — nguồn chính thống nhất)
```

**D2. Mở rộng Keywords (dòng 26-45)**
Bổ sung keywords cho các dự án mới:
```
"Cầu Tứ Liên", "Metro Hà Nội", "đường sắt đô thị",
"tuyến số 2", "tuyến số 5", "Nam Thăng Long",
"Trần Hưng Đạo", "Văn Cao", "Hòa Lạc",
"Nghị quyết 52", "bảng giá đất 2026", "hệ số K",
"QĐ 19/2026", "Đại lộ sông Hồng",
"Quy hoạch tổng thể Thủ đô", "tầm nhìn 100 năm",
"APEC 2027", "Cầu Hồng Hà", "Cầu Mễ Sở"
```

**D3. Cải thiện logic lọc tin (hàm `isRelatedToQuyHoach`)**
- Thêm lọc theo tổ hợp keyword (ví dụ: "Hà Nội" + "quy hoạch" cùng xuất hiện)
- Phân loại tin tức tự động: `Quy hoạch`, `Giao thông`, `Đền bù`, `Tái định cư`, `Metro`, `Tin tức`
- Loại bỏ tin trùng lặp thông minh hơn (so sánh similarity thay vì exact match title)

#### [MODIFY] [tools/daily_checker.py](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/tools/daily_checker.py)
- Cập nhật kiểm tra tham chiếu văn bản mới (NQ 52/2025, QĐ 19/2026)
- Bổ sung kiểm tra GIS cho polygon mới (Cầu Tứ Liên, Metro...)
- Bổ sung cảnh báo khi bảng giá đất chưa cập nhật theo năm hiện hành

---

### Nhóm E: Nâng cấp Giao diện & Trải nghiệm Người dùng

#### [MODIFY] [index.html](file:///d:/Automator_Prj/DuLieu_QuyHoach_SongHong/index.html)

**E1. Bổ sung danh sách dự án vào sidebar tab "DỰ ÁN" (hardcoded fallback)**
Cập nhật `projectsData` fallback (dòng 193-198 app.js) với danh sách đầy đủ:

| Dự án | Chủ đầu tư | Quy mô | Trạng thái |
|:---|:---|:---|:---|
| Vành đai 4 | Ban QLDA Thăng Long | 112.8 km | Thi công (GPMB >99%) |
| Cầu Tứ Liên | Liên danh CTCP | 4.8 km, ~20.000 tỷ | Thi công (từ 05/2025) |
| Metro tuyến 2 | Ban QLDA ĐSĐT | Nam Thăng Long – Trần Hưng Đạo | Khởi công 2025 |
| Metro tuyến 5 | Ban QLDA ĐSĐT | Văn Cao – Hòa Lạc | Khởi công 2025 |
| QH Phân khu Sông Hồng | UBND TP Hà Nội | 12.000 ha, 55 km | Đã phê duyệt |
| KĐT mới Lĩnh Nam | Chưa công bố | Phường Lĩnh Nam | Khởi công 08/2026 |
| Đại lộ cảnh quan sông Hồng | UBND TP Hà Nội | Trục cảnh quan trung tâm | Quy hoạch |
| Trục Thăng Long | UDIC | Khu đô thị phía Tây | Quy hoạch |

**E2. Cập nhật nội dung SEO tab "TIN MỚI" (dòng 2134-2204)**
- Bổ sung thông tin Cầu Tứ Liên, Metro, QH tổng thể 100 năm
- Cập nhật bảng giá đất tham chiếu NQ 52/2025 thay vì QĐ 71/2024
- Thêm mục "Hệ thống 22 cầu vượt sông Hồng"

**E3. Cập nhật Legend Chú giải đất**
- Thêm mã đất mới: `DGT-Metro` (Đất hạ tầng đường sắt đô thị), `DCS` (Đất cảnh quan sinh thái)

**E4. Cải thiện Mobile UX**
- Bổ sung hiển thị trạng thái Loading khi tra cứu (skeleton UI)
- Pull-to-refresh cho danh sách tin tức trên mobile
- Bottom sheet kết quả tra cứu (thay vì side panel khó thao tác trên mobile)

---

## Verification Plan

### Automated Tests
```bash
# 1. Kiểm tra GIS - tất cả polygon mới phải pass Ray-Casting test
python tools/gis_verify_engine.py

# 2. Kiểm tra sức khỏe tổng thể
python tools/daily_checker.py

# 3. Validate JSON files
python -c "import json; [json.load(open(f'data/{f}')) for f in ['map.geojson','bang_gia_dat_2026.json','official_documents.json','extra_data.json','planning_updates.json']]"
```

### Manual Verification
1. **Tra cứu thực tế:** Nhập 5 địa chỉ mẫu thực tế, kiểm tra kết quả "4 câu trả lời"
2. **Đối chiếu bảng giá:** So sánh giá đất hiển thị với bảng giá chính thức NQ 52/2025
3. **Kiểm tra GeoJSON:** Xác nhận polygon Cầu Tứ Liên, Metro hiển thị đúng trên bản đồ
4. **Mobile test:** Kiểm tra responsive trên iPhone SE, Samsung Galaxy
5. **Deploy staging:** Push lên nhánh `staging` của GitHub Pages, test trước khi merge `main`

---

## Lộ trình Triển khai

| Giai đoạn | Nội dung | Ước lượng |
|:---|:---|:---|
| **Phase 1** | Nhóm A: Cập nhật dữ liệu pháp lý & bảng giá đất | Ưu tiên đầu tiên |
| **Phase 2** | Nhóm B: Mở rộng GeoJSON & dự án quy hoạch | Sau Phase 1 |
| **Phase 3** | Nhóm C: Tối ưu logic tra cứu & hiệu năng | Sau Phase 2 |
| **Phase 4** | Nhóm D: Mở rộng nguồn thu thập + Nhóm E: Giao diện | Song song |
| **Verify** | Kiểm tra tổng thể, deploy production | Cuối cùng |

---

## ✅ Trạng thái Triển khai (Cập nhật 19/08/2026)

> Đợt nâng cấp v9.0 đã được triển khai một phần. Dưới đây là trạng thái từng hạng mục theo kế hoạch.

### Hoàn thành ✅

| Hạng mục | Chi tiết |
|:---|:---|
| **A.2 FAQ & Progress** | `extra_data.json`: thay toàn bộ tham chiếu QĐ 23/2014 → NQ 52/2025, QĐ 19/2026; thêm 5 FAQ mới (17 khu vực, hệ số K, quyền xây dựng theo Luật Đất đai 2024, đất ven sông Hồng); thêm 4 mốc tiến độ 2026 |
| **A.3 Bảng giá 2026** | Tạo `data/bang_gia_dat_2026.json`: cấu trúc 17 khu vực (KV1-KV17), VT1-VT4, hệ số K; 103 tuyến đường từ Phụ lục 5.1 (50 tuyến đã phân loại khu vực) |
| **A.4 Extractor** | Tạo `tools/land_price_2026_extractor.py`: tổng hợp phu_luc/CSV/PDF → JSON chuẩn, tự mapping khu vực |
| **B.1 GeoJSON** | `map.geojson` + `map.geojson.js`: thêm 7 polygon mới (Cầu Tứ Liên, Metro 2, Metro 5, KĐT Lĩnh Nam, Đại lộ sông Hồng, Cầu Hồng Hà, Cầu Mễ Sở) → tổng 12 polygon, GIS verify 6/6 PASS |
| **B.2 Văn bản pháp lý** | `app.js` `contextualDocuments`: cập nhật NQ 52/2025, QĐ 19/2026 cho toàn bộ polygon |
| **C.1 + C.2 Tra cứu 4 câu trả lời** | `app.js`: viết lại `checkMyHome()` (geocode Fuse → Nominatim, cache) + `renderPlanningResult()` (4 module: Quy hoạch, Đền bù NQ 52/2025 × K, Giá thị trường 500m, Chênh lệch & khuyến nghị với Chart.js) |
| **C.3 Cache** | TTL tin tức 30 phút → 2 giờ; cache riêng bảng giá 24h (`dqh_landprice2026_v1`); cache geocode (`dqh_geocode_v1`) |
| **C.4 Point-in-Polygon** | Thêm hàm Ray-Casting hỗ trợ Polygon & MultiPolygon trong `app.js` |
| **C.5 Giá thị trường lân cận** | `findNearbyMarketPrices()`: 10 BĐS trong 500m, loại bỏ outlier, khoảng dao động |
| **D.1 RSS Sources** | `Code.gs`: thêm 4 nguồn (Thanh Niên, Dân Trí, Báo Đầu Tư, Hà Nội Mới) |
| **D.2 Keywords** | Thêm keywords Metro, NQ 52, hệ số K, Đại lộ sông Hồng, Quy hoạch tổng thể 100 năm, Cầu Hồng Hà/Mễ Sở |
| **D.3 Lọc & phân loại tin** | Nâng cấp `isRelatedToQuyHoach` (strong/context/base keywords, loại bỏ tin tỉnh khác) + `classifyNews()` tự phân loại 6 nhóm |
| **E.1 Dự án fallback** | `projectsData` đầy đủ 8 dự án với thông tin chủ đầu tư, quy mô, trạng thái |
| **E.3 Legend** | Thêm `DGT-METRO` và `DCS` vào Chú giải đất |
| **E.4 Skeleton loading** | Thêm keyframe `qhpulse` + UI loading khi tra cứu |
| **Verification** | `daily_checker.py` thêm check 9 (bảng giá 2026) + kiểm tra polygon bắt buộc; GIS 6/6 PASS; toàn bộ JSON hợp lệ |

### Còn lại / Cần lưu ý ⚠️

1. **Đối chiếu dữ liệu bảng giá chính thức:** 103 tuyến trong `bang_gia_dat_2026.json` được tổng hợp từ Phụ lục 5.1 (bảng cũ). **Cần đối chiếu từng tuyến với NQ 52/2025 chính thức** và cập nhật `khuVuc` + `heSoK` (53 tuyến chưa phân loại). Kế hoạch đã nhắc điều này — đây là việc cần nguồn dữ liệu từ anh/chị (PDF/Excel NQ 52/2025).
2. **✅ ĐÃ LÀM MỚI (19/08/2026):** `market_prices.json` + `market_prices.js` (chạy lại `tools/crawler.py` — 5.200 BĐS, dùng bảng giá NQ 52/2025 × hệ số K, nhận diện 12 polygon GIS); `planning_updates.json` (thêm 7 cập nhật 2026: Cầu Tứ Liên, Metro 2 & 5, KĐT Lĩnh Nam, VĐ4 APEC 2027, QH tổng thể 100 năm, NQ 52/2025); `database.json` (làm mới ngày + thêm 5 tin mới). Daily checker từ CRITICAL → WARNING.
3. **✅ ĐÃ CẬP NHẬT SEO (19/08/2026):** tab "Tin Mới" trong `index.html` — thêm mục 5 (QH tổng thể 100 năm & 22 cầu vượt sông Hồng), mục 6 (Cầu Tứ Liên & Metro 8 tuyến), cập nhật mục 3 theo NQ 52/2025 + QĐ 19/2026 + 17 khu vực; thẻ meta description/keywords/OG/Twitter đã bổ sung từ khóa mới.
4. **Open Questions từ kế hoạch vẫn cần trả lời:** nguồn PDF bảng giá 2026, phạm vi GeoJSON chính thức cho Cầu Tứ Liên/Metro.
5. **Polygon mới là vị trí minh họa:** tọa độ Cầu Tứ Liên, Metro, Đại lộ sông Hồng là ước tính — cần thay bằng bản vẽ chính thức khi có.
6. **Cấu hình Telegram:** `daily_checker.py` đã hỗ trợ biến môi trường `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` nhưng chưa được cấu hình trong GitHub Actions — cần thêm secrets để nhận cảnh báo CRITICAL qua Telegram.

---

## 🔜 Kế hoạch phiên bản tiếp theo

> Chi tiết đầy đủ: **[implementation_plan_v10.md](implementation_plan_v10.md)**

v10.0 tập trung 4 nhóm:
1. **Nhóm A** — Đưa dữ liệu pháp lý về trạng thái chính thức (bảng giá đầy đủ 17 khu vực, hệ số K chính thức, tọa độ thật cho Cầu Tứ Liên/Metro)
2. **Nhóm B** — Mobile & accessibility (bottom sheet, pull-to-refresh, phông chữ lớn cho người cao tuổi)
3. **Nhóm C** — Tính năng giá trị cao (xuất PDF, lịch sử tra cứu, so sánh 2 địa chỉ, đo đạc, theo dõi khu vực)
4. **Nhóm D + E** — Vận hành tự động (Telegram cảnh báo, structured data, IndexedDB) chuẩn bị nền tảng toàn quốc


--
🚀 Chiến lược cải thiện để thu hút và tối ưu tìm kiếm
1. Tối ưu cho Người Dùng (User-Centric) - Đặt câu hỏi "Nhà tôi..." lên đầu tiên
Mục tiêu: Biến trang web/ứng dụng của bạn trở thành công cụ giải đáp ngay lập tức cho nỗi lo lớn nhất của người dân.

Hành động:

Tạo Landing Page riêng: Thay vì để người dùng vào thẳng index.html (có thể là bản đồ), hãy tạo một trang giới thiệu đơn giản với một ô tìm kiếm to, nổi bật. Mẫu câu: "Tra cứu ngay: Địa chỉ nhà bạn có nằm trong quy hoạch Sông Hồng?" .

Ưu tiên tính năng địa chỉ: Đảm bảo chức năng tìm kiếm theo địa chỉ là thao tác chính và dễ dàng nhất. Kết quả trả về cần hiển thị trực quan (màu sắc trên bản đồ) và kèm theo giải thích ngắn gọn .

Gợi ý các câu hỏi phổ biến: Bên dưới ô tìm kiếm, đặt một số câu hỏi mẫu như: "Tôi ở phường Phú Thượng", "Nhà tôi gần cầu Long Biên" .

2. Tối ưu cho Công cụ Tìm kiếm (SEO) - Trở thành nguồn thông tin đáng tin cậy
Mục tiêu: Đứng đầu các kết quả tìm kiếm cho các từ khóa như "quy hoạch sông Hồng", "bản đồ quy hoạch Hà Nội", "tra cứu quy hoạch Sông Hồng".

Hành động:

Nội dung tĩnh, giàu thông tin: Bạn đã có các trang như tin-tuc-quy-hoach.html, gioi-thieu.html [URL]. Hãy tận dụng triệt để chúng. Viết các bài viết giải thích chi tiết về các khu vực, các loại đất (ODT, DGT, DCS...), và cập nhật tiến độ dự án .

Tối ưu thẻ meta: Đảm bảo mỗi trang đều có thẻ <title> và <meta description> hấp dẫn, chứa từ khóa chính. Ví dụ: <title>Tra cứu Quy hoạch Sông Hồng 2026 | Nhà tôi có bị ảnh hưởng?</title>.

Cập nhật thường xuyên: Việc bạn có các file checkpoint (checkpoint_v*.md) là một điểm cộng. Hãy viết các bài blog hoặc cập nhật trạng thái dự án trên trang tin tức của bạn để Google thấy website được "chăm sóc" thường xuyên.

Tận dụng Sitemap và Robots: Bạn đã có sitemap.xml và robots.txt [URL]. Hãy kiểm tra và đảm bảo chúng được cấu hình chính xác để Google dễ dàng thu thập dữ liệu.

3. Xây dựng Thương hiệu và Cộng đồng
Mục tiêu: Tạo dựng niềm tin và sự lan tỏa.

Hành động:

Làm nổi bật "Tổ công tác truyền thông": Tin tức về việc Hà Nội thành lập Tổ công tác truyền thông là một cơ hội vàng để khẳng định vị thế của bạn . Bạn có thể viết bài: "Dự án quy hoạch Sông Hồng: Nắm bắt thông tin từ nguồn nào cho đúng?", trong đó giới thiệu về Tổ công tác và nhấn mạnh vai trò của trang web bạn là một công cụ trực quan hóa dữ liệu công khai.
