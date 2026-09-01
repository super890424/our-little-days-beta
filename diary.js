// ==========================================================
// 💌 交換日記 diary.js
// ==========================================================

// ==========================================================
// 基本設定
// ==========================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

// ==========================================================
// 身份
// ==========================================================

const DIARY_AUTHOR_KEY = "healthy-baby-diary-author";

const DEFAULT_DIARY_AUTHOR = "SMALL";

const DIARY_AUTHORS = {
  BIG: {
    name: "大朋友",
    icon: "🐕",
  },

  SMALL: {
    name: "小朋友",
    icon: "💃",
  },
};

// ==========================================================
// 表情
// ==========================================================

const REACTIONS = ["❤️", "🥰", "😂", "🥹", "😘", "🤣"];

// ==========================================================
// 里程碑
//
// 兩人的日記總篇數
// ==========================================================

const DIARY_MILESTONES = [
  {
    count: 1,
    icon: "💌",
    title: "第一篇日記！",
    text: "我們的故事開始了 ❤️",
  },

  {
    count: 5,
    icon: "🌱",
    title: "5 篇了！",
    text: "一點一點，寫成我們的日子。",
  },

  {
    count: 10,
    icon: "🌿",
    title: "10 篇了！",
    text: "我們已經留下好多生活了。",
  },

  {
    count: 20,
    icon: "✨",
    title: "20 篇了！",
    text: "日子正在慢慢長成故事。",
  },

  {
    count: 30,
    icon: "💕",
    title: "30 篇了！",
    text: "好多小日子，都被好好留下來了。",
  },

  {
    count: 40,
    icon: "🎉",
    title: "40 篇了！",
    text: "我們的故事越來越長了！",
  },

  {
    count: 50,
    icon: "💌",
    title: "50 篇了！",
    text: "謝謝我們一直把生活分享給彼此。",
  },

  {
    count: 100,
    icon: "🌳",
    title: "100 篇了！",
    text: "我們一起留下 100 個小日子。",
  },

  {
    count: 200,
    icon: "🏡",
    title: "200 篇了！",
    text: "好多生活，都被好好收藏起來了。",
  },

  {
    count: 300,
    icon: "💖",
    title: "300 篇了！",
    text: "我們已經一起留下這麼多生活了。",
  },

  {
    count: 500,
    icon: "✨",
    title: "500 篇了！",
    text: "我們居然已經一起寫了這麼多。",
  },

  {
    count: 1000,
    icon: "🏆",
    title: "1000 篇了！",
    text: "這裡已經裝滿好多好多我們了。",
  },
];

// ==========================================================
// 狀態
// ==========================================================

let currentDiaryAuthor =
  localStorage.getItem(DIARY_AUTHOR_KEY) || DEFAULT_DIARY_AUTHOR;

let diaryDates = [];

let currentDiaries = [];

let currentReactions = [];

let currentReplies = [];

let selectedDiaryPhoto = null;

let selectedDiaryMood = "";

let isDiarySubmitting = false;

let currentDiaryDate = null;

let diaryCurrentDate = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
);

// ==========================================================
// 初始化
// ==========================================================

document.addEventListener("DOMContentLoaded", initializeDiary);

async function initializeDiary() {
  bindIdentityEvents();

  bindDiaryFormEvents();

  bindCalendarEvents();

  updateIdentityUI();

  renderCalendar();

  // 只載入「哪些日期有日記」
  // 不預先載入任何日記內容
  await loadDiaryIndex();
}
// ==========================================================
// 身份
// ==========================================================

function bindIdentityEvents() {
  document.querySelectorAll(".identity-button").forEach((button) => {
    button.addEventListener("click", () => {
      const author = button.dataset.author;

      if (!DIARY_AUTHORS[author]) {
        return;
      }

      currentDiaryAuthor = author;

      localStorage.setItem(DIARY_AUTHOR_KEY, author);

      updateIdentityUI();

      // 如果目前正在看某一天，
      // 重新 render，讓自己不能對自己的日記互動
      if (currentDiaryDate) {
        renderSelectedDiaryDate();
      }
    });
  });
}

function updateIdentityUI() {
  document.querySelectorAll(".identity-button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.author === currentDiaryAuthor,
    );
  });

  const author = DIARY_AUTHORS[currentDiaryAuthor];

  const currentAuthor = document.getElementById("current-diary-author");

  if (currentAuthor) {
    currentAuthor.textContent = `${author.icon} ${author.name}`;
  }
}

// ==========================================================
// 表單
// ==========================================================

function bindDiaryFormEvents() {
  const photoInput = document.getElementById("diary-photo");

  if (photoInput) {
    photoInput.addEventListener("change", handleDiaryPhoto);
  }

  document.querySelectorAll(".diary-mood-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".diary-mood-button").forEach((item) => {
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

function handleDiaryPhoto(event) {
  const file = event.target.files[0];

  if (!file) {
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

        <img
          src="${e.target.result}"
          alt="日記照片預覽"
        />

      `;
  };

  reader.readAsDataURL(file);
}

// ==========================================================
// 💌 新增日記
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
    // ======================================================
    // ① 處理照片
    // ======================================================

    let photo = null;

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

    // ======================================================
    // ② 今天日期
    // ======================================================

    const date = formatDate(new Date());

    // ======================================================
    // ③ 送出日記
    // ======================================================

    if (button) {
      button.textContent = "正在同步 ☁️";
    }

    await postJSON({
      action: "addDiary",

      author: currentDiaryAuthor,

      date: date,

      content: content,

      mood: selectedDiaryMood,

      photo: photo,
    });

    // ======================================================
    // ④ 清空表單
    // ======================================================

    input.value = "";

    selectedDiaryPhoto = null;

    selectedDiaryMood = "";

    const photoInput = document.getElementById("diary-photo");

    if (photoInput) {
      photoInput.value = "";
    }

    resetMoodButtons();

    resetDiaryPhotoPreview();

    // ======================================================
    // ⑤ 顯示成功
    // ======================================================

    if (message) {
      message.textContent = "日記已送出 ❤️";
    }

    // ======================================================
    // ⑥ 更新日曆、里程碑、今天的日記
    //
    // 這些即使失敗，也不能判定日記送出失敗
    // ======================================================

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
// ✨ 我們的里程碑
//
// 篇數直接使用 Google Sheets 的真實總篇數
// 兩個人看到的是同一個進度
// ==========================================================

let diaryTotalCount = 0;

function renderDiaryMilestone() {
  const calendarCard = document.querySelector(".diary-calendar-card");

  if (!calendarCard) {
    return;
  }

  let milestoneCard = document.getElementById("diary-milestone-card");

  if (!milestoneCard) {
    milestoneCard = document.createElement("section");

    milestoneCard.id = "diary-milestone-card";

    milestoneCard.className = "card diary-milestone-card";

    calendarCard.parentNode.insertBefore(milestoneCard, calendarCard);
  }

  const milestones = DIARY_MILESTONES.slice().sort((a, b) => a.count - b.count);

  // ========================================================
  // 找目前最高里程碑
  // ========================================================

  let currentMilestone = null;

  for (const milestone of milestones) {
    if (diaryTotalCount >= milestone.count) {
      currentMilestone = milestone;
    }
  }

  // ========================================================
  // 找下一個里程碑
  // ========================================================

  const nextMilestone = milestones.find(
    (milestone) => milestone.count > diaryTotalCount,
  );

  // ========================================================
  // 還沒有第一個里程碑
  // ========================================================

  if (!currentMilestone) {
    const remaining = nextMilestone ? nextMilestone.count - diaryTotalCount : 0;

    milestoneCard.innerHTML = `

      <div class="diary-milestone-card-header">

        <div class="diary-milestone-icon">
          🌱
        </div>

        <div>

          <div class="diary-milestone-card-title">
            我們的里程碑
          </div>

          <div class="diary-milestone-card-subtitle">
            一起把日子慢慢寫下來
          </div>

        </div>

      </div>


      <div class="diary-milestone-progress">

        <strong>
          ${diaryTotalCount} 篇
        </strong>

        ${
          nextMilestone
            ? `
              <span>
                再 ${remaining} 篇，
                就到 ${nextMilestone.count} 篇 💌
              </span>
            `
            : ""
        }

      </div>

    `;

    return;
  }

  // ========================================================
  // 已經有里程碑
  // ========================================================

  milestoneCard.innerHTML = `

    <div class="diary-milestone-card-header">

      <div class="diary-milestone-icon">
        ${currentMilestone.icon}
      </div>

      <div>

        <div class="diary-milestone-card-title">
          ${escapeHTML(currentMilestone.title)}
        </div>

        <div class="diary-milestone-card-subtitle">
          ${escapeHTML(currentMilestone.text)}
        </div>

      </div>

    </div>


    <div class="diary-milestone-progress">

      <strong>
        ${diaryTotalCount} 篇
      </strong>

      ${
        nextMilestone
          ? `
            <span>
              再 ${nextMilestone.count - diaryTotalCount} 篇，
              就到 ${nextMilestone.count} 篇 💌
            </span>
          `
          : `
            <span>
              我們還在繼續寫下去 ❤️
            </span>
          `
      }

    </div>

  `;
}

// ==========================================================
// 📅 日期索引
// ==========================================================

async function loadDiaryIndex() {
  try {
    const data = await getJSON("diaryIndex");

    diaryDates = Array.isArray(data.diaryDates) ? data.diaryDates : [];

    // ⭐ Google Sheets 真實總篇數
    diaryTotalCount = Number(data.total) || 0;

    renderCalendar();

    renderDiaryMilestone();

    return true;
  } catch (error) {
    console.error("日記日期讀取失敗", error);

    diaryDates = [];

    diaryTotalCount = 0;

    renderCalendar();

    renderDiaryMilestone();

    return false;
  }
}

// ==========================================================
// 📅 日曆
// ==========================================================

function bindCalendarEvents() {
  const prev = document.getElementById("diary-prev-month");

  const next = document.getElementById("diary-next-month");

  if (prev) {
    prev.addEventListener("click", () => {
      diaryCurrentDate = new Date(
        diaryCurrentDate.getFullYear(),
        diaryCurrentDate.getMonth() - 1,
        1,
      );

      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      diaryCurrentDate = new Date(
        diaryCurrentDate.getFullYear(),
        diaryCurrentDate.getMonth() + 1,
        1,
      );

      renderCalendar();
    });
  }
}

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

  weekdays.forEach((day) => {
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

    button.addEventListener("click", () => {
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

  const diaries = currentDiaries
    .slice()
    .sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
    );

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

  diaries.forEach((diary) => {
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

  const diaryReactions = currentReactions.filter(
    (item) => String(item.diaryId) === String(diary.id),
  );

  const diaryReplies = currentReplies.filter(
    (item) => String(item.diaryId) === String(diary.id),
  );

  let photoHTML = "";

  if (diary.photoUrl) {
    photoHTML = `

      <div class="diary-entry-photo">

        <img
          src="${escapeHTML(diary.photoUrl)}"
          alt="日記照片"
          loading="lazy"
        />

      </div>

    `;
  }

  // ========================================================
  // 表情
  //
  // 自己的日記：
  // 只看得到收到的表情
  //
  // 對方的日記：
  // 才可以按表情
  // ========================================================

  let reactionsHTML = "";

  if (isMyDiary) {
    REACTIONS.forEach((reaction) => {
      const count = diaryReactions.filter(
        (item) => item.reaction === reaction,
      ).length;

      if (count > 0) {
        reactionsHTML += `

            <span
              class="diary-reaction-display"
            >

              ${reaction}

              <span>
                ${count}
              </span>

            </span>

          `;
      }
    });
  } else {
    REACTIONS.forEach((reaction) => {
      const count = diaryReactions.filter(
        (item) => item.reaction === reaction,
      ).length;

      const mine = diaryReactions.some(
        (item) =>
          item.author === currentDiaryAuthor && item.reaction === reaction,
      );

      reactionsHTML += `

          <button
            class="diary-reaction-button ${mine ? "active" : ""}"
            type="button"
            data-diary-id="${escapeHTML(diary.id)}"
            data-reaction="${reaction}"
          >

            ${reaction}

            ${count > 0 ? `<span>${count}</span>` : ""}

          </button>

        `;
    });
  }

  // ========================================================
  // 回覆
  // ========================================================

  let repliesHTML = "";

  diaryReplies.forEach((reply) => {
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
  // 回覆輸入
  //
  // 只有對方可以回覆
  // ========================================================

  let replyFormHTML = "";

  if (!isMyDiary) {
    replyFormHTML = `

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
  }

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
          ${diary.mood}
        </span>
      `
      : ""
  }

</div>


      <div class="diary-date">

        ${escapeHTML(diary.createdAt || "")}

      </div>

    </div>


    <div class="diary-content">${escapeHTML(
      String(diary.content || "").trim(),
    )}</div>


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
  // 表情事件
  // ========================================================

  article.querySelectorAll(".diary-reaction-button").forEach((button) => {
    button.addEventListener("click", () => {
      toggleReaction(button.dataset.diaryId, button.dataset.reaction);
    });
  });

  // ========================================================
  // 回覆事件
  // ========================================================

  const replyButton = article.querySelector(".diary-reply-button");

  if (replyButton) {
    replyButton.addEventListener("click", () => {
      const input = article.querySelector(".diary-reply-input");

      if (!input) {
        return;
      }

      submitReply(replyButton.dataset.diaryId, input);
    });
  }

  return article;
}

// ==========================================================
// ❤️ 表情
//
// 重要：
// 只有「對方的日記」才會進到這裡
// ==========================================================

async function toggleReaction(diaryId, reaction) {
  const diary = currentDiaries.find(
    (item) => String(item.id) === String(diaryId),
  );

  if (!diary) {
    return;
  }

  // 防止作者自己呼叫
  if (diary.author === currentDiaryAuthor) {
    return;
  }

  const existingIndex = currentReactions.findIndex(
    (item) =>
      String(item.diaryId) === String(diaryId) &&
      item.author === currentDiaryAuthor &&
      item.reaction === reaction,
  );

  // ========================================================
  // 立即更新畫面
  // ========================================================

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

  // 只重畫這一張
  const oldEntry = document.querySelector(
    `.diary-entry[data-diary-id="${CSS.escape(String(diaryId))}"]`,
  );

  if (oldEntry) {
    const newEntry = createDiaryElement(diary);

    oldEntry.replaceWith(newEntry);
  }

  // ========================================================
  // 背景同步
  // ========================================================

  try {
    await postJSON({
      action: "addReaction",

      diaryId: diaryId,

      author: currentDiaryAuthor,

      reaction: reaction,
    });
  } catch (error) {
    console.error("表情同步失敗", error);

    // ======================================================
    // 失敗 → rollback
    // ======================================================

    if (existingIndex !== -1) {
      currentReactions.push({
        id: "rollback-" + Date.now(),

        diaryId: String(diaryId),

        author: currentDiaryAuthor,

        reaction: reaction,
      });
    } else {
      const index = currentReactions.findIndex(
        (item) =>
          String(item.diaryId) === String(diaryId) &&
          item.author === currentDiaryAuthor &&
          item.reaction === reaction,
      );

      if (index !== -1) {
        currentReactions.splice(index, 1);
      }
    }

    renderSelectedDiaryDate();
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

  const diary = currentDiaries.find(
    (item) => String(item.id) === String(diaryId),
  );

  if (!diary) {
    return;
  }

  // 只有對方可以回覆
  if (diary.author === currentDiaryAuthor) {
    return;
  }

  // ========================================================
  // 立即加入畫面
  // ========================================================

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
// API：GET
// ==========================================================

async function getJSON(action, params = {}) {
  const query = new URLSearchParams();

  query.set("action", action);

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined) {
      query.set(key, params[key]);
    }
  });

  query.set("t", Date.now());

  const response = await fetch(API_URL + "?" + query.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "API 讀取失敗");
  }

  return data;
}

// ==========================================================
// API：POST
// ==========================================================

async function postJSON(data) {
  const response = await fetch(API_URL, {
    method: "POST",

    mode: "no-cors",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(data),

    keepalive: true,
  });

  // no-cors 無法讀 response
  // 但 request 已送出
  return true;
}

// ==========================================================
// 📷 圖片壓縮
// ==========================================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const maxWidth = 1200;

        const maxHeight = 1200;

        let width = image.width;

        let height = image.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);

          width = Math.round(width * ratio);

          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.75);

        resolve(compressed.split(",")[1]);
      };

      image.onerror = reject;

      image.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// ==========================================================
// 工具
// ==========================================================

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function resetMoodButtons() {
  document.querySelectorAll(".diary-mood-button").forEach((button) => {
    button.classList.remove("active");
  });
}

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

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
