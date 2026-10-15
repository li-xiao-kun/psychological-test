/**
 * 🌱 近期心情与能量小打卡 - 核心交互逻辑与评分系统
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

// 状态管理
const userAnswers = {}; // { questionId: score }
const STORAGE_KEY = "psy_test_history_v1";

// DOM 元素引用
const questionsContainer = document.getElementById("questionsContainer");
const progressFill = document.getElementById("progressFill");
const answeredCounter = document.getElementById("answeredCounter");
const btnSubmit = document.getElementById("btnSubmit");
const secretNote = document.getElementById("secretNote");
const wordCount = document.getElementById("wordCount");
const btnReset = document.getElementById("btnReset");

// 弹窗与结果元素
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

// 历史抽屉元素
const historyDrawer = document.getElementById("historyDrawer");
const btnHistory = document.getElementById("btnHistory");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const historyList = document.getElementById("historyList");
const btnClearHistory = document.getElementById("btnClearHistory");

// 初始化页面
document.addEventListener("DOMContentLoaded", () => {
  renderQuestions();
  bindEvents();
  updateProgress();
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
  // 点击选项逻辑
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

  // 提交测评
  btnSubmit.addEventListener("click", handleSubmit);

  // 清空重置
  btnReset.addEventListener("click", handleReset);

  // 模态弹窗关闭
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

  // 保存图片海报
  btnSaveImage.addEventListener("click", handleSavePoster);

  // 复制文字总结
  btnCopyText.addEventListener("click", handleCopyReportText);

  // 历史抽屉事件
  btnHistory.addEventListener("click", openHistoryDrawer);
  btnCloseDrawer.addEventListener("click", () => historyDrawer.style.display = "none");
  historyDrawer.addEventListener("click", (e) => {
    if (e.target === historyDrawer) historyDrawer.style.display = "none";
  });
  btnClearHistory.addEventListener("click", handleClearHistory);
}

/**
 * 处理选项被选择
 */
