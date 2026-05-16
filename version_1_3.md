Phase 5: Nhập bảng giá đền bù bằng AI
Tuyệt vời! Đây là tác vụ hoàn hảo để ứng dụng AI ngay lập tức. Mình sẽ hướng dẫn bạn chi tiết từ A đến Z.

📋 Tổng quan Phase 5
Mục tiêu	Nhập toàn bộ bảng giá đất Hà Nội (QĐ 30/2019 + QĐ 71/2024) vào Google Sheets
Công cụ	Gemini (miễn phí) hoặc ChatGPT Plus (có phí)
Thời gian	2-4 giờ (bao gồm kiểm tra dữ liệu)
Kết quả	Sheet BangGiaDat với cấu trúc chuẩn, sẵn sàng tra cứu
🔍 Bước 0: Hiểu về nguồn dữ liệu
Theo kết quả tìm kiếm, hiện có 2 văn bản quan trọng:

Văn bản	Hiệu lực	Ghi chú
QĐ 30/2019/QĐ-UBND	01/01/2020 - 31/12/2024	Văn bản gốc 
QĐ 71/2024/QĐ-UBND	20/12/2024 - 31/12/2025	Sửa đổi, bổ sung QĐ 30, áp dụng hiện tại 
Khuyến nghị: Nên nhập QĐ 71/2024 vì đang có hiệu lực và có giá trị cao hơn (một số tuyến đường lên đến 695 triệu đồng/m²) .

📊 Bước 1: Tạo cấu trúc Sheet đích
Tạo sheet BangGiaDat với các cột sau:

Tên cột	Kiểu dữ liệu	Ý nghĩa	Ví dụ
tuyen_duong	Text	Tên đường/phố	Nguyễn Văn Cừ
quan_huyen	Text	Quận/Huyện	Long Biên
vi_tri_1	Number	Giá mặt đường (triệu/m²)	45
vi_tri_2	Number	Giá ngõ rộng ≥3.5m	36
vi_tri_3	Number	Giá ngõ rộng 2-3.5m	27
vi_tri_4	Number	Giá ngõ hẹp <2m	18
ghi_chu	Text	Ghi chú (nếu có)	Áp dụng từ 20/12/2024
🤖 Bước 2: Dùng AI để trích xuất dữ liệu
Cách 1: Dùng Gemini (Miễn phí, khuyến nghị)
Link tải file nguồn:

Tải QĐ 71/2024 từ LuatVietnam  - có file PDF/DOC kèm theo

Các bước thực hiện:

Tải file PDF/DOC từ nguồn trên

Mở Gemini (https://gemini.google.com)

Upload file lên Gemini

Prompt mẫu:

text
Hãy trích xuất toàn bộ bảng giá đất từ file này.

Cấu trúc cần trích xuất:
- Tên đường
- Quận/Huyện
- Vị trí 1 (đơn vị triệu đồng/m²)
- Vị trí 2
- Vị trí 3
- Vị trí 4

Yêu cầu:
1. Chỉ lấy các tuyến đường có giá đất ở (đất phi nông nghiệp)
2. Loại bỏ các dòng tiêu đề, chú thích
3. Xuất ra định dạng CSV với dấu phẩy (,) phân cách
4. Giá trị số chỉ cần phần số, không kèm đơn vị

File đính kèm: [upload file của bạn]
Cách 2: Dùng ChatGPT Plus (Có phí, xử lý file lớn tốt hơn)
Tương tự Gemini, upload file và dùng prompt tương tự.

🔧 Bước 3: Làm sạch dữ liệu sau khi AI xuất
AI có thể mắc lỗi nhỏ. Bạn cần kiểm tra:

Checklist kiểm tra:
markdown
□ Cột tuyen_duong: Không có số, chỉ tên đường
□ Cột quan_huyen: Đúng tên 30 quận/huyện Hà Nội
□ Cột vi_tri_1,2,3,4: Là số, không có ký tự lạ
□ Không có dòng trống giữa các bản ghi
□ Không có dòng tiêu đề lẫn trong dữ liệu
Công thức Google Sheets để phát hiện lỗi:
javascript
// Phát hiện ô không phải số ở cột vi_tri_1
=ISNUMBER(C2) 

// Chuẩn hóa tên quận (nếu bị viết tắt)
=PROPER(TRIM(B2))
📤 Bước 4: Import vào Google Sheets
Cách nhanh nhất:
Copy dữ liệu CSV AI trả về

Mở Google Sheets → Extension → Tạo sheet mới

Paste đặc biệt (Ctrl+Shift+V) để dán chỉ giá trị

Dùng Data → Split text to columns nếu cần

Hoặc dùng IMPORTDATA (nếu có URL file CSV):
google
=IMPORTDATA("URL_file_CSV_của_bạn")
🧪 Bước 5: Kiểm tra tính hợp lý
Kiểm tra 1: Giá trị có nằm trong khoảng hợp lý không?
Khu vực	Giá vị trí 1 (triệu/m²)	Kiểm tra
Hoàn Kiếm (trung tâm)	187 - 695	✅ 
Long Biên (ven sông)	30 - 60	✅
Mê Linh (vùng ven)	5 - 20	✅
Kiểm tra 2: Quy tắc vị trí (vị trí 1 > vị trí 2 > vị trí 3 > vị trí 4)
google
=AND(C2>D2, D2>E2, E2>F2)
Nếu ra FALSE → sai quy tắc, cần kiểm tra lại.

📁 Bước 6: Tạo bảng lookup để tra cứu nhanh
Tạo sheet BangGiaDat_Lookup với công thức:
google
=ARRAYFORMULA(
  QUERY(
    BangGiaDat!A:G,
    "SELECT A, B, C, D, E, F 
     WHERE A IS NOT NULL 
     ORDER BY B, A"
  )
)
Tạo hàm tìm kiếm trong Apps Script:
javascript
function TRA_GIA_DIA_CHI(duong, viTri) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('BangGiaDat');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === duong.toLowerCase()) {
      const cotViTri = viTri === 1 ? 2 : (viTri === 2 ? 3 : (viTri === 3 ? 4 : 5));
      return data[i][cotViTri];
    }
  }
  return "Không tìm thấy";
}
⏱️ Lộ trình cụ thể cho Phase 5
Thời gian	Nhiệm vụ	Đầu ra
Giờ 1	Tìm và tải file QĐ 71/2024	File PDF/DOC
Giờ 2	Dùng Gemini trích xuất (3-4 lần cho từng quận)	File CSV từng phần
Giờ 3	Làm sạch và ghép dữ liệu	1 file CSV hoàn chỉnh
Giờ 4	Import vào Sheets + kiểm tra	Sheet BangGiaDat hoàn thiện
Lưu ý: Do file bảng giá lớn (hàng nghìn tuyến đường), bạn nên chia nhỏ prompt theo từng quận để AI xử lý tốt hơn.

✅ Tiêu chí hoàn thành Phase 5
Sheet BangGiaDat có tối thiểu 2.000 dòng (phủ 30 quận/huyện)

Cột tuyen_duong không trùng lặp trong cùng quận

Cột vi_tri_1 > vi_tri_2 > vi_tri_3 > vi_tri_4 cho mọi dòng

Có thể tra cứu nhanh bằng hàm TRA_GIA_DIA_CHI

🔄 Cập nhật dữ liệu sau này
Khi có bảng giá mới (dự kiến năm 2026 theo QĐ mới ), bạn chỉ cần lặp lại quy trình:

Tìm file mới

Dùng AI trích xuất

Override sheet cũ

