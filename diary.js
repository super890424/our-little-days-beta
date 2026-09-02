// ==========================================================
// 💌 Our Little Days｜交換日記
//
// 共用網站登入版
//
// 登入由 index.html 統一處理
// Diary 不再有自己的登入畫面
//
// 功能：
// 1. 使用 index.html 的共用 Token
// 2. 日記讀取需要 Token
// 3. 日記新增需要 Token
// 4. 表情 / 回覆需要 Token
// 5. 私人 Drive 照片透過 API 讀取
// 6. 照片壓縮：1000 × 1000 / JPEG 70%
// 7. POST 保留 no-cors + text/plain
//    不使用 keepalive
// ==========================================================

// ==========================================================
// 🔗 Apps Script API
// ==========================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

// ==========================================================
// 🔐 共用登入 Token
//
// ⚠️ 這裡和 index.html / script.js 使用同一個 Token
// ==========================================================

const TOKEN_KEY = "veggie-baby-token";

let diaryAuthToken = sessionStorage.getItem(TOKEN_KEY) || "";

// ==========================================================
// 👤 身份
// ==========================================================

const DIARY_AUTHOR_KEY = "veggie-baby-diary-author";

const DIARY_AUTHORS = {
  BIG: {
    icon: "🐕",
    name: "大朋友",
  },

  SMALL: {
    icon: "💃",
    name: "小朋友",
  },
};

let currentDiaryAuthor = localStorage.getItem(DIARY_AUTHOR_KEY) || "SMALL";

// ==========================================================
// 📖 日記資料
// ==========================================================

let currentDiaryDate = null;

let diaryCurrentDate = new Date();

let diaryDates = [];

let currentDiaries = [];

let currentReactions = [];

let currentReplies = [];

let selectedDiaryMood = "";

let selectedDiaryPhoto = null;

let isDiarySubmitting = false;

// ==========================================================
// ✨ 里程碑
// ==========================================================

const DIARY_MILESTONES = [
  {
    count: 1,
    icon: "🌱",
    title: "第一頁",
    text: "我們開始一起寫下日子了 ❤️",
  },

  {
    count: 3,
    icon: "🌿",
    title: "三頁日常",
    text: "原來幸福可以很簡單，就是每天有你。",
  },

  {
    count: 5,
    icon: "🌷",
    title: "五個小日子",
    text: "我們已經偷偷收藏了五個小日子 💌",
  },

  {
    count: 10,
    icon: "🌸",
    title: "十頁的小宇宙",
    text: "十篇日記，十個只有我們知道的故事。",
  },

  {
    count: 20,
    icon: "🍀",
    title: "二十個故事",
    text: "一篇一篇，慢慢變成了屬於我們的日常。",
  },

  {
    count: 30,
    icon: "🌼",
    title: "三十頁",
    text: "三十篇日記，原來我們已經留下這麼多了。",
  },

  {
    count: 50,
    icon: "🫶",
    title: "五十頁",
    text: "五十次「今天也想跟你說愛你」。",
  },

  {
    count: 75,
    icon: "💐",
    title: "回憶花園",
    text: "我們開始擁有一座只屬於我們的回憶花園了。",
  },

  {
    count: 100,
    icon: "💕",
    title: "一百頁",
    text: "一百篇日記，都是我們一起生活過的證明。",
  },

  {
    count: 150,
    icon: "🏡",
    title: "小小的家",
    text: "這裡已經不只是一個日記本了，是我們的小家。",
  },

  {
    count: 200,
    icon: "🥂",
    title: "兩百篇",
    text: "兩百個故事，敬我們那些平凡又珍貴的日子。",
  },

  {
    count: 250,
    icon: "🌙",
    title: "收藏成冊",
    text: "那些看似平凡的日子，也都變成了值得收藏的故事。",
  },

  {
    count: 300,
    icon: "📖",
    title: "三百頁",
    text: "三百篇日記，已經足夠寫成一本只屬於我們的書。",
  },

  {
    count: 400,
    icon: "🎞️",
    title: "我們的長篇故事",
    text: "故事越寫越長，而我還是很期待下一頁。",
  },

  {
    count: 500,
    icon: "🌎",
    title: "五百個故事",
    text: "如果生活是一場旅行，我們已經一起走了好遠。",
  },

  {
    count: 666,
    icon: "🍀",
    title: "六六大順",
    text: "連宇宙都在偷偷祝我們順順利利。",
  },

  {
    count: 777,
    icon: "✨",
    title: "幸運數字",
    text: "777篇，好像連幸運都站在我們這邊。",
  },

  {
    count: 888,
    icon: "💫",
    title: "長長久久",
    text: "888篇，願我們的故事也一直一直延續下去。",
  },

  {
    count: 1000,
    icon: "♾️",
    title: "千頁之約",
    text: "一千篇了。可是我還是想知道，每天的你過得怎麼樣。",
  },
];

