/**
 * 🌱 近期心情与能量小打卡 - 核心交互逻辑、双权限体系与跨设备云端数据汇聚
 */

// 1. 题目数据源
const questionsData = [
  {
    id: 1,
    category: "关于开心和爱好",
    icon: "🎨",
    question: "以前你很喜欢做的事情（比如画画、看动漫、玩游戏、吃美食或者和朋友聊天），最近做起来的时候，是不是觉得没那么有意思、提不起劲了？"
  },
  {
    id: 2,
    category: "关于心情的“天气”",
    icon: "🌧️",
    question: "最近心情是不是经常像阴天或下雨一样，觉得闷闷不乐、心里堵得慌，有时候甚至说不清原因就会想哭？"
  },
  {
    id: 3,
    category: "关于小脾气",
    icon: "🔥",
    question: "最近是不是觉得心里很容易烦躁？一点点小事（或者别人说的一句话）就容易让你觉得很烦、想发脾气，但发完脾气又觉得很累？"
  },
  {
    id: 4,
    category: "关于身体的“电量”",
    icon: "⚡",
    question: "哪怕没有做剧烈运动，是不是也经常觉得身体像没电了一样，特别疲惫、懒得动，甚至连洗漱、换衣服都觉得很费劲？"
  },
  {
    id: 5,
    category: "关于睡觉这件事",
    icon: "🌙",
    question: "最近晚上睡觉怎么样？是不是很难睡着、半夜容易醒、经常做梦，或者反过来——白天怎么睡都觉得睡不够？"
  },
  {
    id: 6,
    category: "关于吃饭和胃口",
    icon: "🥣",
    question: "最近的胃口有变化吗？是不是看到平时爱吃的东西也没什么胃口，或者反过来——总想靠狂吃东西来缓解心里的不舒服？"
  },
  {
    id: 7,
    category: "关于大脑的“运转”",
    icon: "🧠",
    question: "在看书、写作业或者听别人说话的时候，是不是觉得脑子像生锈了一样，很难集中注意力，或者常常发呆、忘东忘西？"
  },
  {
    id: 8,
    category: "关于身体的不舒服",
    icon: "🩹",
    question: "最近身体有没有哪里经常不舒服？比如莫名其妙地头疼、肚子疼、胸口发闷或者恶心，但又不像普通的感冒发烧？"
  },
  {
    id: 9,
    category: "关于对自己的看法",
    icon: "🪞",
    question: "最近会不会经常在心里责怪自己？比如觉得自己不够好、什么事都做不好，或者觉得自己让爸爸妈妈、老师失望了？"
  },
  {
    id: 10,
    category: "关于孤独感与求助",
    icon: "🕊️",
    question: "最近会不会觉得周围没有人真正理解你，感觉自己很孤单，甚至偶尔会觉得“如果自己能消失一会儿就好了”？"
  }
];

// 选项配置
const scoreOptions = [
  { score: 0, title: "0分", desc: "完全没有（或者极少这样）" },
  { score: 1, title: "1分", desc: "偶尔有几天这样" },
  { score: 2, title: "2分", desc: "有一半以上的时间都这样" },
  { score: 3, title: "3分", desc: "几乎每天都这样" }
];

// 本地存储键定义
const STORAGE_USER_HISTORY = "psy_test_history_v1";
const STORAGE_ADMIN_RECORDS = "psy_admin_records_v1";
const STORAGE_ADMIN_PWD = "psy_admin_pwd_v1";
const STORAGE_CLOUD_CONFIG = "psy_cloud_config_v1";
const DEFAULT_ADMIN_PWD = "79797"; // 专属管理员隐藏密码
const DEFAULT_PUSHPLUS_TOKEN = "143c6148a4924128a3a85cdef9ed81c8"; // 用户微信推送 Token
const DEFAULT_SUPABASE_URL = "https://nshrxfsceujjvpkysbmm.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_0B3yvBpnoc-KAdxND87RXw_MQywLA9D";

// Supabase 初始化 SQL 脚本（供一键复制建表）
const SUPABASE_SCHEMA_SQL = `-- ========================================================
-- 🌱 心情与能量小打卡 - Supabase 数据表与安全策略初始化
-- ========================================================
create table if not exists public.quiz_records (
    id text primary key,
    name text not null,
    class_group text,
    total_score integer not null,
    battery_level integer default 100,
    status_tag text,
    headline text,
    is_alert boolean default false,
    secret_note text,
    submit_time text,
    answers jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quiz_records enable row level security;

drop policy if exists "允许匿名提交" on public.quiz_records;
create policy "允许匿名提交" on public.quiz_records for insert to anon, authenticated, service_role with check (true);

drop policy if exists "允许读取记录" on public.quiz_records;
create policy "允许读取记录" on public.quiz_records for select to anon, authenticated, service_role using (true);

drop policy if exists "允许删除记录" on public.quiz_records;
create policy "允许删除记录" on public.quiz_records for delete to anon, authenticated, service_role using (true);`;

// 状态管理
const userAnswers = {}; // { questionId: score }
let allAdminRecords = []; // 管理员视角下的全量答卷
let isAdminLoggedIn = false;
let currentBackendUrl = null; // 探测到的后端服务地址
let cloudConfig = {
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseKey: DEFAULT_SUPABASE_KEY,
  pushplusToken: DEFAULT_PUSHPLUS_TOKEN,
  customApiUrl: ""
};

// DOM 元素引用
const questionsContainer = document.getElementById("questionsContainer");
const progressFill = document.getElementById("progressFill");
const answeredCounter = document.getElementById("answeredCounter");
const btnSubmit = document.getElementById("btnSubmit");
const userNameInput = document.getElementById("userName");
const userGroupInput = document.getElementById("userGroup");
const secretNote = document.getElementById("secretNote");
const wordCount = document.getElementById("wordCount");
const btnReset = document.getElementById("btnReset");

// 前台报告弹窗
const resultModal = document.getElementById("resultModal");
const reportCaptureCard = document.getElementById("reportCaptureCard");
const totalScoreEl = document.getElementById("totalScore");
const energyStatusTag = document.getElementById("energyStatusTag");
const energyHeadline = document.getElementById("energyHeadline");
const batteryPercentage = document.getElementById("batteryPercentage");
const batteryMeterFill = document.getElementById("batteryMeterFill");
const reportEvaluation = document.getElementById("reportEvaluation");
const reportSuggestions = document.getElementById("reportSuggestions");
const safeGuardNotice = document.getElementById("safeGuardNotice");
const reportTreeHoleSection = document.getElementById("reportTreeHoleSection");
const reportTreeHoleContent = document.getElementById("reportTreeHoleContent");
const reportDateEl = document.getElementById("reportDate");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnSaveImage = document.getElementById("btnSaveImage");
const btnCopyText = document.getElementById("btnCopyText");

// 普通用户打卡日记抽屉
const historyDrawer = document.getElementById("historyDrawer");
const btnHistory = document.getElementById("btnHistory");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const historyList = document.getElementById("historyList");
const btnClearHistory = document.getElementById("btnClearHistory");

// 管理员工作台相关 DOM
const btnAdmin = document.getElementById("btnAdmin");
const adminLoginModal = document.getElementById("adminLoginModal");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPassword");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const btnAdminLoginCancel = document.getElementById("btnAdminLoginCancel");

const adminDashboardModal = document.getElementById("adminDashboardModal");
const btnCloseDashboard = document.getElementById("btnCloseDashboard");
const btnAdminLogout = document.getElementById("btnAdminLogout");
const btnExportCSV = document.getElementById("btnExportCSV");
const btnOpenChangePwd = document.getElementById("btnOpenChangePwd");
const btnAdminRefresh = document.getElementById("btnAdminRefresh");
const btnClearAllAdminData = document.getElementById("btnClearAllAdminData");

