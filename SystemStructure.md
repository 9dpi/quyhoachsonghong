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

Dựa trên phân tích các trang thông tin quy hoạch khác (như các cổng thông tin về bồi thường, tái định cư của TP.HCM hay Hà Nội), tôi đã tổng hợp được 4 tính năng cốt lõi có thể tạo ra sự khác biệt lớn.

🗺️ 1. Bản đồ "Khoanh vùng quy hoạch" (Lớp phủ Polygon)
Tham khảo từ: Các cổng GIS (Hệ thống thông tin địa lý) của Sở Quy hoạch.

Giá trị cốt lõi: Người dùng chỉ cần nhìn thấy màu sắc trên bản đồ sẽ biết ngay khu vực của mình có nằm trong dự án hay không.

Cách thực hiện: Vẽ các đường ranh giới (polygon) cho 4 khu tái định cư và các tuyến đường mới (Vành đai 4, Đại lộ sông Hồng). Dùng màu sắc để phân biệt trạng thái: Đỏ (giải tỏa toàn bộ), Cam (giải tỏa một phần), Vàng (giáp ranh, có thể ảnh hưởng).

📊 2. Công cụ "Tính sơ bộ giá trị bồi thường"
Tham khảo từ: Các trang tính tiền bồi thường của dự án Nhổn - ga Hà Nội hay các khu đô thị mới.

Giá trị cốt lõi: Đây là tính năng gây chú ý mạnh nhất. Giải tỏa nỗi lo tài chính của người dân.

Cách thực hiện: Xây dựng một biểu mẫu đơn giản hỏi 3-4 câu:

Diện tích đất của bạn là bao nhiêu m2?

Vị trí đất của bạn thuộc khu vực nào? (Mê Linh / Lĩnh Nam / Hồng Hà / Bát Tràng)

Loại đất: Đất ở / Đất vườn / Đất nông nghiệp?

Kết quả: Ước tính sơ bộ số tiền đền bù dựa trên hệ số K (ví dụ: 2 lần giá đất cho khu Hồng Hà). Quan trọng: Luôn có dòng chữ "Đây là ước tính tham khảo" để tránh trách nhiệm pháp lý.

💬 3. "Góc hỏi đáp" và Tổng hợp thắc mắc
Tham khảo từ: Các group Facebook về cộng đồng dân cư và mục FAQ trên các trang dự án.

Giá trị cốt lõi: Xây dựng một cơ sở tri thức chung, giải đáp những câu hỏi lặp đi lặp lại, từ đó giảm tải áp lực hỏi đáp riêng lẻ.

Cách thực hiện:

Giai đoạn đầu: Bạn tự tổng hợp các câu hỏi thường gặp (ví dụ: "Khi nào có tiền? Thủ tục thế nào? Được đất tái định cư hay tiền?").

Giai đoạn sau: Tạo một form để người dùng gửi câu hỏi. Bạn sẽ trả lời và đưa câu trả lời vào mục này. Điều này vừa xây dựng cộng đồng vừa tạo nội dung quý giá.

🔔 4. Theo dõi tiến độ theo khu vực (Cập nhật điểm nóng)
Tham khảo từ: Các bảng tin dự án của chủ đầu tư.

Giá trị cốt lõi: Cung cấp thông tin cập nhật mang tính địa phương cao mà báo chí lớn thường không có.

Cách thực hiện: Tạo một mục "Bảng tin tiến độ" đơn giản bằng Google Sheet. Chia làm 4 cột: Khu vực | Ngày cập nhật | Nội dung (kiểm kê, họp dân, niêm yết...) | Nguồn tin. Đây là thông tin cực kỳ "khát" với người dân trong từng dự án.

📝 Tổng kết: Lộ trình xây dựng tính năng cho MVP+
Bạn không cần làm hết tất cả cùng lúc. Hãy ưu tiên để tạo ra tác động nhanh nhất:

Thứ tự ưu tiên	Tính năng	Mức độ khó	Giá trị mang lại
1 (Làm ngay)	Hoàn thiện Bản đồ Polygon (Tính năng 1)	Trung bình	Cao nhất (trực quan, cốt lõi)
2 (Làm tiếp)	Công cụ Tính bồi thường (Tính năng 2)	Trung bình (làm trong Sheet)	Rất cao (giải tỏa nỗi lo tiền bạc)
3 (Tích lũy dần)	Cập nhật Bảng tin tiến độ (Tính năng 4)	Dễ (thêm vào Sheet)	Cao (xây dựng lòng tin và sự quay lại)
4 (Làm sau cùng)	Góc Hỏi đáp (Tính năng 3)	Dễ (trang tĩnh)	Trung bình (hỗ trợ cộng đồng)