let diaryTotalCount = 0;

// ==========================================================
// 🚀 初始化
// ==========================================================

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem(TOKEN_KEY);

  // --------------------------------------------------
  // 沒登入
  // → 回首頁
  // --------------------------------------------------

  if (!token) {
    window.location.replace("index.html");

    return;
  }

  // --------------------------------------------------
  // 有登入
  // --------------------------------------------------

  diaryAuthToken = token;

  const logoutButton = document.getElementById("logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      sessionStorage.removeItem(TOKEN_KEY);
      window.location.replace("index.html");
    });
  }

  await startDiaryApp();
});

// ==========================================================
// 🔐 Token
// ==========================================================

function getDiaryToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function setDiaryToken(token) {
  diaryAuthToken = String(token || "");

  if (diaryAuthToken) {
    sessionStorage.setItem(TOKEN_KEY, diaryAuthToken);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

// ==========================================================
// 🚀 啟動日記 App
// ==========================================================

async function startDiaryApp() {
  bindIdentityEvents();

  bindDiaryFormEvents();

  bindCalendarEvents();

  updateIdentityUI();

  renderCalendar();

  // --------------------------------------------------
  // 只先載入日期索引
  // 不一次載入所有日記
  // --------------------------------------------------

  const success = await loadDiaryIndex();

  if (!success) {
    return;
  }

  // --------------------------------------------------
  // 如果今天有日記，就顯示今天
  // --------------------------------------------------

  const today = formatDate(new Date());

  if (diaryDates.includes(today)) {
    await showDiaryForDate(today);
  }
}

// ==========================================================
// 👤 身份
// ==========================================================

function bindIdentityEvents() {
  document.querySelectorAll(".identity-button").forEach(function (button) {
    button.addEventListener("click", function () {
      const author = button.dataset.author;

      if (!DIARY_AUTHORS[author]) {
        return;
      }

      currentDiaryAuthor = author;

      localStorage.setItem(DIARY_AUTHOR_KEY, author);

      updateIdentityUI();

      if (currentDiaryDate) {
        renderSelectedDiaryDate();
      }
    });
  });
}

// ==========================================================
// 👤 更新身份 UI
// ==========================================================

function updateIdentityUI() {
  document.querySelectorAll(".identity-button").forEach(function (button) {
    button.classList.toggle(
      "active",
      button.dataset.author === currentDiaryAuthor,
    );
  });

  const author = DIARY_AUTHORS[currentDiaryAuthor] || DIARY_AUTHORS.SMALL;

  const currentAuthor = document.getElementById("current-diary-author");

  if (currentAuthor) {
    currentAuthor.textContent = `${author.icon} ${author.name}`;
  }
}

// ==========================================================
// ✍️ 表單
// ==========================================================

function bindDiaryFormEvents() {
  const photoInput = document.getElementById("diary-photo");

  if (photoInput) {
    photoInput.addEventListener("change", handleDiaryPhoto);
  }

  document.querySelectorAll(".diary-mood-button").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".diary-mood-button").forEach(function (item) {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedDiaryMood = button.dataset.mood || "";
    });
  });

  const saveButton = document.getElementById("save-diary-button");

  if (saveButton) {
    saveButton.addEventListener("click", submitDiary);
  }
}