const statTotalCount = document.getElementById("statTotalCount");
const statAvgScore = document.getElementById("statAvgScore");
const statAlertCount = document.getElementById("statAlertCount");
const statNoteCount = document.getElementById("statNoteCount");

const adminSearchInput = document.getElementById("adminSearchInput");
const adminRiskFilter = document.getElementById("adminRiskFilter");
const adminTableBody = document.getElementById("adminTableBody");
const adminEmptyTable = document.getElementById("adminEmptyTable");
const backendStatusDot = document.getElementById("backendStatusDot");
const backendStatusText = document.getElementById("backendStatusText");
const syncBanner = document.getElementById("syncBanner");
const syncBannerText = document.getElementById("syncBannerText");

// 答卷详情弹窗
const adminDetailModal = document.getElementById("adminDetailModal");
const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
const btnCloseDetailBtn = document.getElementById("btnCloseDetailBtn");
const detailRespondentName = document.getElementById("detailRespondentName");
const detailSubmitTime = document.getElementById("detailSubmitTime");
const detailClassGroup = document.getElementById("detailClassGroup");
const detailScore = document.getElementById("detailScore");
const detailRiskTag = document.getElementById("detailRiskTag");
const detailQuestionsList = document.getElementById("detailQuestionsList");
const detailNoteContent = document.getElementById("detailNoteContent");

// 修改密码弹窗
const adminChangePwdModal = document.getElementById("adminChangePwdModal");
const changePwdForm = document.getElementById("changePwdForm");
const oldPasswordInput = document.getElementById("oldPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const btnCancelChangePwd = document.getElementById("btnCancelChangePwd");

// 跨设备云端设置与 Supabase 相关 DOM
const cloudSettingsModal = document.getElementById("cloudSettingsModal");
const btnOpenCloudSync = document.getElementById("btnOpenCloudSync");
const btnCloseCloudModal = document.getElementById("btnCloseCloudModal");
const btnCancelCloudSettings = document.getElementById("btnCancelCloudSettings");
const btnSaveCloudSettings = document.getElementById("btnSaveCloudSettings");
const btnTestPushNotification = document.getElementById("btnTestPushNotification");
const pushplusTokenInput = document.getElementById("pushplusToken");
const supabaseUrlInput = document.getElementById("supabaseUrl");
const supabaseKeyInput = document.getElementById("supabaseKey");
const btnTestSupabase = document.getElementById("btnTestSupabase");
const btnCopySqlModal = document.getElementById("btnCopySqlModal");
const supabaseSetupBanner = document.getElementById("supabaseSetupBanner");
const btnCopySupabaseSql = document.getElementById("btnCopySupabaseSql");
const customApiUrlInput = document.getElementById("customApiUrl");

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  loadCloudConfig();
  renderQuestions();
  bindEvents();
  updateProgress();
  detectBackendServer();
  initSupabase();
});

/**
 * 读取云端设置与管理员凭证自愈
 */
function loadCloudConfig() {
  try {
    // 若本地留存过旧的默认密码 admin123，自动更正为 79797
    const currentStoredPwd = localStorage.getItem(STORAGE_ADMIN_PWD);
    if (!currentStoredPwd || currentStoredPwd === "admin123") {
      localStorage.setItem(STORAGE_ADMIN_PWD, DEFAULT_ADMIN_PWD);
    }

    const saved = localStorage.getItem(STORAGE_CLOUD_CONFIG);
    if (saved) {
      cloudConfig = Object.assign(cloudConfig, JSON.parse(saved));
    }
    // 确保默认启用 Supabase 与微信 Token
    if (!cloudConfig.supabaseUrl) cloudConfig.supabaseUrl = DEFAULT_SUPABASE_URL;
    if (!cloudConfig.supabaseKey) cloudConfig.supabaseKey = DEFAULT_SUPABASE_KEY;
    if (!cloudConfig.pushplusToken) cloudConfig.pushplusToken = DEFAULT_PUSHPLUS_TOKEN;
  } catch (e) {}
}

/**
 * 获取或创建 Supabase Client
 */
let supabaseClient = null;
function getSupabaseClient() {
  const url = (cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).trim();
  const key = (cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();
  if (!url || !key) return null;
  
  if (supabaseClient && supabaseClient._savedUrl === url && supabaseClient._savedKey === key) {
    return supabaseClient;
  }
  
  if (window.supabase && typeof window.supabase.createClient === "function") {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      supabaseClient._savedUrl = url;
      supabaseClient._savedKey = key;
      console.log("Supabase JS SDK 客户端初始化成功");
    } catch (e) {
      console.warn("Supabase 客户端初始化异常:", e);
    }
  }
  return supabaseClient;
}

function initSupabase() {
  getSupabaseClient();
}

/**
 * 渲染全部测试题目
 */
function renderQuestions() {
  questionsContainer.innerHTML = "";
  
  questionsData.forEach((q, index) => {
    const card = document.createElement("section");
    card.className = "card question-card";
    card.id = `qCard_${q.id}`;
    
    card.innerHTML = `
      <div class="card-top-row">
        <span class="q-badge">第 ${index + 1} 题 · ${q.category}</span>
        <span class="q-status-badge" id="qBadge_${q.id}">未选择</span>
      </div>
      <h3 class="question-title">
        <span class="q-icon">${q.icon}</span> ${index + 1}. ${q.category}
      </h3>
      <p class="question-desc">${q.question}</p>
      <div class="options-grid">
        ${scoreOptions.map(opt => `
          <button type="button" 
                  class="option-btn" 
                  data-qid="${q.id}" 
                  data-score="${opt.score}"
                  aria-label="${opt.title}：${opt.desc}">
            <span class="option-indicator">${opt.score}</span>
            <div class="option-content">
              <span class="option-score-title">${opt.title}</span>
              <span class="option-score-desc">${opt.desc}</span>
            </div>
          </button>
        `).join("")}
      </div>
    `;

    questionsContainer.appendChild(card);
  });
}

/**
 * 事件绑定
 */
function bindEvents() {
  // 点击题目选项
  questionsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;

    const qid = parseInt(btn.dataset.qid, 10);
    const score = parseInt(btn.dataset.score, 10);
    handleOptionSelect(qid, score, btn);
  });

  // 树洞输入字数统计
  secretNote.addEventListener("input", () => {
    wordCount.textContent = secretNote.value.length;
  });

  // 提交测评（普通受测者）
  btnSubmit.addEventListener("click", handleSubmit);

  // 清空重置
  btnReset.addEventListener("click", handleReset);

  // 前台结果报告模态框关闭
  btnCloseModal.addEventListener("click", () => {
    resultModal.style.display = "none";
    document.body.style.overflow = "auto";
  });
  resultModal.addEventListener("click", (e) => {
    if (e.target === resultModal) {
      resultModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });

  // 保存图片海报 & 复制文字
  btnSaveImage.addEventListener("click", handleSavePoster);
  btnCopyText.addEventListener("click", handleCopyReportText);

  // 普通用户历史打卡日记
  btnHistory.addEventListener("click", openHistoryDrawer);
  btnCloseDrawer.addEventListener("click", () => historyDrawer.style.display = "none");
  historyDrawer.addEventListener("click", (e) => {
    if (e.target === historyDrawer) historyDrawer.style.display = "none";
  });
  btnClearHistory.addEventListener("click", handleClearUserHistory);

  // ================= 管理员权限事件 =================
  btnAdmin.addEventListener("click", handleOpenAdmin);
  adminLoginForm.addEventListener("submit", handleAdminLoginSubmit);
  btnAdminLoginCancel.addEventListener("click", () => adminLoginModal.style.display = "none");

  btnCloseDashboard.addEventListener("click", () => adminDashboardModal.style.display = "none");
  btnAdminLogout.addEventListener("click", handleAdminLogout);
  btnExportCSV.addEventListener("click", handleExportCSV);
  btnAdminRefresh.addEventListener("click", refreshAdminData);
  btnClearAllAdminData.addEventListener("click", handleClearAllAdminRecords);

  adminSearchInput.addEventListener("input", filterAndRenderAdminTable);
  adminRiskFilter.addEventListener("change", filterAndRenderAdminTable);

  // 答卷详情弹窗
  btnCloseDetailModal.addEventListener("click", () => adminDetailModal.style.display = "none");
  btnCloseDetailBtn.addEventListener("click", () => adminDetailModal.style.display = "none");

  // 修改密码
  btnOpenChangePwd.addEventListener("click", () => {
    adminChangePwdModal.style.display = "flex";
    oldPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  });
  btnCancelChangePwd.addEventListener("click", () => adminChangePwdModal.style.display = "none");
  changePwdForm.addEventListener("submit", handleChangePasswordSubmit);

  // 跨设备云端设置弹窗
  btnOpenCloudSync.addEventListener("click", openCloudSettingsModal);
  btnCloseCloudModal.addEventListener("click", () => cloudSettingsModal.style.display = "none");
  btnCancelCloudSettings.addEventListener("click", () => cloudSettingsModal.style.display = "none");
  btnSaveCloudSettings.addEventListener("click", saveCloudSettings);
  btnTestPushNotification.addEventListener("click", testPushNotification);

  if (btnCopySupabaseSql) {
    btnCopySupabaseSql.addEventListener("click", copySupabaseSqlToClipboard);
  }
  if (btnCopySqlModal) {
    btnCopySqlModal.addEventListener("click", copySupabaseSqlToClipboard);
  }
  if (btnTestSupabase) {
    btnTestSupabase.addEventListener("click", testSupabaseConnection);
  }
}