function handleOptionSelect(qid, score, targetBtn) {
  userAnswers[qid] = score;

  // 更新当前题目卡片的按钮样式
  const parentCard = document.getElementById(`qCard_${qid}`);
  const buttons = parentCard.querySelectorAll(".option-btn");
  buttons.forEach(b => b.classList.remove("selected"));
  targetBtn.classList.add("selected");

  // 更新右上角状态小标
  const badge = document.getElementById(`qBadge_${qid}`);
  if (badge) {
    badge.textContent = `已选 ${score}分 ✓`;
    badge.classList.add("done");
  }
  parentCard.classList.add("answered");

  // 更新进度条
  updateProgress();

  // 智能平滑滚动：自动跳转到下一道未答题目
  const nextUnanswered = questionsData.find(q => userAnswers[q.id] === undefined);
  if (nextUnanswered && nextUnanswered.id > qid) {
    setTimeout(() => {
      const nextCard = document.getElementById(`qCard_${nextUnanswered.id}`);
      if (nextCard) {
        nextCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 280);
  } else if (Object.keys(userAnswers).length === questionsData.length) {
    // 全部答完，滚动到提交区
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
 * 校验并处理提交
 */
function handleSubmit() {
  const unanswered = questionsData.filter(q => userAnswers[q.id] === undefined);

  if (unanswered.length > 0) {
    const firstUnanswered = unanswered[0];
    const targetCard = document.getElementById(`qCard_${firstUnanswered.id}`);
    
    // 突出提醒未答题目
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

  // 生成分析评估
  generateReport(totalScore);
}

/**
 * 根据分值生成报告内容
 */
function generateReport(score) {
  // 设置日期
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  reportDateEl.textContent = dateStr;

  // 计分动画
  animateScoreCounter(score);

  // 评估等级数据字典
  let gradeData = {};
  let batteryLevel = 90;

  if (score <= 4) {
    batteryLevel = 95 - score * 3;
    gradeData = {
      tag: "能量满格 · 阳光充沛 🌱",
      headline: "☀️ 阳光充沛的小树苗",
      color: "#2D6A4F",
      meterColor: "linear-gradient(90deg, #52B788, #40916C)",
      eval: "亲爱的宝贝，你现在的心理状态就像沐浴在阳光下的小树苗一样，内心充满了向上的活力和光亮！在近两周的生活里，你有着较好的情绪调节能力。即使遇到一些小烦恼，你也能积极应对。请继续拥抱这份好状态，去感受每天阳光晒在身上的温暖吧～",
      suggestions: [
        "继续保持规律作息和健康的饮食习惯，充足睡眠是好心情的最佳底色。",
        "常常做自己喜欢的事情（画画、运动、听歌、做手工），让快乐的小火苗一直燃烧。",
        "如果身边的朋友有时心情低落，可以用你的温柔和笑容给他们传递一点温暖哦。"
      ]
    };
  } else if (score <= 9) {
    batteryLevel = 80 - (score - 4) * 4;
    gradeData = {
      tag: "轻度耗电 · 偶遇微风 ⛅",
      headline: "⛅ 偶遇微风云朵的小草",
      color: "#40916C",
      meterColor: "linear-gradient(90deg, #74C69D, #52B788)",
      eval: "宝贝，最近这14天里，你可能稍微感到了一点点疲惫或者偶尔的小烦心，就像手机电池用到了70%左右。在学习或和别人相处中，有一点点小波折是非常正常的现象。不需要责怪自己，这只是身体和心里在悄悄提醒你：该适当喘口气、休息一下啦。",
      suggestions: [
        "给自己安排一个‘充电周末’，少一点手机刷屏，多到户外公园走走，看看绿色植物。",
        "睡前放下烦恼，喝一杯温牛奶，听听轻柔的音乐，帮助身体充分放松。",
        "遇到觉得烦躁的时刻，试着深吸一口气默数5个数，给自己一个暂停键。"
      ]
    };
  } else if (score <= 14) {
    batteryLevel = 55 - (score - 9) * 5;
    gradeData = {
      tag: "蓄电池告警 · 需要充能 🔋",
      headline: "🔋 呼叫关怀与休整的蓄电池",
      color: "#F4A261",
      meterColor: "linear-gradient(90deg, #F4A261, #E76F51)",
      eval: "亲爱的宝贝，紧紧抱抱你！最近两周，你可能承受了比平时更多的压力与疲惫，心里像装了一块沉甸甸的小石头，做事情提不起劲，甚至偶尔觉得委屈想哭。请千万记得：感到累、烦恼或脆弱并不是你的过错，这是你的小心灵在勇敢地向你发出求助信号。",
      suggestions: [
        "允许自己今天‘不必做到100分’，把紧绷的心弦稍微放松一些。",
        "勇敢向信任的爸爸妈妈或好朋友说出你的累：‘我最近有点不舒服，可以陪我聊聊天或抱抱我吗？’",
        "在便签纸或刚才的小树洞里把心里难过的事情一件件写出来，然后告诉自己：‘天大的事，我们一件件慢慢来。’"
      ]
    };
  } else {
    batteryLevel = Math.max(15, 30 - (score - 15) * 2);
    gradeData = {
      tag: "亟待守护 · 渴望拥抱 🫂",
      headline: "🫂 特别需要被爱与守护的小天使",
      color: "#E76F51",
      meterColor: "linear-gradient(90deg, #E76F51, #C53030)",
      eval: "亲爱的宝贝，看着你此刻的打卡，真的非常心疼你。这段时间的你，一定默默承受了许多委屈、辛苦和难熬的时刻。也许周围有人不理解你，甚至让你觉得自己不够好。请你看着镜子对自己说：‘我依然是一个珍贵又可爱的宝贝。’ 难关总会过去的，你不需要独自承担这所有的重量。",
      suggestions: [
        "**千万不要把难过藏在心底**：今天就试着向身边的爸爸妈妈、老师或学校心理辅导室的老师寻求帮助，把这份测评结果拿给他们看。",
        "如果有身体常常不舒服（头疼、胃痛、胸口闷）或整夜睡不着，让爸爸妈妈带你去医院做个健康与心理检查，就像给小电瓶做个专业的保养。",
        "在任何感到无助绝望的时刻，随时拨打免费的青少年心理援助热线，有温柔的哥哥姐姐一直在电话那头守护你。"
      ]
    };
  }

  // 渲染等级文案
  energyStatusTag.textContent = gradeData.tag;
  energyHeadline.textContent = gradeData.headline;
  batteryPercentage.textContent = `${batteryLevel}%`;
  batteryMeterFill.style.width = `${batteryLevel}%`;
  batteryMeterFill.style.background = gradeData.meterColor;
  reportEvaluation.textContent = gradeData.eval;

  // 渲染建议列表
  reportSuggestions.innerHTML = gradeData.suggestions
    .map(s => `<li><span>${s}</span></li>`)
    .join("");

  // 特殊预警检测（若第10题关于孤独与消失 >= 2分）
  const q10Score = userAnswers[10] || 0;
  if (q10Score >= 2) {
    safeGuardNotice.style.display = "flex";
  } else {
    safeGuardNotice.style.display = "none";
  }

  // 渲染树洞秘密
  const secret = secretNote.value.trim();
  if (secret) {
    reportTreeHoleSection.style.display = "block";
    reportTreeHoleContent.textContent = secret;
  } else {
    reportTreeHoleSection.style.display = "none";
  }

  // 打开模态弹窗
  resultModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // 保存记录至本地历史
  saveHistoryRecord(score, gradeData.headline, dateStr, secret);
}

/**
 * 分数滚动数字动效
 */
function animateScoreCounter(target) {
  let current = 0;
  const duration = 600;
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
 * 清空重做
 */
function handleReset() {
  if (Object.keys(userAnswers).length === 0) return;
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

  secretNote.value = "";
  wordCount.textContent = "0";
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * 本地存储打卡历史
 */
function saveHistoryRecord(score, headline, date, note) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.unshift({
      id: Date.now(),
      date,
      score,
      headline,
      hasNote: Boolean(note)
    });
    // 保留最近 20 条记录
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (err) {
    console.warn("未能写入 localStorage", err);
  }
}

/**
 * 打开历史打卡抽屉
 */
function openHistoryDrawer() {
  historyDrawer.style.display = "flex";
  renderHistoryList();
}

/**
 * 渲染历史记录列表
 */
function renderHistoryList() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    list = [];
  }

  if (list.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        🌱 还没有打卡记录哦，<br>完成一次测试后就会记录在这里啦～
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

/**
 * 清空历史记录
 */
function handleClearHistory() {
  if (!confirm("确定要清空所有打卡记录日记吗？")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistoryList();
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
  
  if (userAnswers[10] >= 2) {
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
 * 保存结果海报（使用 html2canvas）
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
