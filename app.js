/**
 * 🌱 近期心情与能量小打卡 - 核心交互逻辑、双权限体系与数据后台管理
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
const DEFAULT_ADMIN_PWD = "admin123";

// 状态管理
const userAnswers = {}; // { questionId: score }
let allAdminRecords = []; // 管理员视角下的全量答卷
let isAdminLoggedIn = false;
let currentBackendUrl = null; // 探测到的后端服务地址（如 http://localhost:8080）

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

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  renderQuestions();
  bindEvents();
  updateProgress();
  detectBackendServer();
});

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
}

/**
 * 探测独立后端服务 (Python server.py)
 */
async function detectBackendServer() {
  const possibleEndpoints = ["http://localhost:8080/api/health", "/api/health"];
  for (const url of possibleEndpoints) {
    try {
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        currentBackendUrl = url.replace("/api/health", "");
        console.log("已连通独立后端服务器:", currentBackendUrl);
        updateBackendStatusBadge(true);
        return;
      }
    } catch (err) {
      // 本地无服务器或静态运行
    }
  }
  updateBackendStatusBadge(false);
}

function updateBackendStatusBadge(isOnline) {
  if (isOnline) {
    backendStatusDot.className = "status-dot dot-green";
    backendStatusText.textContent = "已连接独立后端服务器 (SQLite 实时数据库同步)";
  } else {
    backendStatusDot.className = "status-dot dot-blue";
    backendStatusText.textContent = "GitHub Pages 离线数据中心 (本地安全加密存储)";
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

  // 平滑跳转
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

  // 组装受测者信息
  const respondentName = userNameInput.value.trim() || "神秘小天使";
  const respondentGroup = userGroupInput.value.trim() || "未填写";
  const secret = secretNote.value.trim();

  // 生成分析与评估
  const gradeData = calculateGrade(totalScore);

  // 组装存储对象
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

  // 1. 存入后台数据库（无论是否连网，本地均作为可靠持久池）
  saveToAdminPool(newRecord);

  // 2. 尝试向后端 API 发送
  trySendToBackend(newRecord);

  // 3. 存入普通用户个人日记
  saveUserHistoryRecord(totalScore, gradeData.headline, formatTime);

  // 4. 展示报告
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

  // 特殊预警检测
  if (record.isAlert) {
    safeGuardNotice.style.display = "flex";
  } else {
    safeGuardNotice.style.display = "none";
  }

  // 树洞
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
 * 存入管理员全量数据池
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
 * 尝试推送到后端 API (如果在线)
 */
async function trySendToBackend(record) {
  if (!currentBackendUrl) return;
  try {
    await fetch(`${currentBackendUrl}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.warn("未能成功上报到远程后端，已妥善保存在本地数据库池中", err);
  }
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
    // 弹出管理员登录窗
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
    loginErrorMsg.textContent = "密码错误，请重新输入！（默认初始密码：admin123）";
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
 * 刷新后台数据（优先服务端，降级本地存储）
 */
async function refreshAdminData() {
  let records = [];

  // 1. 若有独立后端，先尝试从后端拉取
  if (currentBackendUrl) {
    try {
      const res = await fetch(`${currentBackendUrl}/api/admin/records`);
      if (res.ok) {
        records = await res.json();
      }
    } catch (e) {
      console.warn("未能从后端 API 抓取数据，将使用本地存储数据", e);
    }
  }

  // 2. 如果后端没有数据或离线，读取本地存储
  if (!records || records.length === 0) {
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_ADMIN_RECORDS) || "[]");
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
    // 关键词过滤
    const matchName = (r.name || "").toLowerCase().includes(query);
    const matchGroup = (r.group || "").toLowerCase().includes(query);
    const matchNote = (r.secretNote || "").toLowerCase().includes(query);
    const matchText = matchName || matchGroup || matchNote;

    // 状态过滤
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

  // 10 道题目详情
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

  // 1. 如果有后端尝试向后端发送删除
  if (currentBackendUrl) {
    try {
      await fetch(`${currentBackendUrl}/api/admin/records/${recordId}`, { method: "DELETE" });
    } catch (e) {}
  }

  // 2. 本地池删除
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

  if (currentBackendUrl) {
    try {
      await fetch(`${currentBackendUrl}/api/admin/records/clear`, { method: "POST" });
    } catch (e) {}
  }

  allAdminRecords = [];
  localStorage.setItem(STORAGE_ADMIN_RECORDS, JSON.stringify([]));

  updateAdminMetrics([]);
  filterAndRenderAdminTable();
  alert("已清空所有后台测试记录。");
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

  // 拼接 CSV 内容（加入 \uFEFF 解决 Windows Excel 打开中文乱码）
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
