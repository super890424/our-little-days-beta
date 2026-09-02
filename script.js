// ==================================================
// Our Little Days｜首頁＋健康寶寶
// ==================================================

const GOAL = 45;

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

const USER_ID = "VEGGIE-BABY-001";

const TOKEN_KEY = "veggie-baby-token";

const DIARY_TOKEN_KEY = "veggie-baby-diary-token";

// ==================================================
// 判斷目前頁面
// ==================================================

const currentPage = window.location.pathname.split("/").pop() || "index.html";

const isHomePage = currentPage === "index.html";

const isChallengePage = currentPage === "challenge.html";

// ==================================================
// 全域狀態
// ==================================================

let totalPoints = 0;

let mealHistory = [];

let challengeCompleted = false;

let isSubmitting = false;

let selectedPhoto = null;

// ==================================================
// DOM
// ==================================================

const loginScreen = document.getElementById("login-screen");

const homeScreen = document.getElementById("home-screen");

const app = document.getElementById("app");

const loginPassword = document.getElementById("login-password");

const loginButton = document.getElementById("login-button");

const loginMessage = document.getElementById("login-message");

const mealDate = document.getElementById("meal-date");

const mealTime = document.getElementById("meal-time");

const mealPhoto = document.getElementById("meal-photo");

const completeButton = document.getElementById("complete-meal");

const wishStatus = document.getElementById("wish-status");

const wishResult = document.getElementById("wish-result");

const mealPointsPreview = document.getElementById("meal-points-preview");

const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    logout();
  });
}

// ==================================================
// Token
// ==================================================

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function getDiaryToken() {
  return sessionStorage.getItem(DIARY_TOKEN_KEY) || "";
}

// ==================================================
// SHA256
// ==================================================

async function sha256(text) {
  const encoder = new TextEncoder();

  const data = encoder.encode(text);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    })
    .join("");
}

// ==================================================
// 登入
// ==================================================

async function login() {
  const password = loginPassword ? loginPassword.value.trim() : "";

  if (!password) {
    if (loginMessage) {
      loginMessage.textContent = "請輸入密碼 🔐";
    }

    return;
  }

  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "登入中…";
  }

  if (loginMessage) {
    loginMessage.textContent = "";
  }

  try {
    // ==================================================
    // 1. Health Baby 登入 Challenge
    // ==================================================

    const challengeResponse = await fetch(
      API_URL + "?action=loginChallenge&t=" + Date.now(),
    );

    if (!challengeResponse.ok) {
      throw new Error("無法取得登入驗證");
    }

    const challenge = await challengeResponse.json();

    if (!challenge.success || !challenge.nonce) {
      throw new Error(challenge.message || "登入驗證失敗");
    }

    // ==================================================
    // 2. 計算 Health Proof
    // ==================================================

    const proof = await sha256(password + ":" + challenge.nonce);

    // ==================================================
    // 3. Health Login
    // ==================================================

    const query = new URLSearchParams();

    query.set("action", "login");
    query.set("nonce", challenge.nonce);
    query.set("proof", proof);

    const response = await fetch(
      API_URL + "?" + query.toString() + "&t=" + Date.now(),
    );

    if (!response.ok) {
      throw new Error("登入請求失敗");
    }

    const result = await response.json();

    if (!result.success || !result.token) {
      throw new Error(result.message || "密碼錯誤");
    }

    // ==================================================
    // 4. 儲存 Health Token
    // ==================================================

    saveToken(result.token);

    // ==================================================
    // 5. 嘗試取得 Diary Token
    //
    // Diary 使用另一組 Token。
    // 如果後端目前仍是分開登入，
    // 這裡一起取得，之後就不需要
    // 在 diary.html 再出現登入畫面。
    // ==================================================

    try {
      const diaryChallengeResponse = await fetch(
        API_URL + "?action=diaryChallenge&t=" + Date.now(),
      );

      if (diaryChallengeResponse.ok) {
        const diaryChallenge = await diaryChallengeResponse.json();

        if (diaryChallenge.success && diaryChallenge.nonce) {
          const diaryProof = await sha256(
            password + ":" + diaryChallenge.nonce,
          );

          const diaryResponse = await fetch(API_URL, {
            method: "POST",

            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },

            body: JSON.stringify({
              action: "diaryLogin",

              nonce: diaryChallenge.nonce,

              proof: diaryProof,
            }),
          });

          const diaryResult = await diaryResponse.json();

          if (diaryResult.success && diaryResult.token) {
            sessionStorage.setItem(DIARY_TOKEN_KEY, diaryResult.token);
          }
        }
      }
    } catch (diaryError) {
      // Diary 登入失敗不影響 Health Baby
      console.warn("Diary Token 取得失敗：", diaryError);
    }

    // ==================================================
    // 6. 登入成功
    // ==================================================

    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }

    if (homeScreen) {
      homeScreen.classList.remove("hidden");
    }

    if (app) {
      app.classList.remove("hidden");
    }

    // 首頁不需要載入 Health 資料
    if (isHomePage) {
      return;
    }

    // Challenge 才初始化 Health
    await initializeChallenge();
  } catch (error) {
    console.error("登入失敗：", error);

    clearToken();

    if (loginMessage) {
      loginMessage.textContent = "密碼錯誤或登入失敗，請再試一次 🔐";
    }
  } finally {
    if (loginButton) {
      loginButton.disabled = false;

      loginButton.textContent = "進入我們的小日子 ♡";
    }
  }
}

