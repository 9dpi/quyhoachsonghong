/**
 * GOOGLE APPS SCRIPT - QUY HOACH SONG HONG
 * Version: 2.2 (Automation & Trigger System)
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
 * Hàm khởi tạo Trigger - BẠN CHỈ CẦN CHẠY HÀM NÀY 1 LẦN
 */
function setupAutoTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  ScriptApp.newTrigger('startClawProcess')
      .timeBased()
      .everyHours(12)
      .create();
      
  console.log("Đã thiết lập Trigger tự động chạy mỗi 12 giờ.");
}

function startClawProcess() {
  // Logic này sẽ phối hợp với OpenClaw Agent
  console.log("Đang quét các nguồn tin: " + SOURCES.join(", "));
  // Giả lập tìm thấy tin mới
  testSaveData();
}

function saveDataFromClaw(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheets()[0];
  var logSheet = ss.getSheetByName("Logs") || ss.insertSheet("Logs");
  
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(["Thời gian", "Nguồn", "Trạng thái", "Chi tiết raw"]);
  }

  try {
    var values = dataSheet.getDataRange().getValues();
    var exists = false;
    var targetRow = -1;

    for (var i = 1; i < values.length; i++) {
      if (values[i][1] === data.tenKhu) {
        exists = true;
        targetRow = i + 1;
        break;
      }
    }

    var rowData = [
      exists ? values[targetRow-1][0] : Date.now(), 
      data.tenKhu,
      data.viDo,
      data.kinhDo,
      data.dienTich,
      data.moTa,
      data.url,
      new Date(), 
      data.loai || "Quy hoạch"
    ];

    if (exists) {
      dataSheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
      logSheet.appendRow([new Date(), data.url, "Updated", "Update: " + data.tenKhu]);
    } else {
      dataSheet.appendRow(rowData);
      logSheet.appendRow([new Date(), data.url, "Success", "New: " + data.tenKhu]);
    }
  } catch (e) {
    logSheet.appendRow([new Date(), data.url, "Error", e.toString()]);
  }
}

function testSaveData() {
  saveDataFromClaw({
    tenKhu: "Khu dân cư Thượng Cát " + Math.floor(Math.random()*100),
    viDo: 21.102,
    kinhDo: 105.755,
    dienTich: "45ha",
    moTa: "Quy hoạch khu dân cư sinh thái ven sông",
    url: "https://vneconomy.vn/ha-nooi-phe-duyet-quy-hoach.html",
    loai: "Quy hoạch"
  });
}

function initSheet(sheet) {
  var headers = ["id", "tenKhu", "viDo", "kinhDo", "dienTich", "moTa", "nguonTin", "ngayCapNhat", "loai"];
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f3f3f3");
}