/**
 * 探测独立后端服务 (Python server.py 或 Supabase 状态)
 */
async function detectBackendServer() {
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (cloudConfig.customApiUrl) {
    try {
      const target = `${cloudConfig.customApiUrl.replace(/\/+$/, "")}/api/health`;
      const res = await fetch(target, { method: "GET", signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        currentBackendUrl = cloudConfig.customApiUrl;
        updateBackendStatusBadge("server");
        return;
      }
    } catch (err) {}
  } else if (isLocalHost) {
    try {
      const res = await fetch("http://localhost:8080/api/health", { method: "GET", signal: AbortSignal.timeout(800) });
      if (res.ok) {
        currentBackendUrl = "http://localhost:8080";
        updateBackendStatusBadge("server");
        return;
      }
    } catch (err) {}
  }

  if (cloudConfig.supabaseUrl) {
    updateBackendStatusBadge("supabase");
  } else if (cloudConfig.pushplusToken) {
    updateBackendStatusBadge("wechat");
  } else {
    updateBackendStatusBadge("local");
  }
}

function updateBackendStatusBadge(mode, customText) {
  if (mode === "supabase") {
    backendStatusDot.className = "status-dot dot-green";
    backendStatusText.textContent = customText || "Supabase 全球云端数据库已连接";
    syncBannerText.innerHTML = "☁️ <strong>云端实时同步已激活</strong>：任何人在任何设备/手机上打卡完成，数据将全自动同步至 Supabase 云数据库，点击下方「刷新」即可实时查看！";
  } else if (mode === "server") {
    backendStatusDot.className = "status-dot dot-green";
    backendStatusText.textContent = "已连接独立服务器 (实时 SQLite 数据库)";
    syncBannerText.innerHTML = "🟢 <strong>自建服务器已连接</strong>：所有答卷正实时同步至你的 SQLite 数据库。";
  } else if (mode === "wechat") {
    backendStatusDot.className = "status-dot dot-green";
    backendStatusText.textContent = "已绑定微信实时提醒 (PushPlus)";
    syncBannerText.innerHTML = "📱 <strong>微信推送已就绪</strong>：任何人在手机上提交答卷，你的个人微信将第一时间弹出通知！";
  } else {
    backendStatusDot.className = "status-dot dot-blue";
    backendStatusText.textContent = "单机本地模式 (未配置跨设备云端)";
    syncBannerText.innerHTML = "💡 <strong>跨设备提醒</strong>：若想在手机微信收到答卷，或在后台查看所有人记录，请点击上方 <strong>「⚙️ 云端数据库/同步配置」</strong> 查看！";
  }
}


/**
 * 处理选项被选择
 */
function handleOptionSelect(qid, score, targetBtn) {
  userAnswers[qid] = score;

  const parentCard = document.getElementById(`qCard_${qid}`);
  const buttons = parentCard.querySelectorAll(".option-btn");
  buttons.forEach(b => b.classList.remove("selected"));
  targetBtn.classList.add("selected");

  const badge = document.getElementById(`qBadge_${qid}`);
  if (badge) {
    badge.textContent = `已选 ${score}分 ✓`;
    badge.classList.add("done");
  }
  parentCard.classList.add("answered");

  updateProgress();

  const nextUnanswered = questionsData.find(q => userAnswers[q.id] === undefined);
  if (nextUnanswered && nextUnanswered.id > qid) {
    setTimeout(() => {
      const nextCard = document.getElementById(`qCard_${nextUnanswered.id}`);
      if (nextCard) {
        nextCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 280);
  } else if (Object.keys(userAnswers).length === questionsData.length) {
    setTimeout(() => {
      document.getElementById("cardTreeHole").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 320);
  }
}

/**
 * 更新顶部答题进度指示
 */
function updateProgress() {
  const answeredCount = Object.keys(userAnswers).length;
  const total = questionsData.length;
  const percent = Math.round((answeredCount / total) * 100);

  progressFill.style.width = `${percent}%`;
  answeredCounter.innerHTML = `已完成：<strong>${answeredCount}</strong> / ${total} 题`;
}

/**
 * 普通用户提交答卷
 */
async function handleSubmit() {
  const unanswered = questionsData.filter(q => userAnswers[q.id] === undefined);

  if (unanswered.length > 0) {
    const firstUnanswered = unanswered[0];
    const targetCard = document.getElementById(`qCard_${firstUnanswered.id}`);
    
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    targetCard.style.outline = "2px dashed #E76F51";
    setTimeout(() => {
      targetCard.style.outline = "none";
    }, 1800);

    alert(`亲爱的宝贝，第 ${firstUnanswered.id} 题还没有选择哦～\n再耐心选一个最符合的描述吧！🌱`);
    return;
  }

  // 计算总分
  let totalScore = 0;
  for (let i = 1; i <= questionsData.length; i++) {
    totalScore += userAnswers[i];
  }

  const respondentName = userNameInput.value.trim() || "神秘小天使";
  const respondentGroup = userGroupInput.value.trim() || "未填写";
  const secret = secretNote.value.trim();

  const gradeData = calculateGrade(totalScore);

  const now = new Date();
  const formatTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const isAlert = totalScore >= 15 || (userAnswers[10] || 0) >= 2;

  const newRecord = {
    id: "rec_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: respondentName,
    group: respondentGroup,
    answers: { ...userAnswers },
    totalScore: totalScore,
    batteryLevel: gradeData.batteryLevel,
    statusTag: gradeData.tag,
    headline: gradeData.headline,
    gradeKey: gradeData.key,
    isAlert: isAlert,
    secretNote: secret,
    submitTime: formatTime,
    timestamp: Date.now()
  };

  // 1. 本地存储保底
  saveToAdminPool(newRecord);

  // 2. 跨网络多通道云端分发（自动同步至 Supabase 云数据库）
  await dispatchRecordToCloud(newRecord);

  // 3. 用户个人日记
  saveUserHistoryRecord(totalScore, gradeData.headline, formatTime);

  // 4. 显示受测者报告
  displayReport(newRecord, gradeData);
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}

/**
 * 评分算法
 */
function calculateGrade(score) {
  if (score <= 4) {
    const batteryLevel = 95 - score * 3;
    return {
      key: "green",
      batteryLevel,
      tag: "能量满格 · 阳光充沛 🌱",
      headline: "☀️ 阳光充沛的小树苗",
      meterColor: "linear-gradient(90deg, #52B788, #40916C)",
      eval: "亲爱的宝贝，你现在的心理状态就像沐浴在阳光下的小树苗一样，内心充满了向上的活力和光亮！在近两周的生活里，你有着较好的情绪调节能力。即使遇到一些小烦恼，你也能积极应对。请继续拥抱这份好状态，去感受每天阳光晒在身上的温暖吧～",
      suggestions: [
        "继续保持规律作息和健康的饮食习惯，充足睡眠是好心情的最佳底色。",
        "常常做自己喜欢的事情（画画、运动、听歌、做手工），让快乐的小火苗一直燃烧。",
        "如果身边的朋友有时心情低落，可以用你的温柔和笑容给他们传递一点温暖哦。"
      ]
    };
  } else if (score <= 9) {
    const batteryLevel = 80 - (score - 4) * 4;
    return {
      key: "light",
      batteryLevel,
      tag: "轻度耗电 · 偶遇微风 ⛅",
      headline: "⛅ 偶遇微风云朵的小草",
      meterColor: "linear-gradient(90deg, #74C69D, #52B788)",
      eval: "宝贝，最近这14天里，你可能稍微感到了一点点疲惫或者偶尔的小烦心，就像手机电池用到了70%左右。在学习或和别人相处中，有一点点小波折是非常正常的现象。不需要责怪自己，这只是身体和心里在悄悄提醒你：该适当喘口气、休息一下啦。",
      suggestions: [
        "给自己安排一个‘充电周末’，少一点手机刷屏，多到户外公园走走，看看绿色植物。",
        "睡前放下烦恼，喝一杯温牛奶，听听轻柔的音乐，帮助身体充分放松。",
        "遇到觉得烦躁的时刻，试着深吸一口气默数5个数，给自己一个暂停键。"
      ]
    };
  } else if (score <= 14) {
    const batteryLevel = 55 - (score - 9) * 5;
    return {
      key: "orange",
      batteryLevel,
      tag: "蓄电池告警 · 需要充能 🔋",
      headline: "🔋 呼叫关怀与休整的蓄电池",
      meterColor: "linear-gradient(90deg, #F4A261, #E76F51)",
      eval: "亲爱的宝贝，紧紧抱抱你！最近两周，你可能承受了比平时更多的压力与疲惫，心里像装了一块沉甸甸的小石头，做事情提不起劲，甚至偶尔觉得委屈想哭。请千万记得：感到累、烦恼或脆弱并不是你的过错，这是你的小心灵在勇敢地向你发出求助信号。",
      suggestions: [
        "允许自己今天‘不必做到100分’，把紧绷的心弦稍微放松一些。",
        "勇敢向信任的爸爸妈妈或好朋友说出你的累：‘我最近有点不舒服，可以陪我聊聊天或抱抱我吗？’",
        "在便签纸或刚才的小树洞里把心里难过的事情一件件写出来，然后告诉自己：‘天大的事，我们一件件慢慢来。’"
      ]
    };
  } else {
    const batteryLevel = Math.max(15, 30 - (score - 15) * 2);
    return {
      key: "red",
      batteryLevel,
      tag: "亟待守护 · 渴望拥抱 🫂",
      headline: "🫂 特别需要被爱与守护的小天使",
      meterColor: "linear-gradient(90deg, #E76F51, #C53030)",
      eval: "亲爱的宝贝，看着你此刻的打卡，真的非常心疼你。这段时间的你，一定默默承受了许多委屈、辛苦和难熬的时刻。也许周围有人不理解你，甚至让你觉得自己不够好。请你看着镜子对自己说：‘我依然是一个珍贵又可爱的宝贝。’ 难关总会过去的，你不需要独自承担这所有的重量。",
      suggestions: [
        "**千万不要把难过藏在心底**：今天就试着向身边的爸爸妈妈、老师或学校心理辅导室的老师寻求帮助，把这份测评结果拿给他们看。",
        "如果有身体常常不舒服（头疼、胃痛、胸口闷）或整夜睡不着，让爸爸妈妈带你去医院做个健康与心理检查，就像给小电瓶做个专业的保养。",
        "在任何感到无助绝望的时刻，随时拨打免费的青少年心理援助热线，有温柔的哥哥姐姐一直在电话那头守护你。"
      ]
    };
  }
}

/**
 * 渲染结果报告
 */
function displayReport(record, gradeData) {
  reportDateEl.textContent = `${record.name} 的能量守护单 · ${record.submitTime}`;

  animateScoreCounter(record.totalScore);

  energyStatusTag.textContent = gradeData.tag;
  energyHeadline.textContent = gradeData.headline;
  batteryPercentage.textContent = `${gradeData.batteryLevel}%`;
  batteryMeterFill.style.width = `${gradeData.batteryLevel}%`;
  batteryMeterFill.style.background = gradeData.meterColor;
  reportEvaluation.textContent = gradeData.eval;

  reportSuggestions.innerHTML = gradeData.suggestions
    .map(s => `<li><span>${s}</span></li>`)
    .join("");

  if (record.isAlert) {
    safeGuardNotice.style.display = "flex";
  } else {
    safeGuardNotice.style.display = "none";
  }

  if (record.secretNote) {
    reportTreeHoleSection.style.display = "block";
    reportTreeHoleContent.textContent = record.secretNote;
  } else {
    reportTreeHoleSection.style.display = "none";
  }

  resultModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/**
 * 存入管理员本地全量数据池
 */
function saveToAdminPool(record) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_ADMIN_RECORDS) || "[]");
    list.unshift(record);
    localStorage.setItem(STORAGE_ADMIN_RECORDS, JSON.stringify(list));
  } catch (err) {
    console.error("写入后台本地数据池失败", err);
  }
}

/**
 * 跨网络多通道分发（全网答卷实时自动同步至 Supabase 云数据库）
 */
async function dispatchRecordToCloud(record) {
  // 1. Supabase 全球云端数据库（全网首选主存储）
  try {
    await saveRecordToSupabase(record);
  } catch (err) {
    console.warn("Supabase 同步处理异常:", err);
  }

  // 2. 微信实时推送 (PushPlus，选填通道，安全静默捕获异常)
  if (cloudConfig.pushplusToken) {
    try {
      sendWechatNotification(record);
    } catch (e) {
      console.warn("微信推送捕获异常:", e);
    }
  }

  // 3. 自建独立服务器 (选填通道)
  const backendTarget = currentBackendUrl || cloudConfig.customApiUrl;
  if (backendTarget) {
    try {
      await fetch(`${backendTarget.replace(/\/+$/, "")}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      console.log("已实时同步至自建服务器 SQLite 数据库");
    } catch (err) {}
  }
}

/**
 * 将答卷实时写入 Supabase 云端数据库
 */
async function saveRecordToSupabase(record) {
  const url = (cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "");
  const key = (cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();
  if (!url || !key) return false;

  const payload = {
    id: record.id,
    name: record.name,
    class_group: record.group,
    total_score: record.totalScore,
    battery_level: record.batteryLevel || 100,
    status_tag: record.statusTag,
    headline: record.headline,
    is_alert: Boolean(record.isAlert),
    secret_note: record.secretNote || "",
    submit_time: record.submitTime,
    answers: record.answers
  };

  // 方式一：官方 Supabase JS SDK
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from("quiz_records").insert([payload]);
      if (!error) {
        console.log("✅ 成功通过 Supabase JS SDK 写入云端数据库");
        return true;
      }
      console.warn("Supabase SDK 写入提示:", error.message || error);
    } catch (err) {
      console.warn("Supabase SDK 写入捕获异常:", err);
    }
  }

  // 方式二：原生 REST API 保底
  try {
    const res = await fetch(`${url}/rest/v1/quiz_records`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify([payload])
    });
    if (res.ok) {
      console.log("✅ 成功通过 Supabase REST API 写入云端数据库");
      return true;
    } else {
      const txt = await res.text();
      console.warn("Supabase REST 接口返回状态:", res.status, txt);
    }
  } catch (err) {
    console.warn("Supabase REST 请求失败:", err);
  }
  return false;
}

/**
 * 从 Supabase 查询所有答卷记录
 */
async function fetchRecordsFromSupabase() {
  const url = (cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "");
  const key = (cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();
  if (!url || !key) return { records: null, error: "未配置 Supabase" };

  // 方式一：官方 Supabase JS SDK
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from("quiz_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        return { records: mapSupabaseRecords(data), error: null };
      }
      if (error) {
        return { records: null, error: error };
      }
    } catch (err) {
      console.warn("Supabase SDK 查询异常:", err);
    }
  }

  // 方式二：原生 REST API 保底
  try {
    const res = await fetch(`${url}/rest/v1/quiz_records?select=*&order=created_at.desc`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return { records: mapSupabaseRecords(data), error: null };
    } else {
      const errJson = await res.json().catch(() => ({}));
      return { records: null, error: errJson };
    }
  } catch (err) {
    return { records: null, error: err };
  }
}

/**
 * 从 Supabase 删除单条记录
 */
async function deleteRecordFromSupabase(recordId) {
  const url = (cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "");
  const key = (cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();
  if (!url || !key) return;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from("quiz_records").delete().eq("id", recordId);
      if (!error) return;
    } catch (e) {}
  }

  try {
    await fetch(`${url}/rest/v1/quiz_records?id=eq.${encodeURIComponent(recordId)}`, {
      method: "DELETE",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
  } catch (e) {}
}

/**
 * 从 Supabase 清空全部记录
 */
async function clearAllRecordsFromSupabase() {
  const url = (cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "");
  const key = (cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();
  if (!url || !key) return;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from("quiz_records").delete().neq("id", "___none___");
      if (!error) return;
    } catch (e) {}
  }

  try {
    await fetch(`${url}/rest/v1/quiz_records?id=not.is.null`, {
      method: "DELETE",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
  } catch (e) {}
}

/**
 * 数据字段统一映射规范
 */
function mapSupabaseRecords(data) {
  if (!Array.isArray(data)) return [];
  return data.map(r => ({
    id: r.id,
    name: r.name || "神秘小天使",
    group: r.class_group || r.group || "未填写",
    totalScore: r.total_score !== undefined ? r.total_score : 0,
    batteryLevel: r.battery_level !== undefined ? r.battery_level : 100,
    statusTag: r.status_tag || "评测完成",
    headline: r.headline || "",
    isAlert: Boolean(r.is_alert),
    secretNote: r.secret_note || "",
    submitTime: r.submit_time || "",
    answers: r.answers || {}
  }));
}

/**
 * 复制建表 SQL 脚本到剪贴板
 */
function copySupabaseSqlToClipboard() {
  navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL).then(() => {
    alert("✅ 建表 SQL 已成功复制到剪贴板！\n\n请在 Supabase 控制台的 SQL Editor 中粘贴并点击绿色的“Run”按钮执行即可！🚀");
  }).catch(() => {
    prompt("请全选复制以下 SQL 语句：", SUPABASE_SCHEMA_SQL);
  });
}

/**
 * 测试 Supabase 云端连接与表状态
 */
async function testSupabaseConnection() {
  btnTestSupabase.disabled = true;
  btnTestSupabase.textContent = "⏳ 正在测试连接...";
  try {
    const url = (supabaseUrlInput.value.trim() || cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL).replace(/\/+$/, "");
    const key = (supabaseKeyInput.value.trim() || cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY).trim();

    const res = await fetch(`${url}/rest/v1/quiz_records?select=count&limit=1`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });

    if (res.ok) {
      alert("🎉 恭喜！Supabase 云数据库连接成功，且 quiz_records 数据表已就绪！\n所有受测者的答卷都会自动写入云端，管理后台支持跨设备实时查看与导出。");
    } else {
      const errText = await res.text();
      if (errText.includes("PGRST205") || errText.includes("does not exist") || errText.includes("schema cache")) {
        alert("⚠️ Supabase 项目连接正常，但数据表 quiz_records 尚未建立！\n请点击【复制建表 SQL】按钮，在 Supabase SQL Editor 中运行一次即可启用！");
      } else {
        alert(`连接响应状态 (HTTP ${res.status})：${errText}`);
      }
    }
  } catch (err) {
    alert(`连接失败：${err.message || err}\n请检查网络连接或 Supabase URL。`);
  } finally {
    btnTestSupabase.disabled = false;
    btnTestSupabase.textContent = "🔍 测试云端连接";
  }
}

/**
 * 核心：通过隐藏表单跨域中继 PushPlus（天然免疫所有浏览器 CORS 跨域拦截）
 */
function sendPushPlusForm(token, title, content) {
  try {
    let iframe = document.getElementById("pushplus_bridge_frame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "pushplus_bridge_frame";
      iframe.name = "pushplus_bridge_frame";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.pushplus.plus/send";
    form.target = "pushplus_bridge_frame";
    form.style.display = "none";

    const params = {
      token: token,
      title: title,
      content: content,
      template: "html"
    };

    for (const key in params) {
      const input = document.createElement("textarea");
      input.name = key;
      input.value = params[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      form.remove();
    }, 2000);

    return true;
  } catch (err) {
    console.error("跨域推送提交异常:", err);
    return false;
  }
}

/**
 * 发送 PushPlus 微信通知
 */
function sendWechatNotification(record) {
  const token = (cloudConfig.pushplusToken || DEFAULT_PUSHPLUS_TOKEN).trim();
  if (!token) return;

  const alertBadge = record.isAlert ? "🚨【重点关爱预警】" : "🌿【心理打卡】";
  const title = `${alertBadge} ${record.name} 的测评报告 (${record.totalScore}分)`;

  // 10道题得分明细
  let questionsDetailHtml = "";
  if (record.answers) {
    questionsDetailHtml = `
      <p style="margin-top:10px; margin-bottom:4px;"><strong>📋 10项身心电量答题明细：</strong></p>
      <ul style="padding-left:18px; font-size:13px; color:#444; line-height:1.7;">
        ${questionsData.map(q => {
          const s = record.answers[q.id] !== undefined ? record.answers[q.id] : "-";
          const desc = scoreOptions.find(o => o.score === s)?.desc || "";
          const color = s >= 2 ? '#C53030' : '#2D6A4F';
          return `<li>${q.category}：<strong style="color:${color};">${s}分</strong> <span style="color:#777;">(${desc})</span></li>`;
        }).join("")}
      </ul>
      <hr style="border:none; border-top:1px dashed #CBD5E1; margin:12px 0;" />
    `;
  }

  // 组装格式化富文本
  let content = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; color:#2D3748;">
      <h3 style="color:${record.isAlert ? '#C53030' : '#2D6A4F'}; margin-top:0;">🌱 近期心情与能量小打卡新答卷</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:14px;">
        <tr><td style="padding:4px 0; width:90px; color:#718096;"><strong>打卡人：</strong></td><td>${record.name} (${record.group})</td></tr>
        <tr><td style="padding:4px 0; color:#718096;"><strong>打卡时间：</strong></td><td>${record.submitTime}</td></tr>
        <tr><td style="padding:4px 0; color:#718096;"><strong>身心总得分：</strong></td><td><span style="font-size:20px; color:${record.isAlert ? '#C53030' : '#2D6A4F'}; font-weight:bold;">${record.totalScore}</span> / 30分</td></tr>
        <tr><td style="padding:4px 0; color:#718096;"><strong>状态评估：</strong></td><td><strong>${record.statusTag}</strong> (${record.headline})</td></tr>
        <tr><td style="padding:4px 0; color:#718096;"><strong>重点预警：</strong></td><td>${record.isAlert ? '<span style="color:#C53030; font-weight:bold; background:#FED7D7; padding:2px 8px; border-radius:4px;">🚨 触发重点关爱预警 (建议及时沟通)</span>' : '<span style="color:#2D6A4F;">正常</span>'}</td></tr>
      </table>
      <hr style="border:none; border-top:1px dashed #CBD5E1; margin:12px 0;" />
      ${questionsDetailHtml}
      <div style="background:#FFFDF9; border:1px solid #EAD8C0; border-radius:8px; padding:12px; margin-top:8px;">
        <strong style="color:#5D4037;">💬 树洞悄悄话：</strong><br/>
        <p style="margin:6px 0 0; color:#4A5568; font-style:italic; white-space:pre-wrap;">${record.secretNote ? record.secretNote : '（受测者未填写悄悄话）'}</p>
      </div>
      <p style="font-size:12px; color:#A0AEC0; text-align:center; margin-top:16px;">* 来自【🌱 近期心情与能量小打卡】实时推送系统</p>
    </div>
  `;

  sendPushPlusForm(token, title, content);
}

/**
 * 普通用户个人历史保存
 */
function saveUserHistoryRecord(score, headline, dateStr) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_USER_HISTORY) || "[]");
    list.unshift({
      id: Date.now(),
      date: dateStr,
      score,
      headline
    });
    localStorage.setItem(STORAGE_USER_HISTORY, JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}

/**
 * 数字动效
 */
function animateScoreCounter(target) {
  let current = 0;
  const duration = 500;
  const stepTime = Math.max(20, Math.floor(duration / (target + 1)));

  totalScoreEl.textContent = "0";
  const timer = setInterval(() => {
    current++;
    totalScoreEl.textContent = current;
    if (current >= target) {
      clearInterval(timer);
      totalScoreEl.textContent = target;
    }
  }, stepTime);
}

/**
 * 清空重做（普通用户）
 */
function handleReset() {
  if (Object.keys(userAnswers).length === 0 && !userNameInput.value && !secretNote.value) return;
  if (!confirm("确定要清空当前的已选内容，重新开始打卡吗？🌱")) return;

  for (let key in userAnswers) {
    delete userAnswers[key];
  }

  document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
  document.querySelectorAll(".question-card").forEach(c => c.classList.remove("answered"));
  document.querySelectorAll(".q-status-badge").forEach(b => {
    b.textContent = "未选择";
    b.classList.remove("done");
  });

  userNameInput.value = "";
  userGroupInput.value = "";
  secretNote.value = "";
  wordCount.textContent = "0";
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * 打开普通用户打卡日记
 */
function openHistoryDrawer() {
  historyDrawer.style.display = "flex";
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_USER_HISTORY) || "[]");
  } catch (e) {
    list = [];
  }

  if (list.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        🌱 还没有你的打卡记录哦，<br>完成一次测试后就会记录在这里啦～
      </div>
    `;
    return;
  }

  historyList.innerHTML = list.map(item => `
    <div class="history-item">
      <div class="history-info">
        <span class="history-date">${item.date}</span>
        <span class="history-tag">${item.headline}</span>
      </div>
      <div class="history-score">${item.score} <small style="font-size: 0.7rem; color: #888;">分</small></div>
    </div>
  `).join("");
}

function handleClearUserHistory() {
  if (!confirm("确定要清空你的打卡记录日记吗？")) return;
  localStorage.removeItem(STORAGE_USER_HISTORY);
  openHistoryDrawer();
}

/**
 * 复制文字总结报告
 */
function handleCopyReportText() {
  const score = totalScoreEl.textContent;
  const tag = energyStatusTag.textContent;
  const headline = energyHeadline.textContent;
  const evalText = reportEvaluation.textContent;
  const date = reportDateEl.textContent;
  const secret = secretNote.value.trim();

  let text = `【🌱 心情与能量小打卡报告 · ${date}】\n`;
  text += `心理电量总分：${score} / 30 分\n`;
  text += `状态定位：${tag} (${headline})\n\n`;
  text += `💌 写给宝贝的心语：\n${evalText}\n\n`;
  
  if ((userAnswers[10] || 0) >= 2) {
    text += `⚠️ 特别关爱提示：检测到较强孤独感，推荐拨打青少年热线 12355 获得帮助。\n\n`;
  }

  if (secret) {
    text += `💬 树洞悄悄话：\n"${secret}"\n\n`;
  }
  text += `✨ 打卡完成啦！谢谢你诚实面对自己，给勇敢的自己一个大大的拥抱！✨`;

  navigator.clipboard.writeText(text).then(() => {
    alert("报告文字已成功复制到剪贴板！📋\n你可以把它直接粘贴发给爸爸妈妈、老师或朋友哦。");
  }).catch(() => {
    alert("复制失败，请手动截屏或全选复制。");
  });
}

/**
 * 保存结果海报
 */
function handleSavePoster() {
  const btn = btnSaveImage;
  const originalText = btn.innerHTML;
  btn.innerHTML = "<span>⏳ 正在生成海报...</span>";
  btn.disabled = true;

  if (typeof html2canvas === "undefined") {
    alert("海报生成组件正在加载中，请稍候片刻或直接点击‘复制文字’与截屏保存哦！");
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  html2canvas(reportCaptureCard, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    logging: false
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = `心情与能量小打卡_${reportDateEl.textContent}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    btn.innerHTML = originalText;
    btn.disabled = false;
  }).catch(err => {
    console.error("生成海报异常", err);
    alert("海报生成遇到了小问题，可以直接截屏或使用‘复制文字’功能哦～");
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}

// ============================================================
// 🔐 管理员权限与后台数据管理系统
// ============================================================

/**
 * 点击导航栏管理员按钮
 */
function handleOpenAdmin() {
  if (isAdminLoggedIn) {
    openAdminDashboard();
  } else {
    adminLoginModal.style.display = "flex";
    adminPasswordInput.value = "";
    loginErrorMsg.style.display = "none";
    setTimeout(() => adminPasswordInput.focus(), 150);
  }
}

/**
 * 校验管理员登录
 */
function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const inputPwd = adminPasswordInput.value.trim();
  const storedPwd = localStorage.getItem(STORAGE_ADMIN_PWD) || DEFAULT_ADMIN_PWD;

  if (inputPwd === storedPwd) {
    isAdminLoggedIn = true;
    adminLoginModal.style.display = "none";
    loginErrorMsg.style.display = "none";
    openAdminDashboard();
  } else {
    loginErrorMsg.style.display = "block";
    loginErrorMsg.textContent = "密码错误，请重新输入！";
    adminPasswordInput.focus();
  }
}