// ==================================================
// 登入按鈕
// ==================================================

if (loginButton) {
  loginButton.addEventListener("click", login);
}

// ==================================================
// Enter 登入
// ==================================================

if (loginPassword) {
  loginPassword.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      login();
    }
  });
}

// ==================================================
// API GET
// ==================================================

async function getJSON(action, params = {}) {
  const token = getToken();

  if (action !== "loginChallenge" && !token) {
    throw new Error("LOGIN_REQUIRED");
  }

  const query = new URLSearchParams();

  query.set("action", action);

  Object.keys(params).forEach(function (key) {
    const value = params[key];

    if (value !== undefined && value !== null) {
      query.set(key, value);
    }
  });

  if (action !== "loginChallenge") {
    query.set("token", token);
  }

  const response = await fetch(
    API_URL + "?" + query.toString() + "&t=" + Date.now(),
  );

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  const data = await response.json();

  if (data && data.message === "TOKEN_EXPIRED") {
    clearToken();

    throw new Error("TOKEN_EXPIRED");
  }

  return data;
}

// ==================================================
// API POST
// ==================================================
//
// 保留原本成功的：
// no-cors + text/plain
//
// ==================================================

async function postJSON(payload) {
  const token = getToken();

  if (!token) {
    throw new Error("LOGIN_REQUIRED");
  }

  payload.token = token;

  await fetch(API_URL, {
    method: "POST",

    mode: "no-cors",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(payload),
  });

  await sleep(800);

  return true;
}

// ==================================================
// 日期 / 時間
// ==================================================

function setCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");

  const minutes = String(now.getMinutes()).padStart(2, "0");

  if (mealDate) {
    mealDate.value = `${year}-${month}-${day}`;
  }

  if (mealTime) {
    mealTime.value = `${hours}:${minutes}`;
  }
}

// ==================================================
// 照片選擇
// ==================================================

if (mealPhoto) {
  mealPhoto.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
      selectedPhoto = null;
      return;
    }

    selectedPhoto = file;

    const reader = new FileReader();

    reader.onload = function (event) {
      const photoBox = document.querySelector(".photo-box");

      if (!photoBox) {
        return;
      }

      photoBox.innerHTML = `
            <img
              src="${event.target.result}"
              alt="這餐的照片"
            >
          `;
    };

    reader.readAsDataURL(file);
  });
}

// ==================================================
// 計算本餐點數
// ==================================================

