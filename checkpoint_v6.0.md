# Checkpoint v6.0 - 2026-05-21
## Hệ thống Rà soát Quy hoạch & Đối soát GIS Tự động hóa Toàn diện (GHA Pipeline & Dashboard)

> **Trạng thái: ✅ HOÀN THÀNH, ĐÃ TEST PASS 100% & ĐỒNG BỘ GITHUB PAGES**
> Pipeline tự động cào tin tức quy hoạch, đo đạc dịch chuyển đa giác, chạy đối soát mốc tọa độ bất biến và tự động push lên GitHub khi thành công đã hoạt động trơn tru.

---

## 🚀 Các Tính năng Mới đã Triển khai

### 1. GIS Verify Engine (`tools/gis_verify_engine.py` & `data/gis_test_cases.json`)
*   **Bộ Test Cases Bất biến:** Cấu hình 6 điểm mốc quan trọng nhất bao gồm các mốc quy hoạch (`INSIDE`) tại Vành đai 4 An Khánh, Cầu Long Biên, TĐC Mê Linh, TĐC Lĩnh Nam và các mốc an toàn (`SAFE`) tại nội đô sâu như **118 Phố Huế** và Đống Đa.
*   **Engine Ray-Casting:** Thuật toán Point-in-Polygon viết bằng Python thuần, xử lý nhanh chóng trong vài mili-giây mà không cần thư viện ngoài.
*   **Unicode/UTF-8 Auto-Encoding:** Tự động phát hiện và reconfigure stdout/stderr sang mã hóa UTF-8 để khắc phục triệt để lỗi `UnicodeEncodeError` khi chạy trên hệ điều hành Windows.

### 2. Polygon Diff Engine (`tools/polygon_diff.py`)
*   **Shoelace Area Formula:** Đo diện tích đa giác thực tế trực tiếp dưới dạng Hectares (ha) với hệ số điều chỉnh phẳng theo vĩ độ Hà Nội (~21°N).
*   **Jaccard Index (IoU) Grid-Sampling:** Sử dụng phương pháp chia lưới điểm 100x100 (10,000 điểm) để tính toán tỷ lệ tương đồng ranh giới cực kỳ chuẩn xác và bền bỉ.
*   **Boundary Shift Metering:** Đo dịch chuyển biên lớn nhất (Hausdorff Distance xấp xỉ) bằng mét để phát hiện sự thay đổi ranh giới.

### 3. Planning Scraper Bán tự động (`tools/planning_scraper.py` & `data/planning_updates.json`)
*   **Geocoding Trực tuyến:** Tự động lấy tọa độ qua Nominatim API của OpenStreetMap.
*   **Smart Fallback & Offline Cache:** Tích hợp bộ nhớ đệm tọa độ ngoại tuyến giúp bypass hoàn toàn các lỗi SSL hết hạn thường gặp của website chính phủ hoặc các lớp tường lửa chặn IP.

### 4. GIS Diff Dashboard Trực quan (`tools/gis_diff_dashboard.html`)
*   **Leaflet Split Map:** Thiết kế 2 bản đồ song song (Original vs Proposed) đồng bộ hóa góc nhìn kéo/zoom hoàn hảo.
*   **Bảng So sánh & Test Cases động:** Click vào từng test case để bản đồ tự động bay và focus vào điểm tọa độ thực tế.
*   **Bảng Biên tập JSON:** Hỗ trợ admin can thiệp biên tập trực tiếp chuỗi tọa độ GeoJSON ngay trên giao diện web.

### 5. GitHub Actions CI/CD Pipeline (`.github/workflows/planning_auto_update.yml`)
*   **Cron Tự động hóa:** Tự động kích hoạt lúc 9h sáng thứ Hai hàng tuần hoặc chạy thủ công.
*   **Auto-Merge & Push:** Tự động commit và đẩy mã nguồn lên GitHub nếu vượt qua 100% test cases.
*   **Tạo Issue Cảnh báo Đỏ:** Nếu phát hiện lỗi (ví dụ 118 Phố Huế dính quy hoạch), pipeline dừng lập tức và tự động tạo một GitHub Issue cảnh báo kèm báo cáo chi tiết điểm thất bại.
*   **Tối ưu hóa Cảnh báo:** Đặt `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` và loại bỏ caching pip dư thừa, giúp pipeline chạy đạt **Tick xanh** sạch sẽ 100%.

---

## 📂 Danh sách file bổ sung vào Kho Mã nguồn

| Đường dẫn tệp tin | Loại tệp | Trạng thái | Vai trò chính |
| :--- | :--- | :--- | :--- |
| `.github/workflows/planning_auto_update.yml` | YAML Workflow | **NEW** | Pipeline tự động hóa GHA chạy hàng tuần |
| `tools/gis_verify_engine.py` | Python Script | **NEW** | Bộ máy chạy đối soát mốc tọa độ chuẩn |
| `tools/polygon_diff.py` | Python Script | **NEW** | Bộ so sánh ranh giới, tính IoU & Hausdorff |
| `tools/planning_scraper.py` | Python Script | **NEW** | Module cào văn bản điều chỉnh & Geocoding |
| `tools/gis_diff_dashboard.html` | HTML Dashboard | **NEW** | Dashboard trực quan hóa hai bản đồ song song |
| `data/gis_test_cases.json` | JSON Data | **NEW** | Cấu hình 6 mốc đối soát bất biến |
| `data/planning_updates.json` | JSON Data | **NEW** | Bản ghi đề xuất cập nhật ranh giới từ scraper |
| `data/diff_report.json` | JSON Data | **NEW** | Báo cáo chênh lệch diện tích & độ tương đồng |
| `data/gis_verify_report.json` | JSON Data | **NEW** | Báo cáo kết quả kiểm thử mốc tọa độ thực tế |

---

## 🧪 Kết quả Kiểm chứng Sản phẩm

| Môi trường kiểm thử | Trạng thái chạy | Kết quả đối soát | Trạng thái Git |
| :--- | :--- | :--- | :--- |
| **Local Environment** | ✅ SUCCESS | 6/6 Test Cases ĐẠT | Sạch sẽ, không file rác |
| **GitHub Actions runner** | ✅ SUCCESS | Green Tick, Đạt 100% | Đã tự động Push |

---

## 🔮 Kế hoạch Giai đoạn tiếp theo (Checkpoint v7.0)

1.  **Overlay Bản đồ Raster:** Hỗ trợ quét và đè ảnh bản đồ quy hoạch gốc dạng scan trực tiếp lên Leaflet.
2.  **Thông báo Webhook Telegram/Zalo:** Tự động gửi tin nhắn báo cáo ngắn gọn tới Telegram Group khi phát hiện có cập nhật ranh giới quy hoạch mới.