// ==========================================================
// 📷 選擇照片
// ==========================================================

function handleDiaryPhoto(event) {
  const file = event.target.files[0];

  if (!file) {
    selectedDiaryPhoto = null;

    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("請選擇圖片檔案");

    event.target.value = "";

    selectedDiaryPhoto = null;

    return;
  }

  selectedDiaryPhoto = file;

  const preview = document.getElementById("diary-photo-preview");

  if (!preview) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    preview.innerHTML = `

        <div class="photo-content">

          <img
            src="${e.target.result}"
            alt="照片預覽"
            style="
              max-width:100%;
              max-height:320px;
              object-fit:contain;
              border-radius:12px;
            "
          >

          <small>
            已選擇照片 ❤️
          </small>

        </div>

      `;
  };

  reader.readAsDataURL(file);
}

// ==========================================================
// 📷 新增日記
// ==========================================================

async function submitDiary() {
  if (isDiarySubmitting) {
    return;
  }

  const input = document.getElementById("diary-input");

  const button = document.getElementById("save-diary-button");

  const message = document.getElementById("diary-message");

  if (!input) {
    return;
  }

  const content = input.value.trim();

  if (!content) {
    alert("寫一點生活紀錄吧 ❤️");

    return;
  }

  isDiarySubmitting = true;

  if (button) {
    button.disabled = true;

    button.textContent = "正在留下日記 ☁️";
  }

  try {
    let photo = null;

    // --------------------------------------------------
    // 📷 照片處理
    // --------------------------------------------------

    if (selectedDiaryPhoto) {
      if (button) {
        button.textContent = "照片處理中 📷";
      }

      const base64 = await fileToBase64(selectedDiaryPhoto);

      photo = {
        base64: base64,

        fileName: `diary_${Date.now()}.jpg`,
      };
    }

    const date = formatDate(new Date());

    // --------------------------------------------------
    // 取得送出前篇數
    // --------------------------------------------------

    // --------------------------------------------------
    // 送出
    // --------------------------------------------------

    await postJSON({
      action: "addDiary",

      author: currentDiaryAuthor,

      date: date,

      content: content,

      mood: selectedDiaryMood,

      photo: photo,
    });

    // --------------------------------------------------
    // 清空
    // --------------------------------------------------

    input.value = "";

    selectedDiaryPhoto = null;

    selectedDiaryMood = "";

    const photoInput = document.getElementById("diary-photo");

    if (photoInput) {
      photoInput.value = "";
    }

    resetMoodButtons();

    resetDiaryPhotoPreview();

    if (message) {
      message.textContent = "日記已送出 ❤️";
    }

    // --------------------------------------------------
    // 更新資料
    // --------------------------------------------------

    try {
      await loadDiaryIndex();

      await showDiaryForDate(date);
    } catch (refreshError) {
      console.error("日記已送出，但畫面更新失敗：", refreshError);

      if (message) {
        message.textContent = "日記已送出 ❤️";
      }
    }
  } catch (error) {
    console.error("日記送出失敗：", error);

    if (message) {
      message.textContent = "日記送出失敗，請再試一次 😢";
    }
  } finally {
    isDiarySubmitting = false;

    if (button) {
      button.disabled = false;

      button.textContent = "留下這篇日記 💌";
    }
  }
}

// ==========================================================
// 📅 日期索引
// ==========================================================

async function loadDiaryIndex() {
  try {
    const data = await getJSON("diaryIndex");

    diaryDates = Array.isArray(data.diaryDates) ? data.diaryDates : [];

    diaryTotalCount = Number(data.total) || 0;

    renderCalendar();

    return true;
  } catch (error) {
    console.error("日記日期讀取失敗", error);

    // Token 過期
    if (
      error.message === "TOKEN_EXPIRED" ||
      error.message === "LOGIN_REQUIRED"
    ) {
      setDiaryToken("");

      window.location.replace("index.html");

      return false;
    }

    diaryDates = [];

    diaryTotalCount = 0;

    renderCalendar();

    return false;
  }
}