function calculateMealPoints() {
  let points = 0;

  const veggieLevel = document.querySelector(
    'input[name="veggie-level"]:checked',
  );

  if (veggieLevel) {
    if (veggieLevel.value === "1") {
      points += 1;
    }

    if (veggieLevel.value === "2") {
      points += 2;
    }
  }

  const firstBiteTask = document.getElementById("first-bite-task");

  if (firstBiteTask && firstBiteTask.checked) {
    points += 1;
  }

  const fruitTask = document.getElementById("fruit-task");

  if (fruitTask && fruitTask.checked) {
    points += 1;
  }

  const exerciseTask = document.getElementById("exercise-task");

  if (exerciseTask && exerciseTask.checked) {
    points += 2;
  }

  return Math.min(points, 7);
}

// ==================================================
// 更新本餐分數
// ==================================================

function updateMealPointsPreview() {
  if (!mealPointsPreview) {
    return;
  }

  const points = calculateMealPoints();

  mealPointsPreview.textContent = `這餐可以獲得 +${points} 分 🌱`;
}

// ==================================================
// 任務事件
// ==================================================

document
  .querySelectorAll(
    'input[name="veggie-level"], #first-bite-task, #fruit-task, #exercise-task',
  )
  .forEach(function (input) {
    input.addEventListener("change", updateMealPointsPreview);
  });

// ==================================================
// 完成這餐
// ==================================================

if (completeButton) {
  completeButton.addEventListener("click", async function () {
    if (challengeCompleted || isSubmitting) {
      return;
    }

    isSubmitting = true;

    completeButton.disabled = true;

    completeButton.textContent = "準備中...";

    const mealPoints = calculateMealPoints();

    if (mealPoints === 0) {
      alert("至少完成一個小任務吧 🥬");

      resetSubmitState();

      return;
    }

    // ==================================================
    // 餐別
    // ==================================================

    const selectedMeal = document.querySelector(
      'input[name="meal-type"]:checked',
    );

    if (!selectedMeal) {
      alert("選一下這是哪一餐吧 🍽️");

      resetSubmitState();

      return;
    }

    const mealType = selectedMeal.value;

    // ==================================================
    // 正餐一天一次
    // ==================================================

    const regularMeals = ["早餐", "午餐", "晚餐"];

    if (regularMeals.includes(mealType)) {
      const alreadyExists = mealHistory.some(function (meal) {
        return meal.date === mealDate.value && meal.type === mealType;
      });

      if (alreadyExists) {
        alert(`今天的「${mealType}」已經打卡過了 🥬`);

        resetSubmitState();

        return;
      }
    }

    // ==================================================
    // 任務資料
    // ==================================================

    const veggieLevel = document.querySelector(
      'input[name="veggie-level"]:checked',
    );

    const firstBiteTask = document.getElementById("first-bite-task");

    const fruitTask = document.getElementById("fruit-task");

    const exerciseTask = document.getElementById("exercise-task");

    const meal = {
      date: mealDate.value,

      time: mealTime.value,

      type: mealType,

      points: mealPoints,

      veggie: veggieLevel !== null,

      veggieLevel: veggieLevel ? Number(veggieLevel.value) : 0,

      firstBite: firstBiteTask ? firstBiteTask.checked : false,

      fruit: fruitTask ? fruitTask.checked : false,

      exercise: exerciseTask ? exerciseTask.checked : false,
    };

    // ==================================================
    // 上傳
    // ==================================================

    const sent = await sendMealToCloud(meal);

    if (!sent) {
      resetSubmitState();

      return;
    }

    completeButton.textContent = "正在更新日記 ☁️";

    const cloudSuccess = await loadCloudData();

    if (!cloudSuccess) {
      alert("餐點已經送到雲端，但日記更新失敗。\n重新整理頁面就會出現。");

      resetSubmitState();

      return;
    }

    const mealMessage = document.getElementById("meal-message");

    if (mealMessage) {
      mealMessage.textContent = `這餐完成！ +${mealPoints} 點 🥬❤️`;
    }
    if (totalPoints >= GOAL && !challengeCompleted) {
      const completed = await markChallengeCompleted();

      if (completed) {
        challengeCompleted = true;
        updateChallengeUI();
        showCompletionScreen();
      }
    }

    isSubmitting = false;

    resetMealForm();

    updatePoints();

    updateChallengeUI();
  });
}

// ==================================================
// 重置送出狀態
// ==================================================

