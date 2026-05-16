Tổng quan lộ trình (4 phase)
Phase	Thời gian	Mục tiêu	Kết quả đạt được
Phase 1	Tuần 1-2	Dữ liệu nền + Tra cứu cơ bản	Có thể tra "Nhà tôi có trong diện quy hoạch?" cho 4 khu TĐC
Phase 2	Tuần 3-4	Thêm giá đền bù + Hỏi đáp	Có thể tra giá + gửi câu hỏi khi thiếu dữ liệu
Phase 3	Tuần 5-6	Bản đồ + Tiến độ gắn địa chỉ	Xem bản đồ polygon + mỗi tra cứu đều có tiến độ
Phase 4	Tuần 7-8	Hoàn thiện + Mở rộng	Tối ưu UX, mở rộng dữ liệu ra toàn Hà Nội
🚀 Phase 1: Dữ liệu nền + Tra cứu cơ bản (Tuần 1-2)
Mục tiêu
Có thể tra cứu "Nhà tôi có trong diện quy hoạch?" cho 4 khu TĐC (Mê Linh, Lĩnh Nam, Hồng Hà, Bát Tràng)

Công việc chi tiết
STT	Nhiệm vụ	Người thực hiện	Đầu ra
1.1	Cài đặt QGIS, học digitize polygon	Bạn	4 file GeoJSON (1/khu)
1.2	Vẽ polygon ranh giới 4 khu TĐC	Bạn	Polygon hoàn chỉnh
1.3	Tạo sheet DanhSachQuyHoach	Bạn	Sheet với cấu trúc: địa_chỉ_chuẩn, dự_án, mức_độ_ảnh_hưởng, lat, lng
1.4	Nhập dữ liệu mẫu cho 4 khu (10-20 địa chỉ/khu)	Bạn	Ít nhất 50 bản ghi
1.5	Tạo Apps Script API đọc sheet	Bạn	URL trả JSON
1.6	Code frontend: form nhập địa chỉ + hiển thị kết quả	Bạn	Giao diện tra cứu cơ bản
1.7	Tìm kiếm chính xác (match chuỗi)	Bạn	Tra đúng "Số 5/46 Cổ Linh" ra kết quả
1.8	Deploy lên GitHub Pages	Bạn	dulieuquyhoach.com hoạt động
Kết quả đạt được sau Phase 1
text
✅ User vào web
✅ Gõ "Số 5/46 Cổ Linh, Long Biên"
✅ Kết quả hiển thị:
   🟠 Một phần - Dự án Vành đai 2.5
   (chưa có giá, chưa có tiến độ, chưa có bản đồ)
✅ Nếu gõ địa chỉ chưa có → báo "Chưa có dữ liệu"
Tiêu chí hoàn thành Phase 1
4 polygon được vẽ xong

Sheet DanhSachQuyHoach có ≥ 50 bản ghi

API trả về đúng kết quả cho 10 địa chỉ test

Web hiển thị đúng phân cấp màu 🔴🟠🟡🟢

GitHub Pages hoạt động với domain

🚀 Phase 2: Thêm giá đền bù + Hỏi đáp (Tuần 3-4)
Mục tiêu
Có thể tra giá đền bù cho bất kỳ địa chỉ nào ở Hà Nội

User có thể gửi câu hỏi khi thiếu dữ liệu

Công việc chi tiết
STT	Nhiệm vụ	Đầu ra
2.1	Tìm và tải bảng giá đất QĐ 30/2019 (toàn Hà Nội)	File Excel
2.2	Nhập vào sheet BangGiaDat	Sheet với cấu trúc: tuyến_đường, quận, vị_trí_1,2,3,4
2.3	Viết hàm lookup giá theo địa chỉ (ưu tiên: số nhà → mặt đường → phường)	Logic trong Apps Script hoặc frontend
2.4	Tạo sheet HoiDap	Sheet với cấu trúc đã thống nhất
2.5	Tạo API ghi câu hỏi vào sheet HoiDap	Apps Script function doPost
2.6	Code form "Hỏi đáp" (hiển thị khi chưa có dữ liệu)	Form gửi câu hỏi
2.7	Tích hợp giá đền bù vào kết quả tra cứu	Kết quả tra cứu hiển thị thêm dòng 💰
2.8	Admin panel đơn giản (Google Sheets) để xem và trả lời câu hỏi	Sheet HoiDap + hướng dẫn
Kết quả đạt được sau Phase 2
text
✅ User tra "Số 5/46 Cổ Linh, Long Biên"
✅ Kết quả hiển thị:
   🟠 Một phần - Vành đai 2.5
   💰 Đền bù: 45.000.000đ/m² (vị trí 1)
   
✅ Nếu chưa có dữ liệu → form "Hỏi đáp" hiện ra
✅ User gửi câu hỏi → lưu vào sheet
Tiêu chí hoàn thành Phase 2
Sheet BangGiaDat có ≥ 500 dòng (đủ phủ 4 quận trọng tâm)

Tra cứu giá hoạt động cho 10 địa chỉ test

Form "Hỏi đáp" ghi được dữ liệu vào sheet

Có quy trình xử lý câu hỏi (bạn hoặc admin trả lời trong vòng 3 ngày)

