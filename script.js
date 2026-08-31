// ====================
// 基本設定
// ====================

const GOAL = 45;

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

const USER_ID = "VEGGIE-BABY-001";

let totalPoints = 0;

let mealHistory = [];

let challengeCompleted = false;

let isSubmitting = false;

let selectedPhoto = null;

// ====================
// DOM
// ====================

const mealDate = document.getElementById("meal-date");

const mealTime = document.getElementById("meal-time");

const mealPhoto = document.getElementById("meal-photo");

const completeButton = document.getElementById("complete-meal");

const startWishButton = document.getElementById("start-wish-button");

const wishStatus = document.getElementById("wish-status");

const wishResult = document.getElementById("wish-result");

// ====================
// 日期 / 時間
// ====================

function setCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");

  const minutes = String(now.getMinutes()).padStart(2, "0");

  mealDate.value = `${year}-${month}-${day}`;

  mealTime.value = `${hours}:${minutes}`;
}

// ====================
// 照片選擇
// ====================

mealPhoto.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) {
    return;
  }

  selectedPhoto = file;

  const reader = new FileReader();

  reader.onload = function (event) {
    const photoBox = document.querySelector(".photo-box");

    photoBox.innerHTML = `

          <img
            src="${event.target.result}"
            alt="這餐的照片"
          >

        `;
  };

  reader.readAsDataURL(file);
});

// ====================
// 完成這餐
// ====================

completeButton.addEventListener("click", async function () {
  // 防止重複點擊
  if (challengeCompleted || isSubmitting) {
    return;
  }

  isSubmitting = true;

  completeButton.disabled = true;

  completeButton.textContent = "準備中...";

  const veggieTask = document.getElementById("veggie-task");

  const firstBiteTask = document.getElementById("first-bite-task");

  // ====================
  // 計算點數
  // ====================

  let mealPoints = 0;

  if (veggieTask.checked) {
    mealPoints += 2;
  }

  if (firstBiteTask.checked) {
    mealPoints += 1;
  }

  // ====================
  // 必須有照片
  // ====================

  if (!selectedPhoto) {
    alert("先拍下這餐，才能完成打卡喔 📸🥬");

    resetSubmitState();

    return;
  }

  // ====================
  // 至少一個任務
  // ====================

  if (mealPoints === 0) {
    alert("至少完成一個吃菜任務吧 🥬");

    resetSubmitState();

    return;
  }

  // ====================
  // 餐別
  // ====================

  const selectedMeal = document.querySelector(
    'input[name="meal-type"]:checked',
  );

  if (!selectedMeal) {
    alert("選一下這是哪一餐吧 🍽️");

    resetSubmitState();

    return;
  }

  const mealType = selectedMeal.value;

  // ====================
  // 正餐一天一次
  // ====================

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

  // ====================
  // 建立餐點
  // ====================

  const meal = {
    date: mealDate.value,

    time: mealTime.value,

    type: mealType,

    points: mealPoints,

    veggie: veggieTask.checked,

    firstBite: firstBiteTask.checked,

    photoUrl: "",
  };

  // ====================
  // 傳送到 Google
  // ====================

  const sent = await sendMealToCloud(meal);

  if (!sent) {
    resetSubmitState();

    return;
  }

  // ====================
  // 更新日記
  // ====================

  completeButton.textContent = "正在更新日記 ☁️";

  await sleep(1200);

  const cloudSuccess = await loadCloudData();

  if (!cloudSuccess) {
    alert("餐點已經送到雲端，但日記更新失敗。\n重新整理頁面就會出現。");

    resetSubmitState();

    return;
  }

  // ====================
  // 成功訊息
  // ====================

  const mealMessage = document.getElementById("meal-message");

  if (mealMessage) {
    mealMessage.textContent = `這餐完成！ +${mealPoints} 點 🥬❤️`;
  }

  // ====================
  // 如果達成 45 點
  // ====================

  if (totalPoints >= GOAL && !challengeCompleted) {
    await markChallengeCompleted();

    challengeCompleted = true;

    showCompletionScreen();
  }

  // ====================
  // 完成
  // ====================

  isSubmitting = false;

  resetMealForm();

  updatePoints();

  updateChallengeUI();
});

// ====================
// 重置送出狀態
// ====================

function resetSubmitState() {
  isSubmitting = false;

  completeButton.disabled = false;

  completeButton.textContent = "完成這餐";
}

