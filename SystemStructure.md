SystemStructure.md tổng hợp đầy đủ, chi tiết mọi khía cạnh của dự án "Bản đồ Quy hoạch Sông Hồng" của bạn, từ kiến trúc tổng thể, dữ liệu, luồng hoạt động, tự động hóa cho đến roadmap. Bạn có thể copy toàn bộ nội dung này và lưu thành một file Markdown duy nhất trong thư mục gốc của GitHub repository (quyhoachsonghong).

markdown
# SystemStructure.md - DNA Dự Án Bản Đồ Quy Hoạch Sông Hồng

## 1. Tổng quan & Mục tiêu

Dự án xây dựng **bản đồ tương tác trực tuyến** về các dự án quy hoạch, giải phóng mặt bằng ven sông Hồng (Hà Nội) nhằm:

- Cung cấp thông tin minh bạch, dễ hiểu cho người dân trong diện di dời.
- Tạo công cụ tra cứu nhanh "Nhà tôi có nằm trong quy hoạch?".
- Tự động cập nhật tin tức từ các nguồn chính thống 2 lần/ngày.
- Đóng gói dữ liệu để bổ sung vào OpenStreetMap (OSM), phục vụ cộng đồng.

Công nghệ lõi: **Serverless, chi phí thấp, dễ bảo trì, AI-First** (sử dụng OpenClaw Agent).

---

## 2. Kiến trúc tổng thể (3 thành phần cốt lõi)

