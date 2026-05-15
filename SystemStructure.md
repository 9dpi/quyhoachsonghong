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

--
Update Tra cứu quy hoạch
PLAN: Hoàn thiện tính năng "Tra cứu địa chỉ quy hoạch"
🎯 Mục tiêu
Người dùng nhập địa chỉ (VD: "165 phố Huế") → Hệ thống trả về:

Có/không nằm trong diện quy hoạch

Thông tin dự án (tên, chủ đầu tư, quy mô)

Tiến độ hiện tại của dự án

Chính sách đền bù (hệ số K, đơn giá)

Ước tính sơ bộ số tiền

Phase 1: Chuẩn bị dữ liệu nền (Ngày 1-2)
1.1. Xác định phạm vi dữ liệu ban đầu
Tập trung vào 4 khu tái định cư trọng điểm: Mê Linh, Lĩnh Nam, Hồng Hà, Bát Tràng

Mở rộng: Các tuyến đường chính (Vành đai 4, Đại lộ sông Hồng, phố Huế...)

1.2. Tạo cấu trúc Google Sheets
Sheet 1: DanhSachQuyHoach (Tra cứu địa chỉ)

Tên cột	Kiểu dữ liệu	Ghi chú
ID	Số	Tự động
Địa chỉ chuẩn	Text	"Số 123 Đường ABC, Phường XYZ"
Địa chỉ gốc (raw)	Text	Nhập từ báo chí
Khu vực	Text	Quận/huyện
Dự án	Text	Tên chính thức
Trạng thái	Enum	"Có" / "Không" / "Đang xác minh"
Hệ số K	Số	Ví dụ: 1.2, 1.5
Giá đất (VNĐ/m2)	Số	Theo QĐ 30/2024
Nguồn tin	URL	Link bài báo
Ngày cập nhật	Date	-
Sheet 2: ThongTinDuAn (Chi tiết dự án)

Tên cột	Ghi chú
Tên dự án	Khóa chính
Chủ đầu tư	-
Tổng mức đầu tư	-
Quy mô diện tích	ha
Thời gian dự kiến	-
Mô tả	-
Link văn bản pháp lý	-
Sheet 3: TienDoTheoDuAn (Đã có, dùng lại)

1.3. Nguồn thu thập dữ liệu địa chỉ
Từ các bài báo có nội dung: "các hộ dân tại số nhà X, đường Y"

Từ thông báo của UBND phường/xã (nếu có)

Từ hội nhóm cư dân (kiểm chứng chéo)

1.4. Xây dng bảng giá đất tham khảo
Sheet 4: BangGiaDat

Khu vực	Loại đường	Đơn giá (VNĐ/m2)	Hệ số K mặc định
Hai Bà Trưng	Mặt phố chính	55.000.000	1.5
Hai Bà Trưng	Ngõ rộng >3m	25.000.000	1.5
Hai Bà Trưng	Ngõ nhỏ	15.000.000	1.5
Mê Linh	Đất ở khu dân cư	12.000.000	1.2
Mê Linh	Đất nông nghiệp	800.000	1.0
...	...	...	...
Phase 2: Xử lý logic tra cứu (Ngày 3-4)
2.1. Chiến lược đối sánh địa chỉ
Do không có polygon GIS chính xác ngay lập tức, dùng phương pháp "Danh sách trắng" cho MVP:

Cấp độ	Phương pháp	Độ chính xác	Áp dụng
1. Chính xác	Địa chỉ khớp hoàn toàn với danh sách đã nhập tay	Cao	Dùng ngay
2. Mở rộng	Khớp theo tên phường/xã (toàn bộ phường nằm trong dự án)	Trung bình	Cảnh báo "có thể ảnh hưởng"
3. Thông minh	Dùng Nominatim API để lấy tọa độ, so với polygon (sẽ làm sau)	Cao	Phase 3
2.2. Quy trình xử lý khi người dùng nhập địa chỉ
flowchart TD
    A[Nhập địa chỉ] --> B[Chuẩn hóa chuỗi]
    B --> C{Tra trong Sheet DanhSachQuyHoach}
    C -->|Tìm thấy chính xác| D[Trả về kết quả chi tiết]
    C -->|Không tìm thấy| E{So sánh tên phường/xã}
    E -->|Phường nằm trong dự án| F[Trả về cảnh báo: "Phường của bạn có thể bị ảnh hưởng"]
    E -->|Không thuộc| G[Trả về: "Chưa có thông tin"]
2.3. Chuẩn hóa địa chỉ (Normalization)
Các bước xử lý để tăng tỷ lệ match:

Loại bỏ dấu tiếng Việt

Chuyển về chữ thường

Chuẩn hóa từ viết tắt: "P." → "Phường", "Q." → "Quận"

Loại bỏ khoảng trắng thừa

