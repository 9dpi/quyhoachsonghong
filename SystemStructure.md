# Hệ Thống Tra Cứu Quy Hoạch Sông Hồng (DULIEUQUYHOACH.COM)

## 🏗️ Kiến Trúc Hệ Thống (v2.9)

Hệ thống được thiết kế theo mô hình **Serverless Static Web**, sử dụng GitHub làm nơi lưu trữ dữ liệu và Google Apps Script làm công cụ tự động hóa.

### 1. Thành phần chính:
- **Frontend (UI/UX)**: 
    - Ngôn ngữ: HTML5, Vanilla CSS, JavaScript.
    - Bản đồ: **Leaflet.js** với nền **Voyager (CartoDB)**.
    - Định vị: **Nominatim OSM API** (Geocoding miễn phí).
- **Database (JSON Engine)**:
    - File: `data/database.json`.
    - Lợi thế: Tốc độ tải cực nhanh, hỗ trợ văn bản dài, versioning bởi Git.
- **Automation (Built-in Scraper)**:
    - Công cụ: **Google Apps Script**.
    - Nhiệm vụ: Tự động quét RSS từ các báo chính thống và đẩy dữ liệu trực tiếp vào file JSON trên GitHub qua GitHub API.

### 2. Luồng dữ liệu (Data Flow):
1. **Scraping**: Apps Script (Trigger định kỳ) -> Fetch RSS -> Lọc tin "Sông Hồng" -> GitHub API.
2. **Storage**: GitHub Repo nhận Commit mới -> Cập nhật file `database.json`.
3. **Delivery**: Người dùng truy cập Web -> Fetch `database.json` (Raw URL) -> Vẽ Marker & Polygon lên bản đồ.
4. **Search**: Người dùng nhập địa chỉ -> Nominatim API -> Trả về tọa độ -> Đối soát ranh giới Quy hoạch.

## 📈 Lộ trình phát triển (Roadmap)

### ✅ Giai đoạn 1: Nền tảng (Hoàn thành)
- [x] Thiết lập GitHub Pages & Domain.
- [x] Xây dựng giao diện Light Mode chuẩn SEO & Font tiếng Việt (Be Vietnam Pro).
- [x] Tích hợp bản đồ tương tác và 4 khu tái định cư mẫu.

### 🚀 Giai đoạn 2: Tính năng chuyên sâu (Đang thực hiện)
- [x] **Nhà tôi có quy hoạch?**: Tích hợp Geocoding thực tế.
- [x] **Vẽ ranh giới**: Hiển thị các vùng Polygon của 4 khu tái định cư trọng điểm.
- [ ] **Tải lên 1/5000**: Số hóa các bản vẽ quy hoạch chi tiết từ file PDF/CAD sang định dạng GeoJSON.

### 🤖 Giai đoạn 3: AI & Cộng đồng
- [ ] **AI Assistant**: Chatbot tư vấn quy hoạch dựa trên dữ liệu văn bản pháp lý.
- [ ] **Báo cáo vi phạm**: Cho phép người dân gửi hình ảnh thực tế tại các điểm quy hoạch.

---
*Cập nhật lần cuối: 15/05/2026 bởi Hệ thống Tự động.*