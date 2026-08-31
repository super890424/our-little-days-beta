const SHEET_NAME = "工作表1";
const DRIVE_FOLDER_ID = "1u4GDl35Gi3ZsbtgrFJ7GgNCn6x_z99po";

function doGet() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  const values = sheet.getDataRange().getValues();

  // 移除標題列
  values.shift();

  const timezone = Session.getScriptTimeZone();

  const meals = values
    .filter(function (row) {
      return row[0];
    })
    .map(function (row) {
      return {
        id: row[0],

        date: normalizeDate(row[1], timezone),

        time: normalizeTime(row[2], timezone),

        type: row[3],

        veggie: row[4] === true || row[4] === "TRUE",

        firstBite: row[5] === true || row[5] === "TRUE",

        points: Number(row[6]) || 0,

        photoUrl: row[7] || "",
      };
    });

  const challengeCompleted = values.some(function (row) {
    return row[8] === "COMPLETED";
  });

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      meals: meals,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function normalizeDate(value, timezone) {
  if (!value) {
    return "";
  }

  // Google Sheet 真正的日期格式
  if (value instanceof Date) {
    return Utilities.formatDate(value, timezone, "yyyy-MM-dd");
  }

  const text = String(value).trim();

  // 已經是 yyyy-mm-dd
  const standardMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

  if (standardMatch) {
    return (
      standardMatch[1] +
      "-" +
      String(standardMatch[2]).padStart(2, "0") +
      "-" +
      String(standardMatch[3]).padStart(2, "0")
    );
  }

  // 處理：
  // Mon Aug 31 2026 00:00:00 GMT+0800
  const parsedDate = new Date(text);

  if (!isNaN(parsedDate.getTime())) {
    return Utilities.formatDate(parsedDate, timezone, "yyyy-MM-dd");
  }

  return text;
}

function normalizeTime(value, timezone) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, timezone, "HH:mm");
  }

  const text = String(value);

  const match = text.match(/(\d{1,2}):(\d{2})/);

  if (match) {
    return String(match[1]).padStart(2, "0") + ":" + match[2];
  }

  return text;
}

function doPost(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  const data = JSON.parse(e.postData.contents);

  // ====================
  // 防止同一天同一餐重複
  // ====================

  const existingData = sheet.getDataRange().getValues();

  const timezone = Session.getScriptTimeZone();

  const regularMeals = ["早餐", "午餐", "晚餐"];

  let duplicate = false;

  if (regularMeals.includes(data.type)) {
    duplicate = existingData.slice(1).some(function (row) {
      if (!row[0]) {
        return false;
      }

      const existingDate = normalizeDate(row[1], timezone);

      const existingType = String(row[3]);

      return (
        String(row[0]) === String(data.id) &&
        existingDate === String(data.date) &&
        existingType === String(data.type)
      );
    });
  }

  if (duplicate) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,

        duplicate: true,

        message: `今天的「${data.type}」已經打卡過了 🥬`,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
  function completeChallenge() {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === "VEGGIE-BABY-001") {
        sheet.getRange(i + 1, 9).setValue("COMPLETED");
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ====================
  // 上傳照片
  // ====================

  let photoUrl = "";

  if (data.photo) {
    photoUrl = uploadPhoto(data.photo.base64, data.photo.fileName);
  }

  // ====================
  // 寫入 Google Sheet
  // ====================

  sheet.appendRow([
    data.id,

    data.date,

    data.time,

    data.type,

    data.veggie,

    data.firstBite,

    data.points,

    photoUrl,

    "",
  ]);

  // ====================
  // 回傳
  // ====================

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,

      photoUrl: photoUrl,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
function testAddMeal() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  sheet.appendRow([
    "VEGGIE-BABY-001",
    "2026-08-31",
    "19:00",
    "晚餐",
    true,
    true,
    3,
    "",
    "",
  ]);
}
function uploadPhoto(base64Data, fileName) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  const decoded = Utilities.base64Decode(base64Data);

  const blob = Utilities.newBlob(decoded, "image/jpeg", fileName);

  const file = folder.createFile(blob);

  // 讓網頁可以讀取照片
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 回傳可以直接顯示圖片的網址
  return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w800";
}
function testUploadPhoto() {
  // 建立一張假的測試圖片
  const base64Data =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const fileUrl = uploadPhoto(base64Data, "test-photo.png");

  console.log("照片上傳成功：", fileUrl);
}
