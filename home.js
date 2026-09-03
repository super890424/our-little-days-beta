// ==========================================================
// 🏠 Our Little Days｜首頁里程碑
// ==========================================================

const HOME_API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

const HOME_TOKEN_KEY = "veggie-baby-token";

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
    text: "五十次「今天也想跟你說」。",
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

// ==========================================================
// 取得 Token
// ==========================================================

function getHomeToken() {
  return sessionStorage.getItem(HOME_TOKEN_KEY) || "";
}

// ==========================================================
// 🎟️ 願望券
// ==========================================================

function createHomeWishVoucher() {
  const existing = document.getElementById("wish-voucher");

  if (existing) {
    existing.remove();
  }

  const voucher = document.createElement("div");

  voucher.id = "wish-voucher";

  voucher.className = "wish-voucher";

  voucher.style.position = "fixed";
  voucher.style.left = "-99999px";
  voucher.style.top = "0";
  voucher.style.width = "360px";
  voucher.style.zIndex = "-1";

  voucher.innerHTML = `
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
  `;

  document.body.appendChild(voucher);

  return voucher;
}

async function downloadHomeWishVoucher() {
  const button = document.getElementById("home-wish-download");
  const message = document.getElementById("home-wish-message");

  if (button) {
    button.disabled = true;
    button.textContent = "正在製作願望券 📸";
  }

  try {
    if (typeof html2canvas !== "function") {
      throw new Error("html2canvas 尚未載入");
    }

    const voucher = createHomeWishVoucher();

    const canvas = await html2canvas(voucher, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
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

    // 手機：直接分享
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

      return;
    }

    // 電腦／不支援分享：下載
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
  } catch (error) {
    console.error("首頁願望券下載失敗：", error);

    if (error.name === "AbortError") {
      if (button) {
        button.disabled = false;
        button.textContent = "重新下載願望券 🎟️";
      }

      return;
    }

    if (message) {
      message.textContent = "圖片製作失敗，請再試一次 😢";
    }
  } finally {
    const voucher = document.getElementById("wish-voucher");

    if (voucher) {
      voucher.remove();
    }

    if (button) {
      button.disabled = false;

      if (button.textContent === "正在製作願望券 📸") {
        button.textContent = "重新下載願望券 🎟️";
      }
    }
  }
}

// ==========================================================
// 🏠 首頁摘要
// 一次取得：日記總數＋健康寶寶完成狀態
// ==========================================================

async function loadHomeSummary() {
  const token = getHomeToken();

  if (!token) {
    return;
  }

  try {
    const query = new URLSearchParams();

    query.set("action", "homeSummary");
    query.set("token", token);
    query.set("t", Date.now());

    const response = await fetch(HOME_API_URL + "?" + query.toString());

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (!data.success) {
      console.error("首頁資料讀取失敗：", data.message);

      return;
    }

    // ======================================================
    // 💌 日記總數
    // ======================================================

    const total = Number(data.diaryTotal) || 0;

    renderHomeMilestones(total);

    // ======================================================
    // 🎟️ 健康寶寶完成狀態
    // ======================================================

    const section = document.getElementById("home-wish-voucher");

    const button = document.getElementById("home-wish-download");

    if (data.challengeCompleted === true && section && button) {
      section.classList.remove("hidden");

      button.addEventListener("click", downloadHomeWishVoucher);
    }
  } catch (error) {
    console.error("首頁摘要讀取失敗：", error);
  }
}

// ==========================================================
// 顯示首頁里程碑
// ==========================================================

function renderHomeMilestones(total) {
  const countElement = document.getElementById("home-diary-count");

  const statusElement = document.getElementById("home-diary-status");

  const iconsElement = document.getElementById("home-milestone-icons");

  if (!countElement) {
    return;
  }

  // --------------------------------------------------------
  // 日記總數
  // --------------------------------------------------------

  countElement.textContent = `${total} 篇`;

  // --------------------------------------------------------
  // 小文字
  // --------------------------------------------------------

  if (statusElement) {
    if (total === 0) {
      statusElement.textContent = "我們的小故事，正準備開始。";
    } else if (total === 1) {
      statusElement.textContent = "我們開始一起寫下日子了 ❤️";
    } else {
      statusElement.textContent = `我們已經一起留下 ${total} 個小日子了。`;
    }
  }

  // --------------------------------------------------------
  // 只顯示已達成的里程碑
  // --------------------------------------------------------

  if (!iconsElement) {
    return;
  }

  const achieved = DIARY_MILESTONES.filter(
    (milestone) => total >= milestone.count,
  );

  iconsElement.innerHTML = achieved
    .map(
      (milestone) => `
        <span
          class="home-milestone-achieved-icon"
          title="${milestone.title}"
          aria-label="${milestone.title}"
        >
          ${milestone.icon}
        </span>
      `,
    )
    .join("");

  // --------------------------------------------------------
  // 還沒有任何里程碑
  // --------------------------------------------------------

  if (achieved.length === 0) {
    iconsElement.innerHTML = `
      <span class="home-milestone-empty">
        第一個小日子，等你們一起寫下來。
      </span>
    `;
  }
}

// ==========================================================
// 等待登入
// ==========================================================

function waitForHomeLogin() {
  const loginScreen = document.getElementById("login-screen");

  if (!loginScreen) {
    return;
  }

  // --------------------------------------------------------
  // 已經登入
  // --------------------------------------------------------

  if (getHomeToken()) {
    loadHomeSummary();

    return;
  }

  // --------------------------------------------------------
  // 監看登入畫面
  // --------------------------------------------------------

  const observer = new MutationObserver(function () {
    if (getHomeToken() && loginScreen.classList.contains("hidden")) {
      observer.disconnect();

      loadHomeSummary();
    }
  });

  observer.observe(loginScreen, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // --------------------------------------------------------
  // 保險檢查
  // --------------------------------------------------------

  const timer = setInterval(function () {
    if (getHomeToken() && loginScreen.classList.contains("hidden")) {
      clearInterval(timer);

      observer.disconnect();

      loadHomeSummary();
    }
  }, 500);
}

// ==========================================================
// 啟動
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {
  waitForHomeLogin();
});
