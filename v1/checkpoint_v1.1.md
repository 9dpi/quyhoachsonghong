# 🚩 CHECKPOINT v1.1 - DULIEUQUYHOACH.COM (Backup Snapshot)
**Thời gian:** 16/05/2026 | 11:05 AM

## 🎯 Trạng thái hiện tại
Dự án đang ở trạng thái **MVP+**, đã hoàn thiện các tính năng cốt lõi và sẵn sàng cho việc nâng cấp lên phiên bản 1.1. File này đóng vai trò là snapshot lưu trữ trạng thái trước khi tiến hành các thay đổi lớn cho v1.1.

## 🚀 Các tính năng cốt lõi hiện có

### 1. Hệ thống Backend (Google Apps Script)
- **Scraper thông minh**: Tự động lấy tin từ 5 nguồn RSS chính thống, lọc theo bộ từ khóa quy hoạch mở rộng.
- **Tích hợp AI (Gemini 1.5 Flash)**: Tự động trích xuất địa chỉ, tên dự án, và giá đền bù từ bài báo vào Google Sheets.
- **Quản lý dữ liệu**: Tự động hóa việc tạo và cấu hình 6 bảng dữ liệu (News, Progress, FAQ, Planning, Projects, Land Price).
- **GitHub Sync**: Tự động đồng bộ dữ liệu vào `database.json` để phục vụ frontend.

### 2. Hệ thống Frontend (Web App)
- **Tra cứu thông minh**: Phân biệt tra cứu địa chỉ cụ thể vs. tra cứu khu vực diện rộng.
- **Báo cáo quy hoạch**: Hiển thị trạng thái giải tỏa, dự án liên quan, tiến độ và máy tính bồi thường.
- **Tiến độ dự án (Timeline)**: Hiển thị mốc thời gian theo từng dự án cụ thể với Sub-tabs.
- **Bản đồ trực quan**: Tích hợp Leaflet, hỗ trợ hiển thị điểm (Markers) và ranh giới vùng (GeoJSON GIS).
- **Hiệu suất cao**: Áp dụng cơ chế **Lazy Loading (Infinite Scroll)** cho danh sách tin tức.

### 3. Bảo mật & Hạ tầng
- **deploy.bat**: Script tự động đẩy code lên GitHub Pages, loại trừ các file nhạy cảm.
- **.gitignore**: Cấu hình bảo vệ `Code.gs` và các Token bí mật.
- **SEO Ready**: Cấu trúc HTML ngữ nghĩa, thẻ Meta đầy đủ.

## 📊 Trạng thái dữ liệu (Tại thời điểm snapshot)
- Dữ liệu tin tức và tiến độ mới nhất ghi nhận vào ngày **15/05/2026**.
- Chưa có dữ liệu mới cho ngày 16/05/2026 (đã kiểm tra lúc 10:58 AM).

## 📅 Tiến độ Version 1.1
- [x] Tích hợp Tra cứu gần đúng (Fuzzy Search) với Fuse.js. ✅
- [x] Cập nhật giao diện và logic tính đền bù theo 4 vị trí đất (với hệ số giả định). ✅
- [ ] Nhập liệu thực tế 50-100 địa chỉ quy hoạch vào `DanhSachQuyHoach`.
- [ ] Số hóa ranh giới các dự án vào file `data/map.geojson` (Sử dụng QGIS).
- [ ] Cập nhật bảng giá đất mới nhất (Nghị quyết 52/2025/NQ-HĐND) vào Sheet.

---
**Ghi chú:** File này được cập nhật để ghi nhận tiến độ triển khai Version 1.1.