/**
 * 登出管理员
 */
function handleAdminLogout() {
  isAdminLoggedIn = false;
  adminDashboardModal.style.display = "none";
  alert("管理员已安全退出登录。");
}

/**
 * 打开管理员后台大屏
 */
async function openAdminDashboard() {
  adminDashboardModal.style.display = "flex";
  await refreshAdminData();
}

/**
 * 刷新后台数据（优先从 Supabase 全球云端数据库抓取，支持自建 API 与本地回退）
 */
async function refreshAdminData() {
  let records = [];
  let isSupabaseSuccess = false;

  // 1. 尝试从 Supabase 全球云端抓取
  try {
    const supabaseRes = await fetchRecordsFromSupabase();
    if (supabaseRes && supabaseRes.records !== null) {
      records = supabaseRes.records;
      isSupabaseSuccess = true;
      if (supabaseSetupBanner) supabaseSetupBanner.style.display = "none";
      updateBackendStatusBadge("supabase", "Supabase 全球云端数据库已连接 (实时同步)");
      console.log(`成功从 Supabase 云数据库拉取到 ${records.length} 条测试记录`);
    } else if (supabaseRes && supabaseRes.error) {
      const errStr = JSON.stringify(supabaseRes.error);
      if (errStr.includes("PGRST205") || errStr.includes("does not exist") || errStr.includes("schema cache")) {
        if (supabaseSetupBanner) supabaseSetupBanner.style.display = "flex";
        updateBackendStatusBadge("supabase", "Supabase 连接正常，但尚未建立 quiz_records 数据表");
      }
    }
  } catch (err) {
    console.warn("Supabase 抓取数据捕获异常:", err);
  }

  // 2. 尝试从自建 API 抓取
  const backendTarget = currentBackendUrl || cloudConfig.customApiUrl;
  if ((!records || records.length === 0) && backendTarget) {
    try {
      const res = await fetch(`${backendTarget.replace(/\/+$/, "")}/api/admin/records`);
      if (res.ok) {
        records = await res.json();
      }
    } catch (e) {}
  }

  // 3. 回退读取本地数据池（若云端尚未建表或网络离线）
  if (!records || records.length === 0) {
    try {
      const localList = JSON.parse(localStorage.getItem(STORAGE_ADMIN_RECORDS) || "[]");
      if (localList && localList.length > 0) {
        records = localList;
      }
    } catch (e) {
      records = [];
    }
  }

  allAdminRecords = records;
  updateAdminMetrics(records);
  filterAndRenderAdminTable();
}

