/**
 * GOOGLE APPS SCRIPT - QUY HOACH SONG HONG
 * Version: 2.5 (Clean Data Init)
 */

var SOURCES = [
  "https://tuoitre.vn/rss/ha-noi.rss",
  "https://vietnamnet.vn/rss/bat-dong-san.rss",
  "https://baochinhphu.vn/rss/quy-hoach.rss"
];

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  
  if (values.length < 2 || values[0][0] == "") {
    initSheet(sheet);
    values = sheet.getDataRange().getValues();
  }
  
  var headers = values[0];
  var result = [];
  for(var i = 1; i < values.length; i++) {
    var item = {};
    for(var j = 0; j < headers.length; j++) {
      item[headers[j]] = values[i][j];
    }
    result.push(item);
  }
  
  result.sort((a, b) => new Date(b.ngayCapNhat || 0) - new Date(a.ngayCapNhat || 0));
  
  return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HÀM KHỞI TẠO 100 BÀI VIẾT (MASSIVE DATA) - CLEAN VERSION
 * Chạy hàm này một lần để có dữ liệu khởi tạo chuyên nghiệp (Không có đánh số).
 */
function initMassiveData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  initSheet(sheet);
  
  var locations = [
    {n: "Mê Linh", lat: 21.18, lng: 105.71},
    {n: "Đông Anh ven sông", lat: 21.12, lng: 105.82},
    {n: "Bắc Từ Liêm", lat: 21.08, lng: 105.78},
    {n: "Tây Hồ Tây", lat: 21.06, lng: 105.81},
    {n: "Bãi giữa Sông Hồng", lat: 21.04, lng: 105.85},
    {n: "Long Biên", lat: 21.03, lng: 105.88},
    {n: "Hoàng Mai ven sông", lat: 20.98, lng: 105.87},
    {n: "Gia Lâm", lat: 20.99, lng: 105.93},
    {n: "Thanh Trì", lat: 20.95, lng: 105.91},
    {n: "Thường Tín", lat: 20.89, lng: 105.95}
  ];
  
  var dataToPush = [];
  for (var i = 1; i <= 100; i++) {
    var loc = locations[i % locations.length];
    var randomLat = loc.lat + (Math.random() - 0.5) * 0.05;
    var randomLng = loc.lng + (Math.random() - 0.5) * 0.05;
    
    // TIÊU ĐỀ SẠCH - KHÔNG CÓ ĐÁNH SỐ
    var projectTitle = "Dự án " + loc.n + " - Phân khu R" + (i % 5 + 1);
    
    dataToPush.push([
      i,
      projectTitle,
      randomLat,
      randomLng,
      (Math.floor(Math.random() * 500) + 10) + "ha",
      "Thông tin quy hoạch chi tiết về phân khu đô thị sông Hồng đoạn qua " + loc.n + ". Dự kiến triển khai năm 2026.",
      "https://kinhtedothi.vn/quy-hoach",
      new Date(Date.now() - i * 3600000), 
      i % 10 == 0 ? "Quy hoạch" : "Dự án", 
      i <= 5 ? "YES" : "NO" 
    ]);
  }
  
  sheet.getRange(2, 1, dataToPush.length, dataToPush[0].length).setValues(dataToPush);
  console.log("Đã khởi tạo thành công 100 bài viết sạch!");
}

function initSheet(sheet) {
  var headers = ["id", "tenKhu", "viDo", "kinhDo", "dienTich", "moTa", "nguonTin", "ngayCapNhat", "loai", "isHeadline"];
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f3f3f3");
}
