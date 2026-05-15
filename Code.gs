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

var SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // Dán ID Google Sheet của bạn vào đây
var SHEET_NAME = "Database";

var RSS_SOURCES = [
  "https://tuoitre.vn/rss/ha-noi.rss",
  "https://vietnamnet.vn/rss/bat-dong-san.rss",
  "https://baochinhphu.vn/rss/quy-hoach.rss"
];

/**
 * HÀM CHÍNH: QUÉT TIN TỨC VÀ ĐẨY LÊN GITHUB
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
        
        // Lọc tin liên quan đến Sông Hồng hoặc Quy hoạch
        if (title.toLowerCase().includes("sông hồng") || title.toLowerCase().includes("quy hoạch")) {
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
  
  newItems.forEach(function(item) {
    if (!existingTitles.includes(item.tenKhu)) {
      sheet.appendRow([
        item.id, item.tenKhu, item.viDo, item.kinhDo, item.dienTich, item.moTa, item.nguonTin, item.ngayCapNhat, item.loai
      ]);
    }
  });
}

/**
 * API ĐỂ FRONTEND LẤY DỮ LIỆU TỔNG HỢP
 */
function doGet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  
  return ContentService.createTextOutput(JSON.stringify({
    news: getSheetData(ss, "Database"),
    progress: getSheetData(ss, "Progress"),
    faq: getSheetData(ss, "FAQ")
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
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
    "Tên Khu": "tenKhu", "Vĩ Độ": "viDo", "Kinh Độ": "kinhDo", "Mô Tả": "moTa", "Nguồn Tin": "nguonTin",
    "Ngày": "date", "Khu vực": "region", "Nội dung": "content",
    "Câu hỏi": "q", "Trả lời": "a"
  };
  return maps[h] || h;
}

function syncMultipleToGithub(newItems) {
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
