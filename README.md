# 🌱 近期心情与能量小打卡 (Psychological Test)

> 一份温和、治愈的儿童与青少年心理健康及身心能量自我关怀前端小应用。  
> 了解你最近两周（过去14天里）的真实感受，给勇敢面对内心的自己一个大大的拥抱。

🌐 **在线体验地址（GitHub Pages 开启后）**：  
👉 [https://li-xiao-kun.github.io/psychological-test/](https://li-xiao-kun.github.io/psychological-test/)

---

## ☁️ 核心：别人在手机上答完题，管理员如何实时看到？

由于 GitHub Pages 是静态网站托管，为了实现 **“任何人在任何地方用手机/电脑答完题，管理员都能实时看到全量数据并导出 Excel”**，系统已全面接入 **Supabase 全球云端数据库** 作为主力云端数据引擎：

### 🌟 方案一：Supabase 全球云端数据库（已全面集成 · 推荐主力）
系统已内置你的专属 Supabase 项目配置：
* **Supabase Project URL**: `https://nshrxfsceujjvpkysbmm.supabase.co`
* **Publishable API Key**: `sb_publishable_0B3yvBpnoc-KAdxND87RXw_MQywLA9D`

#### ⚡ 10 秒开启数据库（仅需执行一次）：
1. 打开 Supabase 控制台的 SQL Editor：  
   👉 [https://supabase.com/dashboard/project/nshrxfsceujjvpkysbmm/sql/new](https://supabase.com/dashboard/project/nshrxfsceujjvpkysbmm/sql/new)
2. 复制项目根目录下的 `supabase_schema.sql` 文件的完整内容（也可在管理后台点击“📋 复制建表 SQL”）；
3. 粘贴进编辑框中，点击右下角绿色的 **`Run`** 按钮；
4. 运行完成后，数据表 `quiz_records` 立即生效！以后任何人在手机上提交测试，数据毫秒级存入云端，你在管理后台一键刷新即可看到！

---

### 📱 方案二：微信实时推送通知（可选辅助）
* 微信关注 `pushplus推送加` 公众号即可获取专属 Token；
* 每当有受测者打卡完成，你的个人微信可同时收到一条包含总分、等级、预警和树洞内容的图文通知。

---

### 🖥️ 方案三：自建 Python 服务器（支持局域网或离线）
如果在学校机房或局域网使用：
```bash
python server.py
```
服务将在 `http://localhost:8080` 启动，自动生成本地 SQLite 数据库 `psychological_data.db`。

---

## 👥 权限体系说明

| 维度 | 👤 普通受测者（学生/访客） | 🔐 管理员（老师/家长/咨询师） |
| :--- | :--- | :--- |
| **访问方式** | 访问网页直接答题 | 点击右上角「🔐 管理员后台」输入口令 |
| **管理密码** | 无需密码 | **专属隐藏口令（仅管理员本人知晓）** |
| **数据范围** | 只能查看属于自己的测试单，**无法**看到其他任何人 | **全量查看**所有受测者答题记录、总分、预警和树洞 |
| **报表导出** | — | **一键导出标准 Excel / CSV 表格**（UTF-8 BOM 中文无乱码） |
| **云端存储** | 答题完成后自动同步至云端 | 支持按姓名/班级搜索、按心理状态等级筛选、单条删除与清空 |

---

## 💡 计分规则与电量说明

问卷共 10 道题目，每题单选：
* **0分**：完全没有（或者极少这样）
* **1分**：偶尔有几天这样
* **2分**：有一半以上的时间都这样
* **3分**：几乎每天都这样

### 能量分级：
| 得分区间 | 心理状态标签 | 状态说明 |
| :--- | :--- | :--- |
| **0 ~ 4 分** | ☀️ 阳光充沛的小树苗 | 心理电量充足，充满活力与韧性 |
| **5 ~ 9 分** | ⛅ 偶遇微风云朵的小草 | 轻微耗电，遇到学业或生活小波折，需适当放松 |
| **10 ~ 14 分** | 🔋 呼叫关怀的蓄电池 | 中度疲惫，压力较沉重，需要陪伴与倾听 |
| **15 ~ 30 分** | 🫂 特别需要被爱的小天使 | 高负荷预警，建议主动向信任的家长、老师或心理医生求助 |

---

## 🚀 GitHub Pages 前端部署上线步骤

代码已全部推送到 GitHub 远程仓库，按照以下步骤开启 Pages 服务即可：

1. 打开 GitHub 仓库：[https://github.com/li-xiao-kun/psychological-test](https://github.com/li-xiao-kun/psychological-test)；
2. 进入 **`Settings` -> `Pages`**；
3. 将 **Branch** 设置为 **`main`**，文件夹选 **`/ (root)`**，点击 **`Save`**；
4. 等待 1~2 分钟刷新，即可通过 [https://li-xiao-kun.github.io/psychological-test/](https://li-xiao-kun.github.io/psychological-test/) 线上访问！

---

## 📂 项目文件结构

```text
心里测试小程序/
├── index.html            # 主页面结构、测评表单、管理员工作台与弹窗
├── style.css             # 温暖治愈系样式、后台数据表格、响应式与打印样式
├── app.js                # 核心评分算法、双权限验证、Supabase 云端存取与管理后台
├── supabase_schema.sql   # Supabase 数据表初始化与 RLS 安全策略 SQL 脚本
├── test_supabase.py      # Supabase 云端连通性与数据表状态自动化检测脚本
├── server.py             # 原生 Python 独立后端服务与 SQLite 数据库 (可选)
└── README.md             # 项目文档与上线使用指南
```

---

## 💌 温馨免责声明

本测评工具旨在为青少年与家庭提供温暖、无压力的身心电量自我关怀参考，**不可作为临床精神心理疾病的医学诊断依据**。如感到持续痛苦或生活功能受损，请及时前往正规医疗机构心身科或精神卫生中心寻求专业诊治。
