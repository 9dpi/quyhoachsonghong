Các bước triển khai Ranh giới Hành chính Hà Nội:

Bước 1: Lấy dữ liệu Hà Nội
bash
# Tải trực tiếp file GeoJSON của Hà Nội
curl -o data/hanoi-boundary.json https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/gis/01.json
File 01.json là mã số của Thành phố Hà Nội (level1_id = "01") .

Cấu trúc file trả về:

json
{
  "level1_id": "01",
  "name": "Thành phố Hà Nội",
  "coordinates": [[[...]]],  // Tọa độ ranh giới toàn thành phố
  "bbox": [102.1, 8.4, 109.5, 23.4],
  "type": "MultiPolygon",
  "level2s": [
    {
      "level2_id": "001",
      "name": "Quận Ba Đình",
      "coordinates": [[[...]]],  // Tọa độ ranh giới quận
      "bbox": [105.8, 21.0, 105.9, 21.1],
      "type": "MultiPolygon"
    }
    // ... Các quận/huyện khác của Hà Nội
  ]
}
Bước 2: Tích hợp vào Leaflet.js
Sau khi có file, viết code để hiển thị ranh giới lên bản đồ:

javascript
// Hàm hiển thị ranh giới hành chính lên bản đồ
async function loadBoundary(districtName, boundaryType = 'fill') {
    // 1. Tải file GeoJSON
    const response = await fetch('data/hanoi-boundary.json');
    const data = await response.json();
    
    // 2. Tìm quận/huyện cần hiển thị
    const district = data.level2s.find(d => d.name === districtName);
    if (!district) {
        console.error('Không tìm thấy quận/huyện:', districtName);
        return null;
    }
    
    // 3. Tạo GeoJSON layer
    const geojsonLayer = L.geoJSON(district, {
        style: {
            color: boundaryType === 'highlight' ? '#ff4444' : '#0066cc',
            weight: 2,
            fillColor: boundaryType === 'fill' ? '#0066cc' : '#ff4444',
            fillOpacity: 0.2
        },
        onEachFeature: function(feature, layer) {
            // Thêm popup hiển thị tên quận/huyện
            layer.bindPopup(`<b>${district.name}</b><br>Đang cập nhật dữ liệu quy hoạch...`);
        }
    });
    
    return geojsonLayer;
}
Bước 3: Xây dựng bộ điều khiển bản đồ
javascript
// Khởi tạo bản đồ
const map = L.map('map').setView([21.0285, 105.8542], 12);

// Thêm layer nền OpenStreetMap
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
}).addTo(map);

// Thêm danh sách quận/huyện để chọn
const districts = [
    'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Hai Bà Trưng', 
    'Quận Đống Đa', 'Quận Tây Hồ', 'Quận Long Biên', 
    'Quận Hoàng Mai', 'Quận Thanh Xuân'
];

const controlDiv = L.control({ position: 'topright' });
controlDiv.onAdd = function() {
    const div = L.DomUtil.create('div', 'district-control');
    div.innerHTML = `
        <select id="district-select">
            <option value="">-- Chọn Quận/Huyện --</option>
            ${districts.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
    `;
    return div;
};
controlDiv.addTo(map);

// Xử lý sự kiện chọn quận/huyện
document.getElementById('district-select').addEventListener('change', async (e) => {
    const districtName = e.target.value;
    if (!districtName) return;
    
    const layer = await loadBoundary(districtName, 'highlight');
    if (layer) {
        layer.addTo(map);
        map.fitBounds(layer.getBounds());  // Zoom vào vùng được chọn
    }
});
📝 Kế hoạch mở rộng sau này
Sau khi có ranh giới hành chính, bạn có thể phát triển thêm:

1. Kết hợp với dữ liệu quy hoạch từ CafeLand

Tải file PDF quy hoạch từng quận

Dùng QGIS để digitize polygon quy hoạch

Gán nhãn loại đất (đất ở, đất công cộng, đất cây xanh...)

2. Tạo lớp thông tin (layer) chuyên biệt

javascript
// Layer dành riêng cho dự án Vành đai 4
const layerVanDai4 = createProjectLayer('van-dai-4.geojson', {
    color: '#ff6600',
    weight: 3
});

// Layer dành riêng cho khu tái định cư
const layerTDC = createProjectLayer('tdc-polygons.geojson', {
    color: '#00cc66',
    weight: 2
});