function resetSubmitState() {
  isSubmitting = false;

  if (!completeButton) {
    return;
  }

  completeButton.disabled = challengeCompleted;

  completeButton.textContent = challengeCompleted
    ? "挑戰已完成 🎓"
    : "完成這餐 🥬";
}

// ==================================================
// 更新總點數
// ==================================================

function updatePoints() {
  const points = document.getElementById("points");

  const progress = document.getElementById("progress");

  const progressText = document.getElementById("progress-text");

  if (points) {
    points.textContent = totalPoints;
  }

  const percentage = Math.min((totalPoints / GOAL) * 100, 100);

  if (progress) {
    progress.style.width = percentage + "%";
  }

  if (progressText) {
    if (totalPoints >= GOAL) {
      progressText.textContent = "🎉 健康寶寶挑戰完成！";
    } else {
      progressText.textContent = `距離願望券還有 ${GOAL - totalPoints} 點`;
    }
  }

  updateChallengeUI();
}

// ==================================================
// Challenge UI
// ==================================================

function updateChallengeUI() {
  if (!completeButton) {
    return;
  }

  if (challengeCompleted) {
    completeButton.disabled = true;

    completeButton.textContent = "挑戰已完成 🎓";

    if (wishStatus) {
      wishStatus.textContent = "🎉 健康寶寶挑戰完成！";
    }
  } else {
    completeButton.disabled = isSubmitting;

    if (!isSubmitting) {
      completeButton.textContent = "完成這餐 🥬";
    }

    if (wishStatus) {
      wishStatus.textContent = `集滿 ${GOAL} 點，就可以領取願望券 ❤️`;
    }
  }
}

// ==================================================
// 完成畫面
// ==================================================

function showCompletionScreen() {
  const overlay = document.getElementById("completion-overlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("hidden");

  const content = overlay.querySelector(".completion-content");

  if (!content) {
    return;
  }

  content.innerHTML = `

    <div class="completion-confetti">
      🥬 ✨ 🎉 ✨ 🥬
    </div>

    <div class="completion-icon">
      🎓
    </div>

    <p class="completion-small">
      HEALTHY BABY
    </p>

    <h1>
      妳做到了！
    </h1>

    <p class="completion-points">
      45 / 45 POINTS
    </p>

    <div class="voucher-modal">

      <div
        id="wish-voucher"
        class="wish-voucher"
      >

        <div class="voucher-ticket-icon">
          🎟️
        </div>

        <div class="voucher-label">
          WISH VOUCHER
        </div>

        <div class="voucher-title">
          健康寶寶挑戰
        </div>

        <div class="voucher-points">
          45 / 45 POINTS
        </div>

        <div class="voucher-divider">
          ✦　✦　✦
        </div>

        <div class="voucher-main-title">
          妳的願望券
        </div>

        <div class="voucher-main-text">
          一個值得被好好實現的願望 ❤️
        </div>

        <div class="voucher-footer">
          Made with love ❤️
        </div>

      </div>

      <div class="voucher-message">

        🎉 妳做到了！

        <br><br>

        這一張願望券，
        是妳為自己努力換來的。

        <br><br>

        希望以後就算沒有這個小遊戲，
        妳也會記得好好照顧自己。🌱

      </div>

      <button
        id="save-wish-button"
        class="completion-button"
        type="button"
      >
        領取願望券 🎟️
      </button>

<a
  href="index.html"
  class="wish-close-button"
>
  ← 回到首頁
</a>

      <div
        id="save-wish-message"
        class="save-wish-message"
      ></div>

    </div>
  `;

  const saveButton = document.getElementById("save-wish-button");

  if (saveButton) {
    saveButton.addEventListener("click", saveWishVoucher);
  }
}

// ==================================================
// 儲存願望券
// ==================================================

async function saveWishVoucher() {
  const voucher = document.getElementById("wish-voucher");

  const saveButton = document.getElementById("save-wish-button");

  const message = document.getElementById("save-wish-message");

  if (!voucher) {
    return;
  }

  if (saveButton) {
    saveButton.disabled = true;

    saveButton.textContent = "正在製作願望券 📸";
  }

  try {
    if (typeof html2canvas !== "function") {
      throw new Error("html2canvas 尚未載入");
    }

    const canvas = await html2canvas(voucher, {
      backgroundColor: "#ffffff",

      scale: 2,

      useCORS: true,

      allowTaint: false,

      logging: false,
    });

    const blob = await new Promise(function (resolve) {
      canvas.toBlob(function (result) {
        resolve(result);
      }, "image/png");
    });

    if (!blob) {
      throw new Error("無法建立圖片");
    }

    const file = new File([blob], "健康寶寶願望券.png", {
      type: "image/png",
    });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      await navigator.share({
        files: [file],

        title: "健康寶寶願望券",

        text: "我完成健康寶寶挑戰了！🎟️❤️",
      });

      if (message) {
        message.textContent = "願望券已準備好 🎟️❤️";
      }

      if (saveButton) {
        saveButton.textContent = "願望券已領取 🎟️";
      }

      return;
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "健康寶寶願望券.png";

    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);

    if (message) {
      message.textContent = "願望券已經準備好了 🎟️❤️";
    }

    if (saveButton) {
      saveButton.textContent = "願望券已領取 🎟️";
    }
  } catch (error) {
    console.error("願望券儲存失敗：", error);

    if (error.name === "AbortError") {
      if (saveButton) {
        saveButton.disabled = false;

        saveButton.textContent = "領取願望券 🎟️";
      }

      return;
    }

    if (message) {
      message.textContent = "圖片製作失敗，請再試一次 😢";
    }

    if (saveButton) {
      saveButton.disabled = false;

      saveButton.textContent = "再試一次 🎟️";
    }
  }
}