// ====================
// 延遲
// ====================

function sleep(milliseconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

// ====================
// 更新點數
// ====================

function updatePoints() {
  const points = document.getElementById("points");

  const progress = document.getElementById("progress");

  const progressText = document.getElementById("progress-text");

  points.textContent = totalPoints;

  const percentage = Math.min((totalPoints / GOAL) * 100, 100);

  progress.style.width = percentage + "%";

  if (totalPoints >= GOAL) {
    progressText.textContent = "🎉 健康寶寶挑戰完成！";

    if (!challengeCompleted) {
      challengeCompleted = true;

      showCompletionScreen();
    }
  } else {
    progressText.textContent = `距離願望券還有 ${GOAL - totalPoints} 點`;
  }

  updateChallengeUI();
}

// ====================
// 挑戰 UI
// ====================

function updateChallengeUI() {
  if (challengeCompleted) {
    completeButton.disabled = true;

    completeButton.textContent = "挑戰已完成 🎓";

    if (wishStatus) {
      wishStatus.textContent = "🎉 健康寶寶挑戰完成！";
    }
  } else {
    completeButton.disabled = isSubmitting;

    if (!isSubmitting) {
      completeButton.textContent = "完成這餐";
    }

    if (wishStatus) {
      wishStatus.textContent = `集滿 ${GOAL} 點，就可以領取願望券 ❤️`;
    }
  }
}

// ====================
// 完成動畫 / 願望券視窗
// ====================

function showCompletionScreen() {
  const overlay = document.getElementById("completion-overlay");

  if (!overlay) {
    return;
  }

  // 顯示完成視窗
  overlay.classList.remove("hidden");

  // --------------------
  // 找到原本完成視窗內容
  // --------------------

  const content = overlay.querySelector(".completion-content");

  if (!content) {
    return;
  }

  // --------------------
  // 直接把完成視窗改成
  // 「領取願望券」畫面
  // --------------------

  content.innerHTML = `

    <div class="completion-confetti">
      🎉 ✦ 🎉
    </div>


    <div class="completion-icon">
      🥬
    </div>


    <div class="completion-small">
      HEALTHY BABY CHALLENGE
    </div>


    <h1>
      挑戰完成！
    </h1>


    <div class="completion-points">
      45 / 45 POINTS
    </div>


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


      <div
        id="save-wish-message"
        class="save-wish-message"
      >
      </div>

    </div>

  `;

  // --------------------
  // 綁定儲存按鈕
  // --------------------

  const saveButton = document.getElementById("save-wish-button");

  if (saveButton) {
    saveButton.addEventListener("click", saveWishVoucher);
  }
}

// ====================
// 儲存願望券圖片
// ====================

async function saveWishVoucher() {
  const voucher = document.getElementById("wish-voucher");

  const saveButton = document.getElementById("save-wish-button");

  const message = document.getElementById("save-wish-message");

  if (!voucher) {
    return;
  }

  // --------------------
  // 防止重複點擊
  // --------------------

  if (saveButton) {
    saveButton.disabled = true;

    saveButton.textContent = "正在製作願望券 📸";
  }

  try {
    // 確保 html2canvas 已載入
    if (typeof html2canvas !== "function") {
      throw new Error("html2canvas 尚未載入");
    }

    const canvas = await html2canvas(voucher, {
      backgroundColor: "#ffffff",

      scale: 2,

      useCORS: true,

      logging: false,
    });

    const image = canvas.toDataURL("image/png");

    // --------------------
    // 建立下載連結
    // --------------------

    const link = document.createElement("a");

    link.download = "健康寶寶願望券.png";

    link.href = image;

    document.body.appendChild(link);

    link.click();

    link.remove();

    // --------------------
    // 成功
    // --------------------

    if (message) {
      message.textContent = "願望券已經幫妳準備好了 🎟️❤️";
    }

    if (saveButton) {
      saveButton.textContent = "願望券已領取 🎟️";
    }
  } catch (error) {
    console.error("願望券儲存失敗：", error);

    if (message) {
      message.textContent = "圖片製作失敗，請再試一次 😢";
    }

    if (saveButton) {
      saveButton.disabled = false;

      saveButton.textContent = "再試一次 🎟️";
    }
  }
}

// ====================
// 吃菜日記
// ====================

function renderHistory() {
  const history = document.getElementById("meal-history");

  const count = document.getElementById("meal-count");

  count.textContent = `${mealHistory.length} 餐`;

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

      let photoHTML = "";

      if (meal.photoUrl) {
        photoHTML = `

            <div class="history-photo">

              <img
                src="${meal.photoUrl}"
                alt="這餐的照片"
              >

            </div>

          `;
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

          ${photoHTML}

          <div class="history-points">

            +${meal.points} 點

            ${meal.veggie ? "🥬" : ""}

            ${meal.firstBite ? "✨" : ""}

          </div>

        `;

      history.appendChild(item);
    });
}

// ====================
// 重置表單
// ====================

function resetMealForm() {
  document.getElementById("veggie-task").checked = false;

  document.getElementById("first-bite-task").checked = false;

  document
    .querySelectorAll('input[name="meal-type"]')
    .forEach(function (radio) {
      radio.checked = false;
    });

  selectedPhoto = null;

  mealPhoto.value = "";

  const photoBox = document.querySelector(".photo-box");

  photoBox.innerHTML = `

    <div class="photo-content">

      <div class="photo-icon">
        📸
      </div>

      <div>
        拍下這餐
      </div>

      <small>
        有蔬菜就可以打卡！
      </small>

    </div>

  `;

  setCurrentDateTime();

  completeButton.disabled = challengeCompleted;

  completeButton.textContent = challengeCompleted
    ? "挑戰已完成 🎓"
    : "完成這餐";
}

// ====================
// 讀取 Google 雲端
// ====================

async function loadCloudData() {
  try {
    const response = await fetch(API_URL + "?t=" + Date.now());

    const data = await response.json();

    if (!data.success) {
      console.error("☁️ 雲端資料讀取失敗");

      return false;
    }

    challengeCompleted = data.challengeCompleted === true;

    const cloudMeals = data.meals.filter(function (meal) {
      return meal.id === USER_ID;
    });

    mealHistory = cloudMeals.map(function (meal) {
      return {
        date: meal.date,

        time: meal.time,

        type: meal.type,

        points: Number(meal.points),

        veggie: meal.veggie === true || meal.veggie === "TRUE",

        firstBite: meal.firstBite === true || meal.firstBite === "TRUE",

        photoUrl: meal.photoUrl || "",
      };
    });

    totalPoints = mealHistory.reduce(function (total, meal) {
      return total + Number(meal.points);
    }, 0);

    renderHistory();

    updatePoints();

    updateChallengeUI();

    console.log("☁️ 雲端資料同步成功");

    return true;
  } catch (error) {
    console.error("☁️ 無法取得雲端資料：", error);

    return false;
  }
}

// ====================
// 上傳餐點到 Google
// ====================

async function sendMealToCloud(meal) {
  try {
    let photoData = null;

    // ====================
    // 照片壓縮
    // ====================

    if (selectedPhoto) {
      completeButton.textContent = "照片處理中 📸";

      const base64 = await fileToBase64(selectedPhoto);

      photoData = {
        base64: base64,

        fileName: `${meal.date}_${meal.time}_${meal.type}.jpg`,
      };
    }

    // ====================
    // 開始送出
    // ====================

    completeButton.textContent = "正在同步 ☁️";

    await fetch(API_URL, {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify({
        id: USER_ID,

        date: meal.date,

        time: meal.time,

        type: meal.type,

        veggie: meal.veggie,

        firstBite: meal.firstBite,

        points: meal.points,

        photo: photoData,
      }),
    });

    console.log("☁️ 餐點已送出");

    return true;
  } catch (error) {
    console.error("☁️ 餐點送出失敗：", error);

    alert("目前無法連線到雲端，請確認網路後再試一次。");

    return false;
  }
}

// ====================
// File → Base64
// ====================

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

// ====================
// 標記挑戰完成
// ====================

async function markChallengeCompleted() {
  try {
    await fetch(API_URL, {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify({
        action: "completeChallenge",

        id: USER_ID,
      }),
    });

    challengeCompleted = true;

    completeButton.disabled = true;

    console.log("🎓 挑戰完成狀態已送出");

    return true;
  } catch (error) {
    console.error("🎓 挑戰完成同步失敗：", error);

    return false;
  }
}

// ====================
// 初始化
// ====================

async function initializeApp() {
  setCurrentDateTime();

  await loadCloudData();
}

// ====================
// 啟動
// ====================

initializeApp();