Phase 3: Tích hợp thông tin liên quan (Ngày 5-6)
3.1. Dữ liệu trả về cho một địa chỉ "CÓ quy hoạch"
Thành phần	Nội dung	Nguồn dữ liệu
Thông tin cơ bản	Địa chỉ, khu vực, dự án	Sheet DanhSachQuyHoach
Trạng thái	Nằm trong diện giải tỏa / Giải tỏa một phần / Giáp ranh	Sheet DanhSachQuyHoach
Tiến độ	Các mốc quan trọng (họp dân, kiểm kê, phê duyệt...)	Sheet TienDoTheoDuAn
Đền bù	Hệ số K, đơn giá, ước tính sơ bộ	Sheet DanhSachQuyHoach + BangGiaDat
Dự án	Tên, chủ đầu tư, quy mô, thời gian	Sheet ThongTinDuAn
3.2. Thiết kế giao diện kết quả
text
┌─────────────────────────────────────────────┐
│  ✅ KẾT QUẢ TRA CỨU                          │
├─────────────────────────────────────────────┤
│  📍 165 phố Huế, phường Phố Huế, Hai Bà Trưng│
├─────────────────────────────────────────────┤
│  ⚠️ NẰM TRONG DIỆN GIẢI TỎA                 │
│  Dự án: Mở rộng mặt đường phố Huế            │
├─────────────────────────────────────────────┤
│  📊 TIẾN ĐỘ (xem chi tiết)                   │
│  • 15/05: Họp dân lấy ý kiến                 │
│  • 01/06: Dự kiến niêm yết phương án         │
├─────────────────────────────────────────────┤
│  💰 ĐỀN BÙ (ước tính)                        │
│  Đơn giá: 55.000.000 đ/m²                    │
│  Hệ số K: 1.5                                │
│  → 82.500.000 đ/m²                           │
│  Nhập diện tích → Tính tổng                  │
├─────────────────────────────────────────────┤
│  📎 Nguồn: QĐ 30/2024 | Cập nhật: 15/05/2026 │
│  ⚠️ Thông tin tham khảo, không phải quyết định│
└─────────────────────────────────────────────┘
Phase 4: Chiến lược dữ liệu dài hạn (Sau MVP)
4.1. Từ danh sách thủ công sang tự động
Giai đoạn	Phương pháp	Ưu điểm
Ngay lập tức	Nhập tay 50-100 địa chỉ từ báo chí	Có ngay dữ liệu, kiểm soát chất lượng
Tuần 2-3	Dùng AI (Gemini API) đọc bài báo, tự động trích xuất địa chỉ	Mở rộng nhanh
Tháng 2	Vẽ polygon ranh giới → tự động xác định địa chỉ trong vùng	Chính xác tuyệt đối
4.2. Tích hợp Geocoding (chuyển địa chỉ → tọa độ)
Công cụ: Nominatim API (miễn phí, không cần key)

Mục đích: Cho phép người dùng click trên bản đồ để tra cứu

Hạn chế: Giới hạn 1 request/giây, cần caching

Phase 5: Kế hoạch nhập liệu cụ thể (Ngay lập tức)
5.1. Nguồn địa chỉ từ các bài báo đã crawl
Bài báo	Địa chỉ trích xuất	Dự án
MIK Group rút lui	Các địa chỉ khu Mê Linh, Lĩnh Nam	Đại lộ sông Hồng
Vành đai 4	Các xã ven vành đai	Vành đai 4
Phố Huế	165 phố Huế (đã có)	Mở rộng phố Huế
5.2. Ưu tiên nhập địa chỉ theo thứ tự
Địa chỉ đã được xác nhận từ báo chí (có tên cụ thể)

Toàn bộ phường/xã nằm trong 4 khu tái định cư (để hiển thị cảnh báo)

Các tuyến phố chính có dự án mở đường

5.3. Danh sách phường/xã cần đưa vào cảnh báo
Quận/Huyện	Phường/xã	Dự án liên quan
Mê Linh	Mê Linh, Thiên Lộc, Vĩnh Thanh	Khu tái định cư Mê Linh
Hoàng Mai	Lĩnh Nam	Khu tái định cư Lĩnh Nam
Tây Hồ	Hồng Hà, Phú Thượng	Khu tái định cư Hồng Hà
Long Biên	Bát Tràng, Bồ Đề, Long Biên	Khu tái định cư Bát Tràng
Hoàn Kiếm	Phố Huế	Mở rộng phố Huế
✅ Checklist hoàn thành Phase 1
Tạo 4 sheet: DanhSachQuyHoach, ThongTinDuAn, TienDoTheoDuAn, BangGiaDat

Nhập ít nhất 10 địa chỉ mẫu có thông tin đầy đủ

Nhập 4 dự án (Mê Linh, Lĩnh Nam, Hồng Hà, Bát Tràng)

Nhập bảng giá đất cơ bản cho 4 khu vực

Đối chiếu tiến độ hiện có vào sheet TienDoTheoDuAn