// ==================================================
// 吃菜日記
// ==================================================

async function renderHistory() {
  const history = document.getElementById("meal-history");

  const count = document.getElementById("meal-count");

  if (!history) {
    return;
  }

  if (count) {
    count.textContent = `${mealHistory.length} 餐`;
  }

  history.innerHTML = "";

  if (mealHistory.length === 0) {
    history.innerHTML = `
      <div class="empty-history">
        今天還沒有紀錄 🥬
      </div>
    `;

    return;
  }

  mealHistory
    .slice()
    .reverse()
    .forEach(function (meal) {
      const item = document.createElement("div");

      item.className = "history-item";

      let taskIcons = "";

      if (meal.veggieLevel === 1) {
        taskIcons += "🥬";
      }

      if (meal.veggieLevel === 2) {
        taskIcons += "🥬🥬";
      }

      if (meal.firstBite) {
        taskIcons += "✨";
      }

      if (meal.fruit) {
        taskIcons += "🍎";
      }

      if (meal.exercise) {
        taskIcons += "🏃‍♀️";
      }

      item.innerHTML = `

          <div class="history-item-header">

            <div class="history-meal">
              ${meal.type}
            </div>

            <div class="history-time">
              ${meal.date}
              ${meal.time}
            </div>

          </div>

          <div
            class="history-photo"
            data-photo-id="${meal.photoId || ""}"
          >
            <div class="photo-loading">
              📸 載入照片中…
            </div>
          </div>

          <div class="history-points">

            +${meal.points} 點

            ${taskIcons}

          </div>
        `;

      history.appendChild(item);

      const photoId = meal.photoId || meal.privatePhotoId || "";

      if (!photoId) {
        const photoBox = item.querySelector(".history-photo");

        if (photoBox) {
          photoBox.innerHTML = "";

          photoBox.style.display = "none";
        }

        return;
      }

      loadPrivatePhoto(photoId, item);
    });
}

// ==================================================
// 私人照片
// ==================================================

async function loadPrivatePhoto(fileId, historyItem) {
  try {
    const data = await getJSON("photo", {
      fileId: fileId,
    });

    if (!data.success || !data.base64) {
      throw new Error("照片讀取失敗");
    }

    const photoBox = historyItem.querySelector(".history-photo");

    if (!photoBox) {
      return;
    }

    const img = document.createElement("img");

    img.src = `data:${data.mime};base64,${data.base64}`;

    img.alt = "這餐的照片";

    img.style.objectFit = "contain";

    photoBox.innerHTML = "";

    photoBox.appendChild(img);
  } catch (error) {
    console.error("私人照片載入失敗：", error);

    const photoBox = historyItem.querySelector(".history-photo");

    if (photoBox) {
      photoBox.innerHTML = `
        <div class="photo-error">
          📷 照片暫時無法載入
        </div>
      `;
    }
  }
}