```mermaid
flowchart LR
    A[GitHub Repo<br>Giao diện & Bản đồ] -->|fetch JSON| B[Google Apps Script<br>API Layer]
    B -->|Đọc dữ liệu| C[Google Sheet<br>Database]
    B -->|Trả về JSON| A
    
    D[OpenClaw Agent<br>Cron 9h & 16h] -->|Thu thập, xử lý| E[Nguồn tin chính thống]
    D -->|Cập nhật| C
    D -->|Đóng gói| F[OSM / GitHub Data Repo]
Thành phần	Vai trò	Công nghệ
GitHub Repo	Frontend - Hiển thị bản đồ, giao diện người dùng	HTML, JavaScript, Leaflet.js, GitHub Pages
Google Apps Script	API Layer - Nhận request, đọc Sheet, trả JSON	Google Apps Script (doGet)
Google Sheet	Database - Lưu trữ toàn bộ dữ liệu quy hoạch	Google Sheets (cấu trúc linh hoạt)
OpenClaw Agent	Tự động cập nhật dữ liệu 2 lần/ngày	OpenClaw, Cron, NLP, AI Model
3. Chi tiết từng thành phần
3.1. GitHub Repository
URL: https://github.com/9dpi/quyhoachsonghong

File chính: index.html

Chức năng:

Tải thư viện Leaflet.js để hiển thị bản đồ OpenStreetMap (OSM)

Gửi fetch() request đến URL của Google Apps Script

Nhận dữ liệu JSON, vẽ các marker/polygon lên bản đồ

Hiển thị popup thông tin khi click vào từng điểm (tên dự án, diện tích, mô tả, nguồn tin...)

Hosting: GitHub Pages (branch main, thư mục gốc)

Domain (tương lai): Trỏ CNAME về 9dpi.github.io

3.2. Google Apps Script (API Layer)
URL Web App: https://script.google.com/macros/s/AKfycbxx6eSTIaCJwrtwQYh7rBruih2QWUiA34LDsi1hfjqeIVvIcPRFl-dtHMdAwwwwrCLe9A/exec

Code gốc (tự động thích ứng mọi cấu trúc dữ liệu):

javascript
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  if(values.length < 2) return ContentService.createTextOutput(JSON.stringify([]));
  
  var headers = values[0];
  var result = [];
  
  for(var i = 1; i < values.length; i++) {
    var row = values[i];
    var item = {};
    for(var j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    result.push(item);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}
Quyền truy cập: "Anyone" (để GitHub có thể gọi được)

3.3. Google Sheets (Database)
Sheet ID: 1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I

Cấu trúc dữ liệu: Tuyệt đối linh hoạt – Không code cứng tên cột.

Cách tổ chức:

Hàng đầu tiên là tên cột (ví dụ: id, tenKhu, kinhDo, viDo, dienTich, moTa, nguonTin, ngayCapNhat).

Các hàng tiếp theo là dữ liệu của từng khu vực quy hoạch.

Bạn có thể thêm/bớt cột bất kỳ lúc nào mà không cần sửa code.

Dữ liệu hiện tại: 4 khu tái định cư của dự án Đại lộ cảnh quan sông Hồng (Mê Linh, Lĩnh Nam, Hồng Hà, Bát Tràng).

3.4. OpenClaw Agent (Tự động cập nhật)
3.4.1. Cấu hình Cron Job
json
// OpenClaw Configuration (configs/openclaw.json)
{
  "cron": {
    "jobs": [
      {
        "name": "quy-hoach-song-hong-sang",
        "schedule": "0 9 * * *",
        "timezone": "Asia/Ho_Chi_Minh",
        "task": "Thu thập tin tức quy hoạch sông Hồng trong 12h qua, trích xuất thông tin (tên dự án, diện tích, vị trí, tình trạng). Cập nhật vào Google Sheets. Đóng gói dữ liệu mới thành định dạng GeoJSON để bổ sung OSM.",
        "model": "anthropic/claude-sonnet-4"
      },
      {
        "name": "quy-hoach-song-hong-chieu",
        "schedule": "0 16 * * *",
        "timezone": "Asia/Ho_Chi_Minh",
        "task": "Rà soát các văn bản pháp lý, báo cáo tiến độ dự án sông Hồng. Cập nhật trạng thái và thông tin bồi thường vào Google Sheets. Kiểm tra và hợp nhất dữ liệu chờ bổ sung lên OSM.",
        "model": "anthropic/claude-sonnet-4"
      }
    ]
  }
}
3.4.2. Nguồn dữ liệu đầu vào (cần theo dõi)
Tuổi Trẻ, VietnamNet, Dân Việt, Nhân Dân (các bài viết có tag "quy hoạch Hà Nội", "sông Hồng").

Cổng thông tin điện tử của Sở Quy hoạch – Kiến trúc Hà Nội.

Báo cáo tiến độ từ UBND các quận/huyện: Tây Hồ, Long Biên, Bắc Từ Liêm, Đông Anh, Mê Linh, Hoàng Mai.

3.4.3. Quy trình xử lý dữ liệu của Agent
Kích hoạt: Vào 9h và 16h, OpenClaw tự động chạy.

Thu thập (Scrape): AI Agent truy cập danh sách RSS, website, tìm kiếm bài viết mới trong khung giờ.

Trích xuất (Parse): Sử dụng NLP để đọc, xác định:

Đây có phải tin về quy hoạch sông Hồng không?

Dự án/khu vực nào? (Mê Linh, Linh Nam, Hồng Hà, Bát Tràng...)

Thông tin số: diện tích, quy mô dân số, vốn đầu tư.

Trạng thái: Đề xuất/Phê duyệt/Đang giải phóng/Đã hoàn thành.

Ghi vào Google Sheet: Dùng OpenClaw Skills (gog hoặc Google Sheets API) để append hàng mới hoặc cập nhật hàng cũ (dựa trên cột id hoặc tenKhu).

Đóng gói dữ liệu OSM: Tự động tạo file .geojson hoặc .osc chứa các điểm (nodes) mới được khẳng định bởi nguồn chính thống, kèm theo source=TuoiTre và ref link bài báo.

Lưu trữ & Chờ kiểm duyệt: Commit dữ liệu đã xử lý vào GitHub repository phụ (ví dụ: quyhoachsonghong-data), tạo pull request để bạn (hoặc cộng đồng OSM) review trước khi import lên OSM chính thức.

4. Luồng dữ liệu tổng thể
Người dùng truy cập → https://9dpi.github.io/quyhoachsonghong

Trình duyệt tải index.html → Khởi tạo bản đồ Leaflet với nền OSM.

JavaScript gửi fetch() → Đến URL của Google Apps Script.

Apps Script nhận request → Chạy doGet().

Apps Script đọc Google Sheet → Lấy toàn bộ dữ liệu, chuyển thành JSON.

Apps Script trả JSON về trình duyệt.

JavaScript vẽ các điểm lên bản đồ (dựa theo tọa độ kinhDo, viDo trong JSON). Khi click vào điểm, popup hiển thị các thông tin từ JSON (tên, diện tích, mô tả, nguồn tin...).

Song song, vào 9h và 16h: OpenClaw Agent tự động thu thập tin tức mới, cập nhật vào Google Sheet, và đóng gói dữ liệu cho OSM.

5. Quy trình vận hành & cập nhật
Bạn muốn...	Làm gì?	Cần sửa code?
Thêm khu quy hoạch mới	Thêm hàng mới vào Google Sheet	Không
Sửa tên, diện tích, mô tả	Sửa trực tiếp trong ô của Sheet	Không
Thêm thông tin mới (cột)	Thêm cột mới vào Sheet, điền dữ liệu	Không (JSON tự động có trường mới)
Đổi màu marker/popup	Sửa JavaScript trong index.html	Có
Thay đổi bố cục trang web	Sửa HTML/CSS trong index.html	Có
Thêm tính năng mới (tìm kiếm, lọc)	Viết thêm JavaScript trong index.html	Có
Cập nhật dữ liệu tự động	Agent tự làm lúc 9h & 16h	Không (cần đảm bảo OpenClaw chạy liên tục)
Bổ sung dữ liệu lên OSM	Dùng file .geojson đã đóng gói, kiểm tra và import qua JOSM hoặc OSM Web Editor	Không (nhưng cần kiểm thủ công)
6. Ghi nhận nguồn dữ liệu & bản quyền
Bản đồ nền:

Dữ liệu bản đồ © OpenStreetMap contributors.

Thư viện bản đồ: Leaflet.js (BSD 2-Clause License).

Dữ liệu quy hoạch:

Tổng hợp tự động từ các nguồn báo chí chính thống: Tuổi Trẻ, VietnamNet, Dân Việt, Nhân Dân, và các cổng thông tin chính phủ.

Cập nhật theo Nghị quyết HĐND Hà Nội ngày 11/5/2026 và các văn bản pháp lý liên quan.

Mỗi điểm dữ liệu trên bản đồ đều kèm theo nguồn tin gốc (link bài báo) trong popup.

Mã nguồn:

Dự án mã nguồn mở, theo giấy phép MIT License.

7. Roadmap phát triển
MVP (Hiện tại – Hoàn thành ngày 15/05):

Hiển thị 4 điểm khu tái định cư trên bản đồ OSM.

Kết nối GitHub + Google Sheets + Apps Script.

Xây dựng file SystemStructure.md (DNA dự án).

Thiết lập OpenClaw với lịch 9h và 16h.

Version 1.1 (Trong 7 ngày tới):

Thêm tính năng tra cứu "Nhà tôi có trong quy hoạch?" (dùng Google Sheet thứ hai làm bảng tra).

Tạo giao diện popup đẹp hơn, hiển thị ảnh minh họa (nếu có).

Tự động đóng gói dữ liệu GeoJSON thành công.

Version 1.2 (Trong 14 ngày tới):

Vẽ các vùng polygon (ranh giới) thay vì chỉ điểm marker.

Tích hợp tìm kiếm địa chỉ (dùng Nominatim của OSM).

Version 2.0 (Trong 30 ngày tới):

Cho phép người dùng tự báo cáo thông tin (qua form Zalo mini app).

Tích hợp AI chatbot trả lời tự động về quyền lợi bồi thường.

Version 3.0 (Q3/2026):

Mở rộng toàn bộ dự án 11.418 ha ven sông Hồng (theo Nghị quyết 258).

Đồng bộ dữ liệu hai chiều với OpenStreetMap chính thức.