// ==========================================================
// 📅 日曆事件
// ==========================================================

function bindCalendarEvents() {
  const prev = document.getElementById("diary-prev-month");

  const next = document.getElementById("diary-next-month");

  if (prev) {
    prev.addEventListener("click", function () {
      diaryCurrentDate = new Date(
        diaryCurrentDate.getFullYear(),
        diaryCurrentDate.getMonth() - 1,
        1,
      );

      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      diaryCurrentDate = new Date(
        diaryCurrentDate.getFullYear(),
        diaryCurrentDate.getMonth() + 1,
        1,
      );

      renderCalendar();
    });
  }
}

// ==========================================================
// 📅 Render 日曆
// ==========================================================

function renderCalendar() {
  const calendar = document.getElementById("diary-calendar");

  const title = document.getElementById("diary-calendar-title");

  if (!calendar) {
    return;
  }

  const year = diaryCurrentDate.getFullYear();

  const month = diaryCurrentDate.getMonth();

  if (title) {
    title.textContent = `${year} 年 ${month + 1} 月`;
  }

  calendar.innerHTML = "";

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  weekdays.forEach(function (day) {
    const element = document.createElement("div");

    element.className = "diary-calendar-weekday";

    element.textContent = day;

    calendar.appendChild(element);
  });

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");

    blank.className = "diary-calendar-day other-month";

    calendar.appendChild(blank);
  }

  const today = formatDate(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;

    const button = document.createElement("button");

    button.type = "button";

    button.className = "diary-calendar-day";

    button.textContent = day;

    if (date === today) {
      button.classList.add("today");
    }

    if (diaryDates.includes(date)) {
      button.classList.add("has-diary");
    }

    button.addEventListener("click", function () {
      showDiaryForDate(date);
    });

    calendar.appendChild(button);
  }
}

// ==========================================================
// 📖 取得指定日期
// ==========================================================

async function showDiaryForDate(date) {
  const history = document.getElementById("diary-history");

  if (!history) {
    return;
  }

  currentDiaryDate = date;

  history.innerHTML = `

    <div class="diary-loading">

      正在打開這一天的日記 ☁️

    </div>

  `;

  try {
    const data = await getJSON("diaryByDate", {
      date: date,
    });

    currentDiaries = Array.isArray(data.diaries) ? data.diaries : [];

    currentReactions = Array.isArray(data.reactions) ? data.reactions : [];

    currentReplies = Array.isArray(data.replies) ? data.replies : [];

    renderSelectedDiaryDate();
  } catch (error) {
    console.error("日記讀取失敗", error);

    if (
      error.message === "TOKEN_EXPIRED" ||
      error.message === "LOGIN_REQUIRED"
    ) {
      setDiaryToken("");

      window.location.replace("index.html");

      return;
    }

    history.innerHTML = `

      <div class="diary-empty">

        日記讀取失敗，請再試一次 😢

      </div>

    `;
  }
}

// ==========================================================
// 📖 Render 當天日記
// ==========================================================

function renderSelectedDiaryDate() {
  const history = document.getElementById("diary-history");

  if (!history) {
    return;
  }

  history.innerHTML = "";

  const diaries = currentDiaries.slice().sort(function (a, b) {
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });

  const header = document.createElement("div");

  header.className = "diary-card-header";

  header.innerHTML = `

    <div>

      <div class="meal-title">

        📖 ${escapeHTML(currentDiaryDate)}

      </div>

      <div class="meal-subtitle">

        ${
          diaries.length
            ? `這天留下了 ${diaries.length} 篇日記`
            : "這天還沒有日記"
        }

      </div>

    </div>

  `;

  history.appendChild(header);

  if (diaries.length === 0) {
    const empty = document.createElement("div");

    empty.className = "diary-empty";

    empty.innerHTML = `

      這天還沒有留下日記。
      <br />
      想寫的時候再寫就好 ❤️

    `;

    history.appendChild(empty);

    return;
  }

  diaries.forEach(function (diary) {
    history.appendChild(createDiaryElement(diary));
  });
}

// ==========================================================
// 📖 建立日記卡片
// ==========================================================

function createDiaryElement(diary) {
  const article = document.createElement("article");

  article.className = "diary-entry";

  article.dataset.diaryId = String(diary.id);

  const author = DIARY_AUTHORS[diary.author] || DIARY_AUTHORS.SMALL;

  const isMyDiary = diary.author === currentDiaryAuthor;

  const diaryReactions = currentReactions.filter(function (item) {
    return String(item.diaryId) === String(diary.id);
  });

  const diaryReplies = currentReplies.filter(function (item) {
    return String(item.diaryId) === String(diary.id);
  });

  // ========================================================
  // ❤️ 表情
  // ========================================================

  let reactionsHTML = "";

  const reactionTypes = ["❤️", "🥰", "😂", "🥹", "😘", "🤣"];

  reactionTypes.forEach(function (reaction) {
    const count = diaryReactions.filter(function (item) {
      return item.reaction === reaction;
    }).length;

    const mine = diaryReactions.some(function (item) {
      return item.author === currentDiaryAuthor && item.reaction === reaction;
    });

    if (isMyDiary) {
      if (count > 0) {
        reactionsHTML += `

            <span class="diary-reaction-count">

              ${reaction}
              ${count}

            </span>

          `;
      }

      return;
    }

    reactionsHTML += `

        <button
          type="button"
          class="diary-reaction-button ${mine ? "active" : ""}"
          data-diary-id="${escapeHTML(diary.id)}"
          data-reaction="${escapeHTML(reaction)}"
        >

          ${reaction}

          ${count > 0 ? `<span>${count}</span>` : ""}

        </button>

      `;
  });

  // ========================================================
  // 💬 回覆
  // ========================================================

  let repliesHTML = "";

  diaryReplies.forEach(function (reply) {
    const replyAuthor = DIARY_AUTHORS[reply.author] || DIARY_AUTHORS.SMALL;

    repliesHTML += `

        <div class="diary-reply">

          <span class="diary-reply-author">

            ${replyAuthor.icon}
            ${replyAuthor.name}

          </span>

          ${escapeHTML(reply.content)}

        </div>

      `;
  });

  // ========================================================
  // 💬 回覆輸入
  // ========================================================

  let replyFormHTML = `
      <div class="diary-reply-form">

        <input
          class="diary-reply-input"
          type="text"
          maxlength="1000"
          placeholder="回一句給對方 💬"
          data-diary-id="${escapeHTML(diary.id)}"
        />

        <button
          class="diary-reply-button"
          type="button"
          data-diary-id="${escapeHTML(diary.id)}"
        >

          回覆

        </button>

      </div>

    `;

  // ========================================================
  // 📷 私人照片
  // ========================================================

  let photoHTML = "";

  // --------------------------------------------------------
  // 優先使用 photoId / privatePhotoId
  // 舊資料如果還是 photoUrl，也相容
  // --------------------------------------------------------

  const photoFileId =
    diary.photoId || diary.privatePhotoId || diary.photoUrl || "";

  if (photoFileId) {
    photoHTML = `

      <div
        class="diary-photo private-diary-photo"
        data-photo-file-id="${escapeHTML(photoFileId)}"
      >

        <div class="diary-photo-loading">

          照片載入中 📷

        </div>

      </div>

    `;
  }

  // ========================================================
  // 📝 卡片
  // ========================================================

  article.innerHTML = `

    <div class="diary-entry-header">

      <div class="diary-author">

        <span>
          ${author.icon}
        </span>

        <span>
          ${author.name}
        </span>

        ${
          diary.mood
            ? `
              <span class="diary-author-mood">

                ${escapeHTML(diary.mood)}

              </span>
            `
            : ""
        }

      </div>


      <div class="diary-date">

        ${escapeHTML(diary.createdAt || "")}

      </div>

    </div>


    <div class="diary-content">

      ${escapeHTML(String(diary.content || "").trim())}

    </div>


    ${photoHTML}


    <div class="diary-reactions">

      ${reactionsHTML || (isMyDiary ? "" : "還沒有人留下反應")}

    </div>


    <div class="diary-replies">

      ${repliesHTML}

      ${replyFormHTML}

    </div>

  `;

  // ========================================================
  // ❤️ 表情事件
  // ========================================================

  article.querySelectorAll(".diary-reaction-button").forEach(function (button) {
    button.addEventListener("click", function () {
      toggleReaction(button.dataset.diaryId, button.dataset.reaction);
    });
  });

  // ========================================================
  // 💬 回覆事件
  // ========================================================

  const replyButton = article.querySelector(".diary-reply-button");

  if (replyButton) {
    replyButton.addEventListener("click", function () {
      const input = article.querySelector(".diary-reply-input");

      if (!input) {
        return;
      }

      submitReply(replyButton.dataset.diaryId, input);
    });
  }

  // ========================================================
  // 📷 載入私人照片
  // ========================================================

  if (photoFileId) {
    loadPrivateDiaryPhoto(article, photoFileId);
  }

  return article;
}

// ==========================================================
// 📷 讀取私人照片
// ==========================================================

async function loadPrivateDiaryPhoto(article, fileId) {
  const container = article.querySelector(".private-diary-photo");

  if (!container) {
    return;
  }

  try {
    const data = await getJSON("photo", {
      fileId: fileId,
    });

    if (!data.base64) {
      throw new Error("照片資料不存在");
    }

    const mimeType = data.mimeType || data.mime || "image/jpeg";

    const img = document.createElement("img");

    img.src = `data:${mimeType};base64,${data.base64}`;

    img.alt = "日記照片";

    img.loading = "lazy";

    img.style.width = "100%";

    img.style.maxHeight = "700px";

    // 不裁切
    img.style.objectFit = "contain";

    img.style.borderRadius = "12px";

    container.innerHTML = "";

    container.appendChild(img);
  } catch (error) {
    console.error("私人照片載入失敗：", error);

    container.innerHTML = `

      <div class="diary-photo-error">

        照片目前無法載入 😢

      </div>

    `;
  }
}

// ==========================================================
// ❤️ 表情
// ==========================================================

async function toggleReaction(diaryId, reaction) {
  const diary = currentDiaries.find(function (item) {
    return String(item.id) === String(diaryId);
  });

  if (!diary) {
    return;
  }

  // 不允許自己對自己反應
  if (diary.author === currentDiaryAuthor) {
    return;
  }

  const existingIndex = currentReactions.findIndex(function (item) {
    return (
      String(item.diaryId) === String(diaryId) &&
      item.author === currentDiaryAuthor &&
      item.reaction === reaction
    );
  });

  // --------------------------------------------------
  // 立即更新畫面
  // --------------------------------------------------

  if (existingIndex !== -1) {
    currentReactions.splice(existingIndex, 1);
  } else {
    currentReactions.push({
      id: "local-" + Date.now(),

      diaryId: String(diaryId),

      author: currentDiaryAuthor,

      reaction: reaction,

      pending: true,
    });
  }

  renderSelectedDiaryDate();

  // --------------------------------------------------
  // 背景同步
  // --------------------------------------------------

  try {
    await postJSON({
      action: "addReaction",

      diaryId: diaryId,

      author: currentDiaryAuthor,

      reaction: reaction,
    });
  } catch (error) {
    console.error("表情同步失敗", error);

    try {
      await showDiaryForDate(currentDiaryDate);
    } catch (reloadError) {
      console.error("重新載入失敗", reloadError);
    }
  }
}

// ==========================================================
// 💬 回覆
// ==========================================================

async function submitReply(diaryId, input) {
  const content = input.value.trim();

  if (!content) {
    return;
  }

  const diary = currentDiaries.find(function (item) {
    return String(item.id) === String(diaryId);
  });

  if (!diary) {
    return;
  }

  const temporaryReply = {
    id: "local-" + Date.now(),

    diaryId: String(diaryId),

    author: currentDiaryAuthor,

    content: content,

    pending: true,
  };

  currentReplies.push(temporaryReply);

  input.value = "";

  renderSelectedDiaryDate();

  try {
    await postJSON({
      action: "addReply",

      diaryId: diaryId,

      author: currentDiaryAuthor,

      content: content,
    });
  } catch (error) {
    console.error("回覆同步失敗", error);

    const index = currentReplies.indexOf(temporaryReply);

    if (index !== -1) {
      currentReplies.splice(index, 1);
    }

    renderSelectedDiaryDate();

    alert("回覆送出失敗，請再試一次 😢");
  }
}

// ==========================================================
// 🌐 API：GET
// ==========================================================

async function getJSON(action, params = {}) {
  const token = getDiaryToken();

  // --------------------------------------------------
  // Diary 所有 API 都需要共用 Token
  // --------------------------------------------------

  if (!token) {
    throw new Error("LOGIN_REQUIRED");
  }

  const query = new URLSearchParams();

  query.set("action", action);

  Object.keys(params).forEach(function (key) {
    if (params[key] !== undefined && params[key] !== null) {
      query.set(key, params[key]);
    }
  });

  query.set("token", token);

  query.set("t", Date.now());

  const response = await fetch(API_URL + "?" + query.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  // --------------------------------------------------
  // Token 過期
  // --------------------------------------------------

  if (data && (data.message === "TOKEN_EXPIRED" || data.authorized === false)) {
    setDiaryToken("");

    throw new Error("TOKEN_EXPIRED");
  }

  if (data && data.success === false) {
    throw new Error(data.message || "API 讀取失敗");
  }

  return data;
}

// ==========================================================
// 🌐 API：POST
// ==========================================================

async function postJSON(data) {
  const token = getDiaryToken();

  if (!token) {
    throw new Error("LOGIN_REQUIRED");
  }

  const payload = {
    ...data,

    token: token,
  };

  // ========================================================
  // ⚠️ 保留原本成功的方式
  //
  // no-cors
  // text/plain
  // 不使用 keepalive
  // ========================================================

  await fetch(API_URL, {
    method: "POST",

    mode: "no-cors",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(payload),
  });

  return true;
}

// ==========================================================
// 📷 圖片壓縮
// ==========================================================

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        const maxWidth = 1000;

        const maxHeight = 1000;

        let width = image.width;

        let height = image.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(
            maxWidth / width,

            maxHeight / height,
          );

          width = Math.round(width * ratio);

          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);

        const base64 = compressed.split(",")[1];

        if (base64.length > 3.2 * 1024 * 1024) {
          reject(new Error("照片太大，請選擇較小的照片"));

          return;
        }

        resolve(base64);
      };

      image.onerror = reject;

      image.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// ==========================================================
// 🛠 工具
// ==========================================================

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================================
// 😌 清除心情
// ==========================================================

function resetMoodButtons() {
  document.querySelectorAll(".diary-mood-button").forEach(function (button) {
    button.classList.remove("active");
  });
}

// ==========================================================
// 📷 清除照片預覽
// ==========================================================

function resetDiaryPhotoPreview() {
  const preview = document.getElementById("diary-photo-preview");

  if (!preview) {
    return;
  }

  preview.innerHTML = `

    <div class="photo-content">

      <div class="photo-icon">
        📷
      </div>

      <div>
        留下一張照片
      </div>

      <small>
        照片不是必要的 ❤️
      </small>

    </div>

  `;
}

// ==========================================================
// 🛡 HTML Escape
// ==========================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
