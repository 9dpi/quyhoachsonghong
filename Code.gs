/**
 * GOOGLE APPS SCRIPT - BUILT-IN SCRAPER & GITHUB SYNC
 * Version: 4.0 (Zero Cost & Fully Automated)
 */

var GITHUB_CONFIG = {
  token: "YOUR_GITHUB_TOKEN", 
  owner: "9dpi",
  repo: "quyhoachsonghong",
  path: "data/database.json",
  branch: "main"
};

var SHEET_ID = "1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I"; 
var SHEET_NAME = "4_Khu_Tai_Dinh_Cu";

var RSS_SOURCES = [
  "https://tuoitre.vn/rss/ha-noi.rss",
  "https://vietnamnet.vn/rss/bat-dong-san.rss",
  "https://vnexpress.net/rss/thoi-su.rss",
  "https://laodong.vn/rss/thoi-su.rss",
  "https://vietnam.vn/category/viet-nam-hom-nay/rss"
];

const QUY_HOACH_KEYWORDS = [
  // Nhóm Vành đai
  "Vành đai 1", "Vành đai 2", "Vành đai 2.5", "Vành đai 3", "Vành đai 3.5",
  "Vành đai 4", "Vành đai 4.5", "Vành đai 5", "Ring Road",
  
  // Nhóm cầu sông Hồng
  "cầu Tứ Liên", "cầu Trần Hưng Đạo", "cầu Ngọc Hồi", "cầu Mễ Sở", "cầu Hồng Hà",
  "hầm sông Hồng", "cầu Chương Dương", "cầu vượt sông Hồng",
  
  // Nhóm Quốc lộ
  "Quốc lộ 1A", "Quốc lộ 6", "Quốc lộ 21B", "Quốc lộ 32",
  "Đại lộ Thăng Long", "đường Tây Thăng Long", "Hà Đông Xuân Mai",
  
  // Nhóm dự án đặc biệt
  "sân bay thứ hai", "bến xe liên tỉnh", "di dời bến xe",
  "APEC 2027", "thoát nước Hà Nội", "chống ngập",
  
  // Các tag đã có
  "Sông Hồng", "Quy hoạch", "giải phóng mặt bằng", "tái định cư", "GPMB"
];

/**
 * CÀI ĐẶT TRIGGER TỰ ĐỘNG (Chạy 1 lần duy nhất)
 */
function setupDailyTriggers() {
  // Xóa các trigger cũ để tránh trùng lặp
  var allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  // Trigger 9h sáng
  ScriptApp.newTrigger('runBuiltInScraper')
    .timeBased().atHour(9).everyDays(1).inTimezone("Asia/Ho_Chi_Minh").create();
    
  // Trigger 16h chiều
  ScriptApp.newTrigger('runBuiltInScraper')
    .timeBased().atHour(16).everyDays(1).inTimezone("Asia/Ho_Chi_Minh").create();
    
  console.log("Đã thiết lập 2 trigger tự động (9h & 16h).");
}

/**
 * HÀM CHÍNH: QUÉT TIN TỨC VÀ ĐẨY VÀO SHEET & GITHUB
 * Hướng dẫn: Chọn hàm này và nhấn "Run" để kiểm tra, hoặc cài Trigger định kỳ.
 */
