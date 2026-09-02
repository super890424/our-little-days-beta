// ==========================================================
// ✨ Our Little Days｜里程碑
// ==========================================================

const MILESTONE_API_URL =
  "https://script.google.com/macros/s/AKfycbwEJGlmngyKuU571HDdigsJUvqkUk6LsTwLAnIfj0bFah6LrUkdoLELZiRK9vN-GMlU/exec";

const MILESTONE_TOKEN_KEY = "veggie-baby-token";

// ==========================================================
// ✨ 完整里程碑
// ==========================================================

const OUR_DIARY_MILESTONES = [
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

function getMilestoneToken() {
  return sessionStorage.getItem(MILESTONE_TOKEN_KEY) || "";
}

// ==========================================================
// 取得日記總數
// ==========================================================

async function getDiaryTotalForMilestone() {
  const token = getMilestoneToken();

  if (!token) {
    return null;
  }

  const query = new URLSearchParams();

  query.set("action", "diaryIndex");

  query.set("token", token);

  query.set("t", Date.now());

  const response = await fetch(MILESTONE_API_URL + "?" + query.toString());

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "日記資料讀取失敗");
  }

  return Number(data.total) || 0;
}

// ==========================================================
// 顯示「已達成」里程碑
// ==========================================================

function renderAchievedMilestones(total) {
  const container = document.getElementById("diary-achieved-milestones");

  if (!container) {
    return;
  }

  const achieved = OUR_DIARY_MILESTONES.filter(
    (milestone) => total >= milestone.count,
  );

  // --------------------------------------------------------
  // 還沒有任何里程碑
  // --------------------------------------------------------

  if (achieved.length === 0) {
    container.innerHTML = `
      <div class="diary-milestones-empty">
        第一個小日子，<br />
        等著你們一起寫下來。♡
      </div>
    `;

    return;
  }

  // --------------------------------------------------------
  // 只產生已達成的項目
  // --------------------------------------------------------

  container.innerHTML = achieved
    .map(
      (milestone) => `
          <article
            class="diary-achieved-milestone"
          >

            <div
              class="diary-achieved-milestone-icon"
            >
              ${milestone.icon}
            </div>

            <div
              class="diary-achieved-milestone-content"
            >

              <div
                class="diary-achieved-milestone-title"
              >
                ${milestone.title}
              </div>

              <div
                class="diary-achieved-milestone-text"
              >
                ${milestone.text}
              </div>

            </div>

            <div
              class="diary-achieved-milestone-check"
              aria-label="已達成"
            >
              ✓
            </div>

          </article>
        `,
    )
    .join("");
}

// ==========================================================
// 啟動
// ==========================================================

async function initDiaryMilestones() {
  const container = document.getElementById("diary-achieved-milestones");

  if (!container) {
    return;
  }

  try {
    const total = await getDiaryTotalForMilestone();

    if (total === null) {
      container.innerHTML = `
        <div class="diary-milestones-empty">
          請先登入我們的小日子。♡
        </div>
      `;

      return;
    }

    renderAchievedMilestones(total);
  } catch (error) {
    console.error("里程碑讀取失敗：", error);

    container.innerHTML = `
      <div class="diary-milestones-empty">
        暫時讀不到我們的里程碑。
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initDiaryMilestones();
});