🚀 Phase 3: Bản đồ + Tiến độ gắn địa chỉ (Tuần 5-6)
Mục tiêu
Xem bản đồ quy hoạch với polygon 4 khu

Mỗi kết quả tra cứu đều có tiến độ dự án

Công việc chi tiết
STT	Nhiệm vụ	Đầu ra
3.1	Xuất GeoJSON từ QGIS (4 polygon)	File quyhoach.geojson
3.2	Tích hợp Leaflet.js + GeoJSON lên web	Bản đồ hiển thị polygon với màu theo mức độ
3.3	Tạo sheet TienDoTheoDuAn	Sheet với cấu trúc: dự_án, buoc_tien_do, ngay_cap_nhat, ghi_chu
3.4	Nhập tiến độ cho 4 dự án (dùng dữ liệu từ báo/crawl)	Sheet có 4-8 dòng (mỗi dự án 1-2 bước)
3.5	Sửa kết quả tra cứu: thêm dòng 📍 Tiến độ	Hiển thị bước hiện tại của dự án
3.6	Thêm tab "Bản đồ" riêng trên web	User có thể xem bản đồ toàn màn hình
3.7	(Tùy chọn) Crawl RSS thu thập tin tức → lưu vào sheet BaiBao	Dữ liệu thô để tham khảo
Kết quả đạt được sau Phase 3
text
✅ Kết quả tra cứu đầy đủ:
   🟠 Một phần - Vành đai 2.5
   💰 Đền bù: 45.000.000đ/m² (vị trí 1)
   📍 Tiến độ: Đang giải phóng mặt bằng (cập nhật 15/05/2026)
   
✅ User mở tab "Bản đồ" → thấy 4 polygon màu 🔴🟠🟡🟢
✅ Click vào polygon → hiển thị thông tin dự án
Tiêu chí hoàn thành Phase 3
Bản đồ hiển thị đúng 4 polygon

Mỗi polygon có màu tương ứng mức độ ảnh hưởng

Sheet TienDoTheoDuAn có dữ liệu cho 4 dự án

Kết quả tra cứu hiển thị đủ 3 dòng (quy hoạch, giá, tiến độ)

🚀 Phase 4: Hoàn thiện + Mở rộng (Tuần 7-8)
Mục tiêu
Tối ưu UX (tìm kiếm gần đúng, load nhanh)

Mở rộng dữ liệu ra toàn bộ Hà Nội (không chỉ 4 khu)

Công việc chi tiết
STT	Nhiệm vụ	Đầu ra
4.1	Tích hợp Fuse.js (tìm kiếm gần đúng)	Gõ "Co Linh" vẫn ra "Cổ Linh"
4.2	Thêm tính năng "Gõ đường/phường → hiện tất cả số nhà"	Kết quả dạng list hoặc bảng
4.3	Cache tĩnh (GitHub Actions + file JSON)	Giảm tải API, load nhanh hơn
4.4	Mở rộng dữ liệu: thêm 10-20 dự án mới (từ Hỏi đáp + tự thu thập)	Sheet DanhSachQuyHoach có ≥ 500 bản ghi
4.5	Tối ưu mobile (responsive)	Dùng được trên điện thoại
4.6	Thêm nút chia sẻ Zalo/Facebook	Tăng viral
4.7	Viết hướng dẫn sử dụng (video hoặc text)	User tự dùng được
Kết quả đạt được sau Phase 4
text
✅ Gõ "co linh, long bien" → vẫn ra kết quả
✅ Gõ "Cổ Linh" → hiện danh sách 10+ số nhà, mỗi số có mức độ ảnh hưởng
✅ Tra cứu bất kỳ địa chỉ nào ở Hà Nội → có kết quả hoặc gửi câu hỏi
✅ Web load nhanh (< 1 giây)
✅ Người dùng chia sẻ web dễ dàng
Tiêu chí hoàn thành Phase 4
Tìm kiếm gần đúng hoạt động

Sheet DanhSachQuyHoach có ≥ 500 bản ghi

Cache tĩnh được cài đặt

Responsive mobile đạt yêu cầu

Có ít nhất 50 câu hỏi trong HoiDap và đã trả lời

📊 Tổng kết các mốc quan trọng
text
Tuần 2: 🎉 DEMO Phase 1 - "Nhà tôi có quy hoạch?" cho 4 khu
Tuần 4: 🎉 DEMO Phase 2 - Có giá đền bù + Hỏi đáp
Tuần 6: 🎉 DEMO Phase 3 - Có bản đồ + tiến độ
Tuần 8: 🎉 LAUNCH Phase 4 - Bản public chính thức
⚠️ Rủi ro và phương án giảm thiểu
Rủi ro	Khả năng	Phương án
Vẽ polygon mất thời gian hơn dự kiến	Cao	Thuê freelance (5-10tr/4 khu) hoặc dùng dữ liệu có sẵn từ open data
Bảng giá đất QĐ 30/2019 khó tìm file số	Trung bình	Nhập tay 100-200 tuyến đường chính trước, mở rộng dần
Apps Script quota bị vượt	Thấp (giai đoạn đầu)	Chuyển sang cache tĩnh sớm (Phase 4 lên Phase 3)
User không gửi câu hỏi	Trung bình	Tự tạo 20-30 câu hỏi giả để kích cầu + quảng bá trên group FB