function runBuiltInScraper() {
  var allNewData = [];
  
  RSS_SOURCES.forEach(function(url) {
    try {
      var xml = UrlFetchApp.fetch(url).getContentText();
      var document = XmlService.parse(xml);
      var items = document.getRootElement().getChild('channel').getChildren('item');
      
      items.forEach(function(item) {
        var title = item.getChild('title').getText();
        var link = item.getChild('link').getText();
        var description = item.getChild('description').getText();
        
        // Sử dụng logic lọc tin mở rộng
        if (isRelatedToQuyHoach(title, description)) {
          allNewData.push({
            "id": Date.now() + Math.floor(Math.random()*1000),
            "tenKhu": title,
            "viDo": 21.0285 + (Math.random() - 0.5) * 0.1, // Ngẫu nhiên quanh trung tâm HN
            "kinhDo": 105.8542 + (Math.random() - 0.5) * 0.1,
            "dienTich": "Xem chi tiết trong nguồn tin",
            "moTa": description.replace(/<[^>]*>?/gm, '').trim(), 
            "nguonTin": link,
            "ngayCapNhat": new Date().toISOString(),
            "loai": "Tin tức",
            "isHeadline": "NO"
          });
        }
      });
    } catch (e) {
      console.log("Lỗi nguồn " + url + ": " + e.toString());
    }
  });

  if (allNewData.length > 0) {
    saveToSheet(allNewData);
    syncMultipleToGithub(allNewData); // Vẫn giữ đồng bộ GitHub để làm dự phòng
  } else {
    console.log("Không tìm thấy tin mới trong lần quét này.");
  }
}

/**
 * LƯU DỮ LIỆU VÀO GOOGLE SHEET
 */
function saveToSheet(newItems) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  
  // Tạo header nếu sheet trống
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(["ID", "Tên Khu", "Vĩ Độ", "Kinh Độ", "Diện Tích", "Mô Tả", "Nguồn Tin", "Ngày Cập Nhật", "Loại"]);
  }
  
  var existingTitles = sheet.getRange(2, 2, sheet.getLastRow() > 1 ? sheet.getLastRow() - 1 : 1).getValues().flat();
  
  var addedCount = 0;
  newItems.forEach(function(item) {
    if (!existingTitles.includes(item.tenKhu)) {
      sheet.appendRow([
        item.id, item.tenKhu, item.viDo, item.kinhDo, item.dienTich, item.moTa, item.nguonTin, item.ngayCapNhat, item.loai
      ]);
      addedCount++;
    }
  });
  if (addedCount > 0) {
    console.log("Đã thêm mới " + addedCount + " tin tức vào Google Sheet.");
  } else {
    console.log("Không có tin tức mới (Trùng lặp hoặc không tìm thấy).");
  }
}

/**
 * API ĐỂ FRONTEND LẤY DỮ LIỆU TỔNG HỢP
 */
function doGet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  
  return ContentService.createTextOutput(JSON.stringify({
    news: getSheetData(ss, "4_Khu_Tai_Dinh_Cu"),
    progress: getSheetData(ss, "Progress"),
    faq: getSheetData(ss, "FAQ")
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, name) {
  // Tìm sheet không phân biệt hoa thường và trim khoảng trắng
  var sheets = ss.getSheets();
  var sheet = sheets.find(s => s.getName().trim().toLowerCase() === name.trim().toLowerCase());
  
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // Chỉ có header hoặc trống
  
  var headers = data.shift().map(h => h.toString().trim());
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var key = mapKey(h);
      obj[key] = row[i];
    });
    return obj;
  });
}

function mapKey(h) {
  var maps = {
    "Tên Khu": "tenKhu", "Vĩ Độ": "viDo", "Kinh Độ": "kinhDo", "Mô Tả": "moTa", "Nguồn Tin": "nguonTin", "Loại": "loai",
    "Ngày": "date", "Khu vực": "region", "Nội dung": "content",
    "Câu hỏi": "q", "Trả lời": "a"
  };
  return maps[h] || h;
}

function syncMultipleToGithub(newItems) {
  if (!GITHUB_CONFIG.token || GITHUB_CONFIG.token === "YOUR_GITHUB_TOKEN") {
    console.log("Bỏ qua đồng bộ GitHub vì chưa cấu hình Token.");
    return;
  }
  var fileData = getFileFromGithub();
  var db = [];
  var sha = "";

  if (fileData) {
    db = JSON.parse(Utilities.newBlob(Utilities.base64Decode(fileData.content)).getDataAsString());
    sha = fileData.sha;
  }

  var updatedCount = 0;
  newItems.forEach(function(newItem) {
    // Chống trùng lặp dựa trên tiêu đề bài báo
    var exists = db.find(item => item.tenKhu === newItem.tenKhu);
    if (!exists) {
      db.unshift(newItem);
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    if (db.length > 1000) db = db.slice(0, 1000); // Giới hạn 1000 bài
    updateFileToGithub(JSON.stringify(db, null, 2), sha);
    console.log("Đã cập nhật thành công " + updatedCount + " tin mới lên GitHub!");
  }
}

function getFileFromGithub() {
  var url = "https://api.github.com/repos/" + GITHUB_CONFIG.owner + "/" + GITHUB_CONFIG.repo + "/contents/" + GITHUB_CONFIG.path;
  var options = {
    "headers": { "Authorization": "token " + GITHUB_CONFIG.token, "Accept": "application/vnd.github.v3+json" },
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  return response.getResponseCode() == 200 ? JSON.parse(response.getContentText()) : null;
}

function updateFileToGithub(content, sha) {
  var url = "https://api.github.com/repos/" + GITHUB_CONFIG.owner + "/" + GITHUB_CONFIG.repo + "/contents/" + GITHUB_CONFIG.path;
  var payload = {
    "message": "Auto-sync news from Built-in Scraper",
    "content": Utilities.base64Encode(Utilities.newBlob(content, "application/json").getBytes()),
    "branch": GITHUB_CONFIG.branch
  };
  if (sha) payload.sha = sha;
  var options = {
    "method": "put",
    "headers": { "Authorization": "token " + GITHUB_CONFIG.token, "Accept": "application/vnd.github.v3+json" },
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

/**
 * IMPORT DỮ LIỆU FAQ TỪ FILE QA.json TRÊN GITHUB VÀO SHEET
 * Chọn hàm này và nhấn "Run" để cập nhật bộ câu hỏi mới nhất.
 */
function importFAQFromGithub() {
  var url = "https://raw.githubusercontent.com/" + GITHUB_CONFIG.owner + "/" + GITHUB_CONFIG.repo + "/" + GITHUB_CONFIG.branch + "/data/QA.json";
  try {
    var content = UrlFetchApp.fetch(url).getContentText();
    var lines = content.split('\n');
    var faqData = [];
    var currentQ = "";
    var currentA = "";
    
    lines.forEach(function(line) {
      line = line.trim();
      if (!line) return;
      
      // Nhận diện câu hỏi (bắt đầu bằng số. )
      if (/^\d+\./.test(line)) {
        if (currentQ) faqData.push([currentQ, currentA.trim()]);
        currentQ = line.replace(/^\d+\.\s*/, "");
        currentA = "";
      } else if (line.startsWith("Trả lời:")) {
        // Bắt đầu phần trả lời
      } else if (line.startsWith("Nguồn:")) {
        currentA += "\n(Nguồn: ";
      } else if (currentQ) {
        currentA += (currentA.includes("(Nguồn:") ? line + ")" : line + " ");
      }
    });
    
    // Thêm câu cuối cùng
    if (currentQ) faqData.push([currentQ, currentA.trim()]);
    
    if (faqData.length > 0) {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName("FAQ") || ss.insertSheet("FAQ");
      sheet.clear();
      sheet.appendRow(["Câu hỏi", "Trả lời"]);
      sheet.getRange(2, 1, faqData.length, 2).setValues(faqData);
      console.log("Đã import thành công " + faqData.length + " câu hỏi vào tab FAQ.");
    }
  } catch (e) {
    console.log("Lỗi import FAQ: " + e.toString());
  }
}

/**
 * KIỂM TRA TIN TỨC CÓ LIÊN QUAN ĐẾN QUY HOẠCH KHÔNG
 */
function isRelatedToQuyHoach(title, description) {
  const text = (title + " " + description).toLowerCase();
  return QUY_HOACH_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
}
