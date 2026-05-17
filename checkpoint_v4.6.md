# Checkpoint v4.6 - 2026-05-17
## Hoàn thành các cập nhật UI và Tự động hóa

### 1. Cập nhật Giao diện & Nội dung
- **Thư viện tài liệu**: Đã thêm phần thư viện tài liệu vào `tai-ban-do-quy-hoach.html` với 3 nhóm tài liệu chính (Bảng giá đất, Quy hoạch, Pháp lý).
- **Social Links**: Cập nhật link Facebook, Zalo, TikTok, YouTube ở header và footer.
- **Logo**: Sửa lỗi đường dẫn logo trong `index.html` và `tai-ban-do-quy-hoach.html` thành `branding/dulieuquyhoach.png`.

### 2. Tính năng & Popup (app.js)
- **Nút Tra cứu Bảng giá đất**: Đã thêm nút "TRA CỨU BẢNG GIÁ ĐẤT" vào hầu hết các popup và bảng thông tin (Gửi yêu cầu, Không tìm thấy dữ liệu, Bản tin chi tiết, Kết quả tra cứu, Thành công).
- **Popup Giới thiệu**: Triển khai nội dung giới thiệu kênh thông tin và các link mạng xã hội khi bấm vào link "Giới thiệu" ở footer.
- **Popup Điều khoản**: Triển khai nội dung Điều khoản sử dụng chi tiết (5 điều khoản) khi bấm vào link "Điều khoản" ở footer.

### 3. Hệ thống Tự động hóa
- Xác nhận hệ thống tự động hóa hoạt động tốt:
  - **Google Sheets**: Tự động quét tin RSS 2 lần/ngày (9h & 16h) qua GAS.
  - **Website**: Tự động cập nhật cache từ Sheet 1 lần/mỗi giờ qua GitHub Action.

### 4. Các việc cần làm tiếp theo (Nếu cần)
- Kiểm tra file `data/map.geojson` để hiển thị ranh giới trên bản đồ.
- Cấu hình lại `GAS_API_URL` và `GEMINI_API_KEY` nếu muốn kích hoạt tính năng AI trích xuất địa chỉ tự động.
