// ====================
// 基本設定
// ====================

const GOAL = 45;

const API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

const USER_ID = "VEGGIE-BABY-001";

// ====================
// 全域狀態
// ====================

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

const wishStatus = document.getElementById("wish-status");

const wishResult = document.getElementById("wish-result");

const mealPointsPreview = document.getElementById("meal-points-preview");

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

if (mealPhoto) {
  mealPhoto.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
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

// ====================
// 計算本餐點數
// ====================

function calculateMealPoints() {
  let points = 0;

  // --------------------
  // 青菜份量
  // --------------------

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

  // --------------------
  // 第一口先吃青菜
  // --------------------

  const firstBiteTask = document.getElementById("first-bite-task");

  if (firstBiteTask && firstBiteTask.checked) {
    points += 1;
  }

  // --------------------
  // 水果
  // --------------------

  const fruitTask = document.getElementById("fruit-task");

  if (fruitTask && fruitTask.checked) {
    points += 1;
  }

  // --------------------
  // 有氧
  // --------------------

  const exerciseTask = document.getElementById("exercise-task");

  if (exerciseTask && exerciseTask.checked) {
    points += 2;
  }

  return points;
}

// ====================
// 更新本餐分數預覽
// ====================

function updateMealPointsPreview() {
  if (!mealPointsPreview) {
    return;
  }

  const points = calculateMealPoints();

  mealPointsPreview.textContent = `這餐可以獲得 +${points} 分 🌱`;
}

// ====================
// 綁定任務變化
// ====================

document
  .querySelectorAll(
    'input[name="veggie-level"], #first-bite-task, #fruit-task, #exercise-task',
  )
  .forEach(function (input) {
    input.addEventListener("change", updateMealPointsPreview);
  });

// ====================
// 完成這餐
// ====================

if (completeButton) {
  completeButton.addEventListener("click", async function () {
    // --------------------
    // 防止重複點擊
    // --------------------

    if (challengeCompleted || isSubmitting) {
      return;
    }

    isSubmitting = true;

    completeButton.disabled = true;

    completeButton.textContent = "準備中...";

    // ====================
    // 計算點數
    // ====================

    const mealPoints = calculateMealPoints();

    if (mealPoints === 0) {
      alert("至少完成一個小任務吧 🥬");

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
    // 任務
    // ====================

    const veggieLevel = document.querySelector(
      'input[name="veggie-level"]:checked',
    );

    const firstBiteTask = document.getElementById("first-bite-task");

    const fruitTask = document.getElementById("fruit-task");

    const exerciseTask = document.getElementById("exercise-task");

    // ====================
    // 建立餐點
    // ====================

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

      photoUrl: "",
    };

    // ====================
    // 傳送到雲端
    // ====================

    const sent = await sendMealToCloud(meal);

    if (!sent) {
      resetSubmitState();

      return;
    }

    // ====================
    // 重新讀取雲端
    // ====================

    completeButton.textContent = "正在更新日記 ☁️";

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
    // 達成 45 點
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
}

// ====================
// 重置送出狀態
// ====================

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

// ====================
// 更新總點數
// ====================

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

// ====================
// 挑戰 UI
// ====================

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

// ====================
// 顯示挑戰完成畫面
// ====================

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

// ====================
// 儲存願望券
// ====================

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
    // ====================
    // 確認 html2canvas
    // ====================

    if (typeof html2canvas !== "function") {
      throw new Error("html2canvas 尚未載入");
    }

    // ====================
    // 產生 Canvas
    // ====================

    const canvas = await html2canvas(voucher, {
      backgroundColor: "#ffffff",

      scale: 2,

      useCORS: true,

      allowTaint: false,

      logging: false,
    });

    // ====================
    // Canvas → Blob
    // ====================

    const blob = await new Promise(function (resolve) {
      canvas.toBlob(function (result) {
        resolve(result);
      }, "image/png");
    });

    if (!blob) {
      throw new Error("無法建立圖片");
    }

    // ====================
    // 建立檔案
    // ====================

    const file = new File([blob], "健康寶寶願望券.png", {
      type: "image/png",
    });

    // ====================
    // 手機支援分享
    // ====================

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

    // ====================
    // 不支援分享
    // 使用 Blob URL 下載
    // ====================

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

    // 使用者取消分享
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

// ====================
// 吃菜日記
// ====================

function renderHistory() {
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


          ${photoHTML}


          <div class="history-points">

            +${meal.points} 點

            ${taskIcons}

          </div>

        `;

      history.appendChild(item);
    });
}

// ====================
// 重置餐點表單
// ====================

function resetMealForm() {
  // --------------------
  // 青菜
  // --------------------

  document
    .querySelectorAll('input[name="veggie-level"]')
    .forEach(function (radio) {
      radio.checked = false;
    });

  // --------------------
  // 第一口
  // --------------------

  const firstBiteTask = document.getElementById("first-bite-task");

  if (firstBiteTask) {
    firstBiteTask.checked = false;
  }

  // --------------------
  // 水果
  // --------------------

  const fruitTask = document.getElementById("fruit-task");

  if (fruitTask) {
    fruitTask.checked = false;
  }

  // --------------------
  // 有氧
  // --------------------

  const exerciseTask = document.getElementById("exercise-task");

  if (exerciseTask) {
    exerciseTask.checked = false;
  }

  // --------------------
  // 餐別
  // --------------------

  document
    .querySelectorAll('input[name="meal-type"]')
    .forEach(function (radio) {
      radio.checked = false;
    });

  // --------------------
  // 照片
  // --------------------

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
          照片不是必要的，有拍就留下來 ❤️
        </small>

      </div>

    `;
  }

  updateMealPointsPreview();

  // --------------------
  // 新時間
  // --------------------

  setCurrentDateTime();

  // --------------------
  // 按鈕
  // --------------------

  if (completeButton) {
    completeButton.disabled = challengeCompleted;

    completeButton.textContent = challengeCompleted
      ? "挑戰已完成 🎓"
      : "完成這餐 🥬";
  }
}

// ====================
// 讀取 Google 雲端
// ====================

async function loadCloudData() {
  try {
    const response = await fetch(API_URL + "?t=" + Date.now());

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("☁️ 雲端資料讀取失敗：", data.message);

      return false;
    }

    // ====================
    // 完成狀態
    // ====================

    challengeCompleted = data.challengeCompleted === true;

    // ====================
    // 餐點
    // ====================

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

        photoUrl: meal.photoUrl || "",
      };
    });

    // ====================
    // 計算總分
    // ====================

    totalPoints = mealHistory.reduce(function (total, meal) {
      return total + Number(meal.points || 0);
    }, 0);

    // ====================
    // 更新畫面
    // ====================

    renderHistory();

    updatePoints();

    updateMealPointsPreview();

    updateChallengeUI();

    // ==================================================
    // ⭐ 重要
    // 如果 Google Sheet 已經記錄 COMPLETED
    // 重新整理後也要重新顯示願望券
    // ==================================================

    if (challengeCompleted) {
      showCompletionScreen();
    }

    console.log("☁️ 雲端資料同步成功");

    return true;
  } catch (error) {
    console.error("☁️ 無法取得雲端資料：", error);

    return false;
  }
}

// ====================
// 上傳餐點
// ====================

async function sendMealToCloud(meal) {
  try {
    let photoData = null;

    // ====================
    // 照片
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
    // 開始同步
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

        veggieLevel: meal.veggieLevel,

        firstBite: meal.firstBite,

        fruit: meal.fruit,

        exercise: meal.exercise,

        points: meal.points,

        photo: photoData,
      }),
    });

    console.log("☁️ 餐點已送出");

    // 給 Apps Script 一點時間寫入
    await sleep(800);

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

    if (completeButton) {
      completeButton.disabled = true;
    }

    console.log("🎓 挑戰完成狀態已送出");

    return true;
  } catch (error) {
    console.error("🎓 挑戰完成同步失敗：", error);

    return false;
  }
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
// 初始化
// ====================

async function initializeApp() {
  setCurrentDateTime();

  updateMealPointsPreview();

  await loadCloudData();
}

// ====================
// 啟動
// ====================

initializeApp();
