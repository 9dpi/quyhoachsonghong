# SystemStructure.md - DNA Dự Án dulieuquyhoach.com (v3.0)

## 1. Tổng quan & Mục tiêu

**Dự án:** Hệ thống tra cứu thông tin quy hoạch, giải phóng mặt bằng và tái định cư cho các dự án ven sông Hồng, Hà Nội.

**Mục tiêu cốt lõi:**
- Trả lời câu hỏi số một của người dân: **"Nhà tôi có nằm trong diện quy hoạch không?"**
- Cung cấp thông tin minh bạch, trực quan qua bản đồ.
- Tự động cập nhật tin tức từ các nguồn chính thống.
- Hỗ trợ ước tính sơ bộ giá trị bồi thường.

---

## 2. Kiến trúc Hệ thống (Serverless Architecture)

Hệ thống được xây dựng hoàn toàn trên nền tảng miễn phí, không cần máy chủ.

```mermaid
flowchart LR
    A[User] --> B[GitHub Pages<br>dulieuquyhoach.com]
    B --> C{App Script API<br>(Frontend gọi)}
    C --> D[Google Sheets<br>Primary DB]
    C --> E[GitHub JSON<br>Fallback DB]
    
    F[Time-driven Trigger] --> G[Apps Script<br>Auto Parser]
    G --> H[RSS Báo chí]
    G --> D
Thành phần	Vai trò	Công nghệ	Trạng thái
Frontend	Giao diện, bản đồ tương tác	HTML5, CSS, JavaScript, Leaflet.js	✅ Hoạt động
Primary DB	Quản lý dữ liệu quy hoạch (cập nhật thủ công + tự động)	Google Sheets	✅ Hoạt động
Backup DB	Dữ liệu tĩnh dự phòng (lưu vết phiên bản)	GitHub JSON	✅ Hoạt động
Auto Parser	Tự động đọc RSS, lọc tin, ghi vào Sheet & GitHub	Google Apps Script + Time-driven Trigger	✅ Hoạt động
API Layer	Cung cấp JSON cho Frontend từ Sheet	Google Apps Script (doGet)	✅ Hoạt động
3. DNA Giá Trị Cốt Lõi (5 điểm)
Người dân là trung tâm: Mọi tính năng đều hướng đến việc giải đáp trực tiếp nỗi lo của hộ dân trong diện quy hoạch.

Siêu tinh gọn (Ultra-Lean): Chi phí vận hành gần như bằng 0 (chỉ trả tên miền).

Trực quan & Tin cậy: Bản đồ polygon khoanh vùng + nguồn tin từ báo chí chính thống.

Hỗ trợ Tài chính: Công cụ ước tính bồi thường dựa trên Quyết định 30/2024/QĐ-UBND.

Cập nhật liên tục: Tự động quét tin tức 2 lần/ngày (9h & 16h).

4. Hiện trạng & Lộ trình phát triển (Roadmap)
✅ Giai đoạn 1: Nền tảng (Đã hoàn thành)
Thiết lập GitHub Pages, mua domain dulieuquyhoach.com.

Xây dựng giao diện cơ bản, tích hợp bản đồ Leaflet.

Kết nối Google Sheets + Apps Script API.

Hiển thị 4 điểm (marker) cho khu tái định cư.

🚀 Giai đoạn 2: Tính năng chuyên sâu (Đang thực hiện)
Nhà tôi có quy hoạch?: Tích hợp tìm kiếm địa chỉ (Nominatim).

Vẽ ranh giới (Polygon): Đã vẽ xong 4 khu tái định cư trọng điểm.

Công cụ tính bồi thường: Xây dựng biểu mẫu + logic tính theo QĐ 30/2024.

Bảng tin tiến độ: Tạo sheet riêng và hiển thị trên web.

🤖 Giai đoạn 3: Tự động hóa & Cộng đồng (Hoàn thành cơ bản)
Auto Parser: Đã hoàn thiện script Apps Script để crawl RSS lúc 9h và 16h (setupDailyTriggers). ✅

Góc Hỏi đáp (FAQ): Tổng hợp câu hỏi thường gặp từ cộng đồng.

Báo cáo thực địa: Cho phép người dùng gửi ảnh cập nhật tiến độ.

5. Hướng dẫn vận hành
Cập nhật dữ liệu thủ công
Mở Google Sheet (ID: 1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I).

Thêm/sửa thông tin tại sheet 4_Khu_Tai_Dinh_Cu.

Dữ liệu sẽ tự động cập nhật trên website sau 5-10 phút.

Kích hoạt Auto Parser (Bước tiếp theo)
Mở Apps Script trong Sheet.

Chạy hàm setupDailyTriggers() một lần duy nhất.

Kiểm tra tại mục Triggers (đồng hồ bấm giờ) để xác nhận đã có 2 trigger.

Xử lý sự cố
Bản đồ không hiển thị marker/polygon: Kiểm tra Console trình duyệt (F12), xem API fetch có bị lỗi CORS không.

Dữ liệu không cập nhật: Kiểm tra Google Sheet đã có hàng mới chưa. Nếu có, kiểm tra Web App URL trong app.js đã đúng chưa.

6. Tài liệu tham khảo
Thư viện bản đồ: Leaflet.js

Nền bản đồ: CartoDB Voyager (dùng với Leaflet)

Geocoding: Nominatim (OpenStreetMap)

Cơ sở pháp lý: Quyết định 30/2024/QĐ-UBND (giá bồi thường)

Nguồn tin chính thống: Tuổi Trẻ, VietnamNet, Dân Việt, Sở Quy hoạch HN

*Tài liệu này là "DNA" của dự án, dùng để định hướng phát triển và onboard cộng tác viên. Cập nhật lần cuối: 16/05/2026.*