// ==================================================
// 重置餐點表單
// ==================================================

function resetMealForm() {
  document
    .querySelectorAll('input[name="veggie-level"]')
    .forEach(function (radio) {
      radio.checked = false;
    });

  const firstBiteTask = document.getElementById("first-bite-task");

  if (firstBiteTask) {
    firstBiteTask.checked = false;
  }

  const fruitTask = document.getElementById("fruit-task");

  if (fruitTask) {
    fruitTask.checked = false;
  }

  const exerciseTask = document.getElementById("exercise-task");

  if (exerciseTask) {
    exerciseTask.checked = false;
  }

  document
    .querySelectorAll('input[name="meal-type"]')
    .forEach(function (radio) {
      radio.checked = false;
    });

  selectedPhoto = null;

  if (mealPhoto) {
    mealPhoto.value = "";
  }

  const photoBox = document.querySelector(".photo-box");

  if (photoBox) {
    photoBox.innerHTML = `

      <div class="photo-content">

        <div class="photo-icon">
          📸
        </div>

        <div>
          留下這餐的照片
        </div>

        <small>
          照片是可選的 ❤️
        </small>

      </div>
    `;
  }

  updateMealPointsPreview();

  setCurrentDateTime();

  if (completeButton) {
    completeButton.disabled = challengeCompleted;

    completeButton.textContent = challengeCompleted
      ? "挑戰已完成 🎓"
      : "完成這餐 🥬";
  }
}

// ==================================================
// 讀取 Google 雲端
// ==================================================

async function loadCloudData() {
  try {
    const data = await getJSON("getMealData", {
      id: USER_ID,
    });

    if (!data.success) {
      console.error("☁️ 雲端資料讀取失敗：", data.message);

      return false;
    }

    challengeCompleted = data.challengeCompleted === true;

    const cloudMeals = Array.isArray(data.meals)
      ? data.meals.filter(function (meal) {
          return meal.id === USER_ID;
        })
      : [];

    mealHistory = cloudMeals.map(function (meal) {
      return {
        date: meal.date || "",

        time: meal.time || "",

        type: meal.type || "",

        points: Number(meal.points) || 0,

        veggie: meal.veggie === true || meal.veggie === "TRUE",

        veggieLevel: Number(meal.veggieLevel || 0),

        firstBite: meal.firstBite === true || meal.firstBite === "TRUE",

        fruit: meal.fruit === true || meal.fruit === "TRUE",

        exercise: meal.exercise === true || meal.exercise === "TRUE",

        photoId: meal.photoId || meal.privatePhotoId || meal.photoUrl || "",

        privatePhotoId: meal.privatePhotoId || meal.photoId || "",
      };
    });

    // ==================================================
    // 45 分封頂
    // ==================================================

    totalPoints = Math.min(
      mealHistory.reduce(function (total, meal) {
        return total + Number(meal.points || 0);
      }, 0),
      GOAL,
    );

    await renderHistory();

    updatePoints();

    updateMealPointsPreview();

    updateChallengeUI();

    if (challengeCompleted) {
      showCompletionScreen();
    }

    console.log("☁️ 雲端資料同步成功");

    return true;
  } catch (error) {
    console.error("☁️ 無法取得雲端資料：", error);

    if (
      error.message === "TOKEN_EXPIRED" ||
      error.message === "LOGIN_REQUIRED"
    ) {
      logout();
    }

    return false;
  }
}

// ==================================================
// 上傳餐點
// ==================================================