/**
 * 更新统计指标卡片
 */
function updateAdminMetrics(records) {
  const total = records.length;
  statTotalCount.textContent = total;

  if (total === 0) {
    statAvgScore.innerHTML = "0.0 <small>/ 30</small>";
    statAlertCount.textContent = "0";
    statNoteCount.textContent = "0";
    return;
  }

  const sumScore = records.reduce((acc, r) => acc + (r.totalScore || 0), 0);
  const avg = (sumScore / total).toFixed(1);
  statAvgScore.innerHTML = `${avg} <small>/ 30</small>`;

  const alertCount = records.filter(r => r.isAlert).length;
  statAlertCount.textContent = alertCount;

  const noteCount = records.filter(r => r.secretNote && r.secretNote.trim().length > 0).length;
  statNoteCount.textContent = noteCount;
}

/**
 * 筛选并渲染表格
 */
function filterAndRenderAdminTable() {
  const query = adminSearchInput.value.trim().toLowerCase();
  const risk = adminRiskFilter.value;

  let filtered = allAdminRecords.filter(r => {
    const matchName = (r.name || "").toLowerCase().includes(query);
    const matchGroup = (r.group || "").toLowerCase().includes(query);
    const matchNote = (r.secretNote || "").toLowerCase().includes(query);
    const matchText = matchName || matchGroup || matchNote;

    let matchRisk = true;
    if (risk === "alert") {
      matchRisk = r.isAlert === true;
    } else if (risk === "green") {
      matchRisk = r.totalScore <= 4;
    } else if (risk === "light") {
      matchRisk = r.totalScore >= 5 && r.totalScore <= 9;
    } else if (risk === "orange") {
      matchRisk = r.totalScore >= 10 && r.totalScore <= 14;
    } else if (risk === "red") {
      matchRisk = r.totalScore >= 15;
    }

    return matchText && matchRisk;
  });

  if (filtered.length === 0) {
    adminTableBody.innerHTML = "";
    adminEmptyTable.style.display = "block";
    return;
  }

  adminEmptyTable.style.display = "none";
  adminTableBody.innerHTML = filtered.map((r, idx) => {
    let tagClass = "table-tag-green";
    if (r.totalScore >= 15) tagClass = "table-tag-red";
    else if (r.totalScore >= 10) tagClass = "table-tag-orange";
    else if (r.totalScore >= 5) tagClass = "table-tag-light";

    const alertHtml = r.isAlert 
      ? `<span class="alert-badge-danger">🚨 重点关爱</span>` 
      : `<span class="alert-badge-safe">正常</span>`;

    const noteText = r.secretNote ? escapeHtml(r.secretNote) : `<span style="color:#C0C0C0;">无留言</span>`;

    return `
      <tr class="${r.isAlert ? 'row-alert' : ''}">
        <td><strong>${idx + 1}</strong></td>
        <td><strong>${escapeHtml(r.name || "神秘小天使")}</strong></td>
        <td>${escapeHtml(r.group || "未填写")}</td>
        <td><small style="color:#666;">${r.submitTime || "-"}</small></td>
        <td><strong style="font-size:1.05rem; color:var(--primary);">${r.totalScore}</strong> <small>/30</small></td>
        <td><span class="table-tag ${tagClass}">${escapeHtml(r.statusTag || "评测中")}</span></td>
        <td>${alertHtml}</td>
        <td><div class="note-cell-text" title="${escapeHtml(r.secretNote || '')}">${noteText}</div></td>
        <td class="text-center">
          <button class="btn-table-action" onclick="viewRecordDetail('${r.id}')">详情</button>
          <button class="btn-table-action btn-table-del" onclick="deleteRecord('${r.id}')">删除</button>
        </td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 查看单个答卷详情
 */
window.viewRecordDetail = function(recordId) {
  const record = allAdminRecords.find(r => r.id === recordId);
  if (!record) return;

  detailRespondentName.textContent = `${record.name} 的详细打卡答卷`;
  detailSubmitTime.textContent = record.submitTime || "未知";
  detailClassGroup.textContent = record.group || "未填写";
  detailScore.textContent = `${record.totalScore} 分 (${record.headline || ''})`;
  detailRiskTag.innerHTML = record.isAlert 
    ? `<span style="color:#C53030; font-weight:bold;">🚨 触发重点关爱预警 (高分或强烈孤独)</span>` 
    : `<span style="color:#2D6A4F; font-weight:bold;">状态良好</span>`;

  detailQuestionsList.innerHTML = questionsData.map(q => {
    const ansScore = record.answers ? record.answers[q.id] : "-";
    const optDesc = scoreOptions.find(o => o.score === ansScore)?.desc || "";
    return `
      <div class="detail-q-item">
        <div class="detail-q-title">
          <span>${q.icon}</span> ${q.id}. ${q.category}
          <div style="font-size:0.8rem; color:#777; margin-top:2px;">${q.question}</div>
        </div>
        <div style="text-align:right;">
          <span class="detail-q-score" style="background:${ansScore >= 2 ? '#FED7D7' : '#D8F3DC'}; color:${ansScore >= 2 ? '#C53030' : '#1B4332'};">
            ${ansScore} 分 · ${optDesc}
          </span>
        </div>
      </div>
    `;
  }).join("");

  detailNoteContent.textContent = record.secretNote ? record.secretNote : "（这位同学没有填写悄悄话）";

  adminDetailModal.style.display = "flex";
};

/**
 * 删除单个答卷
 */
window.deleteRecord = async function(recordId) {
  if (!confirm("确定要删除这条测试记录吗？此操作无法恢复。")) return;

  // 1. 同步从 Supabase 云数据库删除
  try {
    await deleteRecordFromSupabase(recordId);
  } catch (e) {
    console.warn("Supabase 删除异常:", e);
  }

  // 2. 从自建服务器删除
  const backendTarget = currentBackendUrl || cloudConfig.customApiUrl;
  if (backendTarget) {
    try {
      await fetch(`${backendTarget.replace(/\/+$/, "")}/api/admin/records/${recordId}`, { method: "DELETE" });
    } catch (e) {}
  }

  // 3. 本地缓存清理
  allAdminRecords = allAdminRecords.filter(r => r.id !== recordId);
  localStorage.setItem(STORAGE_ADMIN_RECORDS, JSON.stringify(allAdminRecords));

  updateAdminMetrics(allAdminRecords);
  filterAndRenderAdminTable();
};

/**
 * 清空所有数据
 */
async function handleClearAllAdminRecords() {
  if (!confirm("⚠️ 高危操作：确定要清空所有的打卡记录数据吗？\n建议在清空前先点击【导出 Excel/CSV】保存备份！")) return;

  // 1. 从 Supabase 云数据库清空
  try {
    await clearAllRecordsFromSupabase();
  } catch (e) {
    console.warn("Supabase 清空异常:", e);
  }

  // 2. 从自建服务器清空
  const backendTarget = currentBackendUrl || cloudConfig.customApiUrl;
  if (backendTarget) {
    try {
      await fetch(`${backendTarget.replace(/\/+$/, "")}/api/admin/records/clear`, { method: "POST" });
    } catch (e) {}
  }

  allAdminRecords = [];
  localStorage.setItem(STORAGE_ADMIN_RECORDS, JSON.stringify([]));

  updateAdminMetrics([]);
  filterAndRenderAdminTable();
  alert("已清空后台测试记录。");
}

/**
 * 导出 Excel / CSV 表格文件（标准 UTF-8 BOM 格式，Excel 打开无乱码）
 */
function handleExportCSV() {
  if (!allAdminRecords || allAdminRecords.length === 0) {
    alert("当前还没有任何打卡记录，无法导出表格！🌱");
    return;
  }

  const headers = [
    "序号",
    "打卡人姓名/代号",
    "班级/组别",
    "提交时间",
    "Q1开心和爱好(0-3)",
    "Q2心情天气(0-3)",
    "Q3小脾气(0-3)",
    "Q4身体电量(0-3)",
    "Q5睡眠质量(0-3)",
    "Q6吃饭胃口(0-3)",
    "Q7大脑运转(0-3)",
    "Q8身体不适(0-3)",
    "Q9对自己看法(0-3)",
    "Q10孤独求助(0-3)",
    "总得分(满分30)",
    "心理电量评估状态",
    "是否重点预警",
    "树洞悄悄话留言"
  ];

  const rows = allAdminRecords.map((r, index) => {
    const qAnswers = r.answers || {};
    return [
      index + 1,
      cleanCsv(r.name || "神秘小天使"),
      cleanCsv(r.group || "未填写"),
      cleanCsv(r.submitTime || "-"),
      qAnswers[1] !== undefined ? qAnswers[1] : "-",
      qAnswers[2] !== undefined ? qAnswers[2] : "-",
      qAnswers[3] !== undefined ? qAnswers[3] : "-",
      qAnswers[4] !== undefined ? qAnswers[4] : "-",
      qAnswers[5] !== undefined ? qAnswers[5] : "-",
      qAnswers[6] !== undefined ? qAnswers[6] : "-",
      qAnswers[7] !== undefined ? qAnswers[7] : "-",
      qAnswers[8] !== undefined ? qAnswers[8] : "-",
      qAnswers[9] !== undefined ? qAnswers[9] : "-",
      qAnswers[10] !== undefined ? qAnswers[10] : "-",
      r.totalScore,
      cleanCsv(r.statusTag || "-"),
      r.isAlert ? "🚨 重点关爱" : "正常",
      cleanCsv(r.secretNote || "无留言")
    ];
  });

  let csvContent = "\uFEFF" + headers.join(",") + "\n";
  rows.forEach(row => {
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  a.href = url;
  a.download = `心情与能量打卡数据汇总_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function cleanCsv(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 修改管理员密码
 */
function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const oldPwd = oldPasswordInput.value.trim();
  const newPwd = newPasswordInput.value.trim();
  const confirmPwd = confirmPasswordInput.value.trim();

  const currentPwd = localStorage.getItem(STORAGE_ADMIN_PWD) || DEFAULT_ADMIN_PWD;

  if (oldPwd !== currentPwd) {
    alert("原密码输入不正确，请重新输入！");
    oldPasswordInput.focus();
    return;
  }

  if (newPwd.length < 4) {
    alert("新密码至少需要 4 位字符！");
    newPasswordInput.focus();
    return;
  }

  if (newPwd !== confirmPwd) {
    alert("两次输入的新密码不一致，请仔细核对！");
    confirmPasswordInput.focus();
    return;
  }

  localStorage.setItem(STORAGE_ADMIN_PWD, newPwd);
  adminChangePwdModal.style.display = "none";
  alert("🎉 管理员密码修改成功！请牢记您的新密码。");
}

/**
 * 打开云端同步设置弹窗
 */
function openCloudSettingsModal() {
  cloudSettingsModal.style.display = "flex";
  supabaseUrlInput.value = cloudConfig.supabaseUrl || DEFAULT_SUPABASE_URL;
  supabaseKeyInput.value = cloudConfig.supabaseKey || DEFAULT_SUPABASE_KEY;
  pushplusTokenInput.value = cloudConfig.pushplusToken || DEFAULT_PUSHPLUS_TOKEN;
  customApiUrlInput.value = cloudConfig.customApiUrl || "";
}

/**
 * 保存云端设置
 */
function saveCloudSettings() {
  cloudConfig.supabaseUrl = (supabaseUrlInput.value.trim() || DEFAULT_SUPABASE_URL);
  cloudConfig.supabaseKey = (supabaseKeyInput.value.trim() || DEFAULT_SUPABASE_KEY);
  cloudConfig.pushplusToken = pushplusTokenInput.value.trim();
  cloudConfig.customApiUrl = customApiUrlInput.value.trim();

  localStorage.setItem(STORAGE_CLOUD_CONFIG, JSON.stringify(cloudConfig));
  cloudSettingsModal.style.display = "none";

  supabaseClient = null; // 重置客户端对象
  getSupabaseClient();
  detectBackendServer();
  refreshAdminData();

  alert("🎉 跨设备云数据库与同步设置已保存！\n系统将自动优先通过 Supabase 云端进行数据汇总与存储。");
}

/**
 * 测试发送一条微信推送
 */
function testPushNotification() {
  const token = (pushplusTokenInput.value.trim() || DEFAULT_PUSHPLUS_TOKEN).trim();
  if (!token) {
    alert("请先输入你的 PushPlus Token！");
    pushplusTokenInput.focus();
    return;
  }

  btnTestPushNotification.disabled = true;
  btnTestPushNotification.textContent = "⏳ 正在发送测试微信...";

  const title = "🌱【测试】心情与能量打卡微信推送配置成功！";
  const content = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; color:#2D3748;">
      <h3 style="color:#2D6A4F; margin-top:0;">🌱 恭喜！微信实时推送配置成功！</h3>
      <p>亲爱的管理员：</p>
      <p>你的微信公众号已成功与【近期心情与能量小打卡】系统打通！</p>
      <p style="background:#F0FDF4; border-left:4px solid #52B788; padding:10px 14px; border-radius:4px;">
        <strong>当前管理员密码：</strong> 79797<br/>
        <strong>状态：</strong> 微信推送通道完全畅通 🚀
      </p>
      <p>后续无论任何人在任何手机上答题打卡，你都将在此处第一时间收到完整答卷与预警通知！</p>
      <p style="font-size:12px; color:#A0AEC0; text-align:center; margin-top:16px;">* 来自【🌱 近期心情与能量小打卡】系统测试</p>
    </div>
  `;

  sendPushPlusForm(token, title, content);

  setTimeout(() => {
    btnTestPushNotification.disabled = false;
    btnTestPushNotification.textContent = "🔔 发送一条微信测试通知";
    alert("✅ 微信测试推送已成功发出！\n微信端通常在 1~3 秒内送达，请查看你的微信公众号「pushplus推送加」！📱");
  }, 1200);
}
