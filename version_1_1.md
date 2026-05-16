🗺️ 1. Tự động hóa vẽ Polygon (từ vẽ tay → GIS chuyên nghiệp)
Hiện bạn đang vẽ tay, rất mất thời gian và khó đảm bảo độ chính xác. Giải pháp:

Lộ trình chuyển đổi
text
Bản vẽ CAD/PDF (hiện tại) → QGIS (xử lý) → GeoJSON (xuất ra) → Leaflet.js (hiển thị)
Công cụ miễn phí khuyến nghị: QGIS
Đây là phần mềm GIS mã nguồn mở, có thể:

Digitize từ ảnh nền: Import ảnh chụp bản đồ quy hoạch → căn chỉnh tọa độ (georeferencing) → vẽ polygon theo ranh giới 

Xử lý topology tự động: Tự động phát hiện và sửa lỗi polygon hở, chồng lấn 

Export thẳng ra GeoJSON: Định dạng chuẩn cho Leaflet.js

Plugin hỗ trợ cho QGIS
QuickOSM: Lấy dữ liệu nền từ OpenStreetMap

Export to GeoJSON: Xuất file nhẹ cho web

Polygon tool: Công cụ vẽ chuyên dụng (hiện đang có plugin Polygon by clicking in map image nhưng đã deprecated, thay bằng công cụ digitize mặc định của QGIS) 

Quy trình chi tiết cho 4 khu TĐC
Tìm nguồn bản đồ: Lấy file ranh giới từ quyết định phê duyệt (dạng PDF hoặc ảnh)

Georeference trong QGIS: Gắn tọa độ thực (VN-2000 hoặc WGS84) vào ảnh 

Digitize: Vẽ polygon theo ranh giới từng khu

Gán thuộc tính: Thêm tên dự án, loại quy hoạch, mức độ ảnh hưởng

Xuất GeoJSON: Lưu file để đưa lên GitHub Pages

Câu hỏi để tiến hành:
Bạn đã có file bản đồ scan/PDF của 4 khu TĐC chưa? (Mê Linh, Lĩnh Nam, Hồng Hà, Bát Tràng)

Nếu chưa, mình có thể hướng dẫn tìm từ cổng thông tin quy hoạch Hà Nội.

💰 2. Bảng giá đền bù toàn Hà Nội
Dữ liệu bạn cần là Quyết định 30/2019/QĐ-UBND (áp dụng đến 31/12/2024) .

Cấu trúc sheet BangGiaDat
Theo quy định, mỗi tuyến đường/phố có 4 vị trí đất :

Tuyến đường	Quận	Vị trí 1 (tiếp giáp đường)	Vị trí 2	Vị trí 3	Vị trí 4
Lê Thái Tổ	Hoàn Kiếm	187.920.000	...	...	...
Nguyễn Văn Cừ	Long Biên	45.000.000	36.000.000	27.000.000	18.000.000
Giải thích vị trí:

Vị trí 1: Mặt tiền đường chính

Vị trí 2: Ngõ rộng > 3m, cách mặt đường < 100m

Vị trí 3: Ngõ rộng 2-3m, cách mặt đường 100-200m

Vị trí 4: Ngõ hẹp < 2m, cách mặt đường > 200m

Nguồn lấy dữ liệu
Tải bảng đầy đủ: Tìm kiếm "Quyết định 30/2019/QĐ-UBND bảng giá đất Hà Nội" → file Excel có sẵn

Hoặc copy từ: Cổng thông tin điện tử Hà Nội → mục "Giá đất"

Công thức tính đền bù khi tra cứu
text
Đền bù = Diện tích đất × Đơn giá theo vị trí + Giá trị tài sản trên đất
🔍 3. Tra cứu địa chỉ gần đúng (Fuzzy Search)
Giải pháp: Fuse.js (chạy hoàn toàn trên frontend)
Đây là thư viện tìm kiếm mờ nhẹ, phù hợp với dữ liệu của bạn (Sheet DanhSachQuyHoach có thể có ~10.000-50.000 bản ghi, hoàn toàn xử lý được trên client) .

Cài đặt nhanh
html
<!-- Thêm vào file index.html -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
Code mẫu cho trang tra cứu
javascript
// 1. Dữ liệu từ sheet DanhSachQuyHoach (fetch từ Apps Script)
const danhSach = [
  { diaChi: "5/46 Cổ Linh, Long Biên", duAn: "Vành đai 2.5", mucDo: "🟠 Một phần", lat: 21.0285, lng: 105.8542 },
  { diaChi: "12 Ngô Gia Tự, Long Biên", duAn: "Vành đai 2", mucDo: "🔴 Giải tỏa toàn bộ", lat: 21.0352, lng: 105.8621 },
  // ... thêm dữ liệu
];

// 2. Cấu hình Fuse.js
const options = {
  keys: ['diaChi'],           // Tìm kiếm trong trường địa chỉ
  threshold: 0.4,             // Độ mờ: 0 = chính xác, 1 = rất mờ
  distance: 100,              // Khoảng cách cho phép
  includeScore: true,         // Hiển thị độ tương đồng
  ignoreLocation: true        // Tìm kiếm toàn bộ chuỗi, không giới hạn vị trí
};

const fuse = new Fuse(danhSach, options);

// 3. Hàm xử lý tìm kiếm
function timKiemDiaChi(query) {
  if (query.length < 3) return [];
  
  const results = fuse.search(query);
  
  // Hiển thị kết quả theo thứ tự độ tương đồng giảm dần
  return results.map(r => ({
    ...r.item,
    doTuongDong: (1 - r.score) * 100 + '%'
  }));
}

// 4. Gắn vào input search
document.getElementById('search-input').addEventListener('input', (e) => {
  const ketQua = timKiemDiaChi(e.target.value);
  hienThiKetQua(ketQua);
});
Xử lý trường hợp "Cổ Linh, Long Biên" → hiển thị tất cả
Khi người dùng nhập thiếu số nhà, bạn có thể:

javascript
function timTheoDuong(query) {
  // Nếu query không có số nhà (chỉ có tên đường/phường)
  if (!query.match(/\d/)) {
    // Tìm tất cả bản ghi chứa tên đường đó
    return danhSach.filter(item => item.diaChi.includes(query));
  }
  // Có số nhà → tìm chính xác hơn
  return timKiemDiaChi(query);
}
UX gợi ý khi hiển thị kết quả
text
🔍 Kết quả tìm kiếm cho "Cổ Linh, Long Biên" (6 địa chỉ):

1. Số 5/46 Cổ Linh 🟠 Một phần - Vành đai 2.5
2. Số 12 Cổ Linh 🟢 An toàn - Không quy hoạch
3. Số 8/2 Cổ Linh 🔴 Giải tỏa - Vành đai 2.5
...
📋 Tóm tắt giải pháp theo 3 yêu cầu
Yêu cầu	Giải pháp	Công cụ	Độ khó
Tự động hóa vẽ polygon	Chuyển từ vẽ tay sang digitize trên QGIS	QGIS (miễn phí)	Trung bình (cần học 2-3 ngày)
Bảng giá toàn Hà Nội	Nhập từ QĐ 30/2019 (có file Excel sẵn)	Google Sheets + lookup	Dễ
Tìm gần đúng	Fuse.js trên frontend	Thư viện JS	Dễ
🚀 Các bước tiếp theo cụ thể
Tuần này (ưu tiên P0)
Cài QGIS (tải từ qgis.org)

Thu thập bản đồ ranh giới 4 khu TĐC (dạng ảnh/PDF)

Tải bảng giá đất QĐ 30/2019 (file Excel)