async function sendMealToCloud(meal) {
  try {
    let photoData = null;

    // ==================================================
    // 照片「可選」
    // ==================================================

    if (selectedPhoto) {
      completeButton.textContent = "照片處理中 📸";

      const base64 = await fileToBase64(selectedPhoto);

      photoData = {
        base64: base64,

        fileName: `${meal.date}_${meal.time}_${meal.type}.jpg`,
      };
    }

    completeButton.textContent = "正在同步 ☁️";

    // ==================================================
    // 注意：
    // photoData 可以是 null
    // 沒照片也照樣可以打卡
    // ==================================================

    await postJSON({
      action: "addMeal",

      id: USER_ID,

      date: meal.date,

      time: meal.time,

      type: meal.type,

      veggie: meal.veggie,

      veggieLevel: meal.veggieLevel,

      firstBite: meal.firstBite,

      fruit: meal.fruit,

      exercise: meal.exercise,

      points: meal.points,

      photo: photoData,
    });

    console.log("☁️ 餐點已送出");

    return true;
  } catch (error) {
    console.error("☁️ 餐點送出失敗：", error);

    if (error.message === "LOGIN_REQUIRED") {
      logout();

      return false;
    }

    alert("目前無法連線到雲端，請確認網路後再試一次。");

    return false;
  }
}

// ==================================================
// File → Base64
// ==================================================

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        const maxWidth = 1200;

        const maxHeight = 1200;

        let width = img.width;

        let height = img.height;

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

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.75);

        const base64 = compressed.split(",")[1];

        resolve(base64);
      };

      img.onerror = function (error) {
        reject(error);
      };

      img.src = event.target.result;
    };

    reader.onerror = function (error) {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

// ==================================================
// 標記挑戰完成
// ==================================================

async function markChallengeCompleted() {
  try {
    const token = sessionStorage.getItem("veggie-baby-token");

    if (!token) {
      console.error("挑戰完成同步失敗：沒有登入 Token");
      return false;
    }

    await fetch(API_URL, {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify({
        action: "completeChallenge",

        id: USER_ID,

        token: token,
      }),

      keepalive: true,
    });

    return true;
  } catch (error) {
    console.error("挑戰完成同步失敗", error);

    return false;
  }
}

// ==================================================
// 登出
// ==================================================

function logout() {
  // 清除 Health Baby Token
  clearToken();

  // 清除 Diary Token
  sessionStorage.removeItem(DIARY_TOKEN_KEY);

  // 如果目前在健康寶寶頁面
  if (isChallengePage) {
    window.location.href = "index.html";

    return;
  }

  // 如果目前在其他需要登入的頁面
  if (homeScreen) {
    homeScreen.classList.add("hidden");
  }

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }

  if (loginPassword) {
    loginPassword.value = "";
  }

  if (loginMessage) {
    loginMessage.textContent = "已登出，期待下次再見 ♡";
  }
}

// ==================================================
// 延遲
// ==================================================

function sleep(milliseconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

// ==================================================
// 初始化 Challenge
// ==================================================

async function initializeChallenge() {
  setCurrentDateTime();

  updateMealPointsPreview();

  await loadCloudData();
}

// ==================================================
// 首頁初始化
// ==================================================

function initializeHome() {
  if (loginScreen) {
    loginScreen.classList.add("hidden");
  }

  if (homeScreen) {
    homeScreen.classList.remove("hidden");
  }
}

// ==================================================
// 啟動
// ==================================================

async function boot() {
  const token = getToken();

  // ==================================================
  // 首頁
  // ==================================================

  if (isHomePage) {
    if (!token) {
      // 沒登入 → 顯示 index 登入畫面

      if (loginScreen) {
        loginScreen.classList.remove("hidden");
      }

      if (homeScreen) {
        homeScreen.classList.add("hidden");
      }

      return;
    }

    // 已登入 → 顯示首頁

    initializeHome();

    return;
  }

  // ==================================================
  // Challenge
  // ==================================================

  if (isChallengePage) {
    if (!token) {
      window.location.replace("index.html");

      return;
    }

    // challenge.html 不再顯示登入畫面

    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }

    if (app) {
      app.classList.remove("hidden");
    }

    await initializeChallenge();

    return;
  }

  // ==================================================
  // 其他頁面
  // ==================================================

  if (!token) {
    window.location.replace("index.html");

    return;
  }
}

// ==================================================
// 啟動
// ==================================================

boot();
