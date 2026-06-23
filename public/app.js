const ainoteTeamBackground = `你是科大讯飞 iFLYTEK 旗下 AINOTE 智能办公本产品相关人员。AINOTE 面向会议、访谈、学习、项目协作和移动办公等信息密集场景，核心价值是把语音、手写、阅读和 AI 纪要整合成低打扰的工作流。

产品背景：
1. AINOTE 2 / AINOTE Air 2 主打 E Ink 纸感书写与阅读、轻薄便携、实时语音转写、AI 会议纪要、AI 对话、AI 搜索、AI 写作、日程管理、云同步和多端访问。
2. 产品需要同时兼顾硬件体验、端侧交互、云端 AI 服务、跨语言会议、企业数据安全和海外市场使用习惯。
3. 品牌定位不是单纯记事本，而是面向专业人士的 AI productivity paper tablet：让用户在会议和思考时少记录、多专注，事后快速检索、整理和跟进。
4. 需求讨论时必须关注真实会议流、录音转写准确率、纪要结构化质量、手写与语音关联、权限隐私、同步可靠性、弱网失败、跨设备体验和商业化差异。`;

const defaultPrdPrompt = `PRD 输出硬规则：
1. 多个需求必须拆成多个一级标题，每个一级标题只对应一个独立需求。
2. 单个需求的二级标题数量不得超过 3 个，默认只使用「背景」和「要求、交互规则和文案细节」。
3. 「背景」下融合背景、目标和使用场景，用 1-2 段说明，不要啰嗦，不要写「背景与目标」。
4. 「要求、交互规则和文案细节」下按用户交互顺序组织：入口/触发、页面表现、用户操作、系统反馈、页面文案、异常兜底、保存/生效等规则。只有当需求涉及目标产品设备横屏差异时，才说明横屏布局、入口、信息优先级或操作差异；如果横屏与正常状态没有区别，不需要单独说明。
5. 页面文案、按钮文案、Toast/弹窗文案必须直接给最终文案，不写建议文案，不列可选方案表格。若文案需要用户选择，必须在聊天中给出 2-4 个候选方案，并说明每个方案出现的理由，让用户选择；PRD 中只写用户确认后的最终文案。
6. 可以使用多级列表展示细节，二级/三级列表必须体现从属关系，不要全部写成同一级列表。
7. 不输出「待确认问题」「待补充」「版本范围」「目标用户」「设计用户」「验收标准」「完成标准」「关键规则」「风险与异常」等独立章节或固定字段。
8. 需要用户选择或信息不足时，在聊天 message 中直接提问，不写入左侧 PRD。`;

const sharedDiscussionWorkflowPrompt = `共同工作流：
1. 先归纳当前已理解的信息，再提出下一步最值得问的问题。
2. 每轮优先处理最容易造成评审或研发返工的 1 个缺口；必要时最多问 3 个问题。
3. 注意力顺序默认是：背景目标 → 用户/角色/场景 → 页面/流程 → 规则/状态 → 异常/边界 → 优先级/交付 → PRD 就绪判断。
4. 不要把未确认信息写成结论；可以提出假设，但必须让用户确认。
5. 当目标、场景、流程、规则和主要异常已经基本清楚时，要主动收束，说明可以进入 PRD/原型/埋点/研发沟通中的哪一步。
6. 角色之间不是轮流表演，而是根据上一句内容补漏洞、质疑假设或收束范围。`;

const defaultRolePrompts = {
  pm: `${ainoteTeamBackground}

${sharedDiscussionWorkflowPrompt}

你是 AINOTE 产品经理，负责把模糊需求收束为可评审、可开发、可落地的产品方案。

核心职责：
1. 把会议记录、AI 纪要、手写笔记、日程同步、跨端查看等需求收束成清晰交互流程。
2. 控制讨论节奏，优先确认 AINOTE 用户在会前、会中、会后哪个环节遇到问题。
3. 识别“AI 自动生成”“实时同步”“准确转写”等模糊词背后的规则和边界。
4. 把研发提出的技术风险翻译成产品取舍，把用户提出的体验问题翻译成 AINOTE 场景规则。
5. 优先补全背景目标、页面入口、主路径、规则边界、保存生效和异常兜底。
6. 只有当 PRD Prompt 或用户当前要求涉及目标产品设备横屏状态时，才确认横屏布局、入口、信息优先级和操作差异；不要输出无信息量的“横屏保持一致”。
7. 涉及页面文案、按钮文案、Toast、弹窗、空状态、错误提示等需要选择时，在聊天中给出 2-4 个候选文案，并说明每个方案出现的理由，让用户拍板后再写进 PRD。

与其他角色互动：
1. 如果研发只说实现风险，你要追问该风险会影响哪个用户流程或版本范围。
2. 如果用户只表达感受，你要追问具体场景、频次和失败后果。
3. 如果领导只看目标，你要补充 MVP 和不做范围，防止目标过大。
4. 你不能替用户拍板；未确认内容必须在聊天中向用户提问确认。

发言风格：
先归纳一句当前结论，再提出最关键的 1 个问题或 1 个收束建议。不要长篇输出。`,
  user: `${ainoteTeamBackground}

${sharedDiscussionWorkflowPrompt}

你代表 AINOTE 真实用户视角，不是泛泛说“体验好不好”，而是从具体会议、访谈、学习和移动办公场景出发。

核心职责：
1. 指出用户在录音、转写、生成纪要、回看手写笔记、同步到手机或电脑时的困惑。
2. 检查产品和研发方案是否打断会议专注，是否让用户在会中承担过多操作。
3. 关注文案是否可理解、入口是否可发现、笔和屏交互是否符合纸感设备直觉。
4. 区分商务人士、学生、访谈者、项目负责人、跨语言会议参与者之间的需求差异。
5. 优先补全用户动机、首次/日常使用差异、高频/低频场景、失败后的可恢复路径和文案理解成本。

与其他角色互动：
1. 如果产品把流程设计得太完整但用户动机不清，你要追问用户为什么会进入这个功能。
2. 如果研发提出技术限制，你要追问用户会感知到什么，以及是否有可接受的替代体验。
3. 如果领导压缩范围，你要指出哪些被砍能力会明显影响用户完成主路径。
4. 如果上一位角色的发言里缺少真实场景，你优先补场景而不是补规则。

发言风格：
像真实用户或用户研究代表一样说话，给出具体场景、具体担忧和一个最想确认的问题。`,
  engineer: `${ainoteTeamBackground}

${sharedDiscussionWorkflowPrompt}

你是 AINOTE 研发负责人，重点不是否定需求，而是把需求拆成可实现、可测试、可排期的端云硬件协同边界。

核心职责：
1. 识别录音、转写、说话人分离、AI 摘要、手写 OCR、云同步、权限、缓存、弱网和数据一致性风险。
2. 把“实时”“自动总结”“跨端同步”“手写关联录音”等词转成状态机、接口和失败兜底规则。
3. 明确哪些点会影响端侧性能、E Ink 刷新体验、服务端成本、模型调用、测试用例和排期。
4. 对 AI 生成内容特别关注：上下文长度、格式稳定性、转写错误、幻觉兜底、用户确认链路和隐私保护。
5. 优先补全状态机、数据模型、接口边界、缓存/离线策略、并发冲突、异常恢复、测试用例和埋点日志。

与其他角色互动：
1. 如果产品提出方案但没说状态变化，你要补状态和异常。
2. 如果用户提出体验诉求，你要判断实现代价，并提出可落地的折中方案。
3. 如果领导要求压缩范围，你要给出 MVP 技术切分，而不是只说做不了。
4. 如果上一位角色提出的规则会导致复杂实现，你要指出复杂点和替代方案。

发言风格：
直接、具体、可执行。每次只指出 1-2 个最会返工的技术问题。`,
  leader: `${ainoteTeamBackground}

${sharedDiscussionWorkflowPrompt}

你是 AINOTE 项目负责人/业务负责人，负责判断目标、优先级、资源投入和市场取舍，不直接替产品写细节。

核心职责：
1. 判断需求服务于 AINOTE 的哪类目标：提升会议效率、强化 AI 纪要壁垒、提升纸感设备留存、降低跨端使用阻力或支撑海外增长。
2. 明确当前交付必须保留哪些主路径，哪些能力会拖累节奏或偏离 AINOTE 定位。
3. 要求讨论形成可检查的交互结果，而不是停留在“更智能”“更像纸”“更高效”。
4. 关注硬件体验、AI 服务成本、隐私风险、上线节奏、品牌可信度和市场竞争差异。
5. 优先补全 MVP、必须做/可二期、资源约束、业务指标、上线节奏和是否应停止追问进入交付。

与其他角色互动：
1. 如果产品和研发讨论过细但目标不清，你要拉回目标和版本边界。
2. 如果用户提出很多诉求，你要判断哪些是主路径刚需，哪些可以二期。
3. 如果研发提出高成本方案，你要要求给出低成本替代和 MVP。
4. 如果上一位角色已经提出多个问题，你要帮助排序，只保留最关键的确认点。

发言风格：
克制、决策导向。少问开放大问题，多要求明确优先级、主路径和当前交付范围。`
};

const state = {
  messages: [],
  facts: {
    title: "未命名需求",
    background: [],
    goals: [],
    users: [],
    scenarios: [],
    flow: [],
    rules: [],
    edgeCases: [],
    metrics: [],
    acceptance: [],
    openQuestions: [
      "需求背景、涉及角色、方案范围、关键规则和风险点仍需在讨论中确认。"
    ]
  },
  prdPrompt: defaultPrdPrompt,
  draftMarkdown: "",
  activeRoles: new Set(["pm", "user", "engineer", "leader"]),
  rolePrompts: { ...defaultRolePrompts },
  editingRole: "pm",
  pendingQuestionRole: "",
  lastAiRole: "",
  nextSpeakerRole: "",
  round: 0
};

const sessionIdKey = "prd-discussion-generator:session-id";
const storageKey = `prd-discussion-generator:auto-save:v1:${getSessionId()}`;
let isRestoringState = false;

const roleMeta = {
  me: { name: "我", avatar: "我" },
  pm: { name: "资深产品", avatar: "P" },
  user: { name: "用户", avatar: "U" },
  engineer: { name: "研发", avatar: "D" },
  leader: { name: "领导", avatar: "L" },
  system: { name: "记录员", avatar: "R" }
};

const questionBank = {
  pm: [
    "我先收束目标：这个需求最核心要解决的一个问题是什么？如果只能交付第一版，必须保留哪条主路径？",
    "当前需要明确入口和页面层级。用户从哪里进入？完成一次操作后，系统应该停留在当前页、返回上一页，还是进入结果页？",
    "我建议现在补规则：是否允许为空、是否支持编辑/删除/排序，保存后是立即生效还是下次进入生效？"
  ],
  user: [
    "从用户视角看，我更关心使用时机。这个功能是在高频日常场景里用，还是低频配置场景里用？用户最怕哪一步麻烦？",
    "如果我是首次使用者，页面应该给我什么提示？如果我是老用户，是否需要记住上次选择或配置？",
    "这个功能失败时，用户需要知道失败原因，还是只要有可重试入口即可？"
  ],
  engineer: [
    "研发侧需要拆状态：加载中、无数据、保存中、保存失败、权限不足分别怎么展示？哪些状态需要后端持久化？",
    "这里可能有配置冲突或并发编辑问题。是否存在多个角色同时修改同一对象？冲突时以前端最后一次保存为准，还是以后端版本为准？",
    "请确认接口边界：哪些数据来自服务端配置，哪些可以端上缓存？断网后是不可用、读缓存，还是允许离线编辑后同步？"
  ],
  leader: [
    "从交付角度看，需要先定优先级。这个需求是为体验、效率、转化还是成本服务？首版最小主路径是什么？",
    "范围需要克制。哪些能力必须本期做，哪些可以放到二期？如果研发排期不足，最小可用版本是什么？",
    "评审时我会问交互结果是否可检查：上线后用什么指标判断有效？是否需要埋点、日志或运营看板支持？"
  ]
};

const fallbackAnswers = {
  pm: "我先把当前讨论归纳为可推进版本：先确认需求项、方案范围和边界，不直接脑补完整文档；每轮只补最影响返工的问题。",
  user: "从使用侧看，需求需要明确首次进入、日常使用和失败后的可恢复路径，否则用户会在异常状态下失去判断。",
  engineer: "研发侧建议尽早冻结对象模型、状态机和保存生效规则，这三块会直接影响接口和测试用例。",
  leader: "管理侧关注当前交付范围和主路径取舍。建议先确认最小可交付主流程和关键业务指标。"
};

const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const messageTemplate = document.querySelector("#messageTemplate");
const prdPreview = document.querySelector("#prdPreview");
const resetButton = document.querySelector("#resetButton");
const copyPrdButton = document.querySelector("#copyPrdButton");
const saveDemandButton = document.querySelector("#saveDemandButton");
const loadDemandButton = document.querySelector("#loadDemandButton");
const openPrdImportButton = document.querySelector("#openPrdImportButton");
const generatePrototypePromptButton = document.querySelector("#generatePrototypePromptButton");
const closePrdImportButton = document.querySelector("#closePrdImportButton");
const applyPrdImportButton = document.querySelector("#applyPrdImportButton");
const clearPrdImportButton = document.querySelector("#clearPrdImportButton");
const prdImportPanel = document.querySelector("#prdImportPanel");
const prdImportText = document.querySelector("#prdImportText");
const prototypePromptPanel = document.querySelector("#prototypePromptPanel");
const closePrototypePromptButton = document.querySelector("#closePrototypePromptButton");
const prototypePromptText = document.querySelector("#prototypePromptText");
const copyPrototypePromptButton = document.querySelector("#copyPrototypePromptButton");
const autosaveState = document.querySelector("#autosaveState");
const draftState = document.querySelector("#draftState");
const roleState = document.querySelector("#roleState");
const roleButtons = document.querySelectorAll(".role-card");
const roleToggles = document.querySelectorAll("[data-role-toggle]");
const editRoleButtons = document.querySelectorAll("[data-edit-role]");
const roleSettingsButton = document.querySelector("#roleSettingsButton");
const roleSettingsPanel = document.querySelector("#roleSettingsPanel");
const promptEditor = document.querySelector("#promptEditor");
const promptEditorTitle = document.querySelector("#promptEditorTitle");
const rolePromptInput = document.querySelector("#rolePromptInput");
const closePromptEditor = document.querySelector("#closePromptEditor");
const resetPromptButton = document.querySelector("#resetPromptButton");
const savePromptButton = document.querySelector("#savePromptButton");

function nowTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function getSessionId() {
  let sessionId = localStorage.getItem(sessionIdKey);
  if (!sessionId) {
    sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(sessionIdKey, sessionId);
  }
  return sessionId;
}

function reportUsage(action, detail = "") {
  fetch("/api/usage/ping", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-prd-session-id": getSessionId()
    },
    body: JSON.stringify({
      sessionId: getSessionId(),
      action,
      detail: String(detail || "").slice(0, 200)
    })
  }).catch(() => {});
}

function updateChromeStatus() {
  if (autosaveState) autosaveState.textContent = `已保存 ${nowTime()}`;
  if (roleState) roleState.textContent = `${state.activeRoles.size} 个角色`;
  if (draftState) {
    const factCount = [
      ...state.facts.background,
      ...state.facts.goals,
      ...state.facts.scenarios,
      ...state.facts.flow,
      ...state.facts.rules,
      ...state.facts.edgeCases
    ].filter(Boolean).length;
    draftState.textContent = `PRD ${factCount} 项`;
  }
}

function addMessage(role, content) {
  const message = { role, content, time: nowTime() };
  state.messages.push(message);
  renderMessage(message);
  chatLog.scrollTop = chatLog.scrollHeight;
  saveState();
}

function createThinkingMessage(role) {
  const message = { role, content: "", time: nowTime(), thinking: true };
  const node = renderMessage(message);
  chatLog.scrollTop = chatLog.scrollHeight;
  return node;
}

function removeThinkingMessage(node) {
  node?.remove();
}

function renderMessage(message) {
  const node = messageTemplate.content.firstElementChild.cloneNode(true);
  const meta = roleMeta[message.role] || roleMeta.system;
  node.classList.toggle("me", message.role === "me");
  node.classList.toggle("thinking", Boolean(message.thinking));
  node.classList.add(`role-${message.role}`);
  node.querySelector(".avatar").textContent = meta.avatar;
  node.querySelector("strong").textContent = meta.name;
  node.querySelector("time").textContent = message.time;
  if (message.thinking) {
    node.querySelector("p").innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  } else {
    node.querySelector("p").textContent = message.content;
  }
  chatLog.appendChild(node);
  return node;
}

function uniquePush(list, value) {
  const normalized = String(value || "").trim();
  if (!normalized || list.includes(normalized)) return;
  list.push(normalized);
}

function getSerializableState() {
  return {
    messages: state.messages,
    facts: state.facts,
    prdPrompt: state.prdPrompt,
    draftMarkdown: state.draftMarkdown,
    activeRoles: Array.from(state.activeRoles),
    rolePrompts: state.rolePrompts,
    editingRole: state.editingRole,
    pendingQuestionRole: state.pendingQuestionRole,
    lastAiRole: state.lastAiRole,
    nextSpeakerRole: state.nextSpeakerRole,
    round: state.round
  };
}

function saveState() {
  if (isRestoringState) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(getSerializableState()));
    localStorage.setItem(`${storageKey}:updatedAt`, new Date().toISOString());
    updateChromeStatus();
  } catch (error) {
    console.warn("Failed to save session state", error);
  }
}

function restoreRolePrompts(savedPrompts = {}) {
  const prompts = {};
  for (const role of ["pm", "user", "engineer", "leader"]) {
    const saved = String(savedPrompts[role] || "");
    prompts[role] = saved.trim() ? saved : defaultRolePrompts[role];
  }
  return prompts;
}

function applySavedState(saved = {}) {
  state.messages = Array.isArray(saved.messages) ? saved.messages : [];
  state.facts = saved.facts || state.facts;
  state.prdPrompt = saved.prdPrompt || defaultPrdPrompt;
  state.draftMarkdown = saved.draftMarkdown || "";
  state.activeRoles = new Set(Array.isArray(saved.activeRoles) ? saved.activeRoles : ["pm", "user", "engineer", "leader"]);
  state.rolePrompts = restoreRolePrompts(saved.rolePrompts || {});
  state.editingRole = saved.editingRole || "pm";
  state.pendingQuestionRole = saved.pendingQuestionRole || "";
  state.lastAiRole = saved.lastAiRole || "";
  state.nextSpeakerRole = saved.nextSpeakerRole || "";
  state.round = Number(saved.round || 0);

  chatLog.innerHTML = "";
  for (const message of state.messages) {
    renderMessage(message);
  }
  syncRoleCards();
  syncPromptEditor();
  if (prdImportText) prdImportText.value = state.prdPrompt;
  renderPrd();
  chatLog.scrollTop = chatLog.scrollHeight;
}

function restoreState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return false;

  try {
    isRestoringState = true;
    const saved = JSON.parse(raw);
    applySavedState(saved);
    return true;
  } catch (error) {
    console.warn("Failed to restore session state", error);
    return false;
  } finally {
    isRestoringState = false;
  }
}

function splitThoughts(input) {
  return input
    .split(/[。！？!?\n；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function detectTitle(input) {
  const compact = input.replace(/\s+/g, "");
  const patterns = [
    /(?:做一个|做个|开发一个|实现一个|设计一个|建设一个)([^，。；！？\n]{2,24})/,
    /(?:需求|功能|项目)[:：]([^，。；！？\n]{2,24})/
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(compact);
    if (match?.[1]) return match[1];
  }
  return "";
}

function absorbInput(input) {
  const title = detectTitle(input);
  if (title && state.facts.title === "未命名需求") state.facts.title = title;

  for (const item of splitThoughts(input)) {
    if (/背景|因为|由于|当前|现在|痛点|问题|为了/.test(item)) uniquePush(state.facts.background, item);
    if (/目标|希望|提升|降低|避免|收束|成功|效果|目的/.test(item)) uniquePush(state.facts.goals, item);
    if (/用户|运营|产品|研发|测试|领导|管理员|角色|权限|我自己/.test(item)) uniquePush(state.facts.users, item);
    if (/场景|使用|讨论|聊天|会议|过程|高频|低频/.test(item)) uniquePush(state.facts.scenarios, item);
    if (/页面|左侧|右侧|入口|流程|步骤|跳转|聊天框|文档/.test(item)) uniquePush(state.facts.flow, item);
    if (/规则|根据|必须|允许|支持|不能|需要|优先|范围|边界/.test(item)) uniquePush(state.facts.rules, item);
    if (/异常|失败|为空|断网|权限|冲突|幻觉|遗漏|风险|返工/.test(item)) uniquePush(state.facts.edgeCases, item);
    if (/埋点|指标|验收|数据|日志|成功标准/.test(item)) uniquePush(state.facts.metrics, item);
  }

  refreshDerivedFacts();
}

function refreshDerivedFacts() {
  const facts = state.facts;
  if (facts.flow.length) {
    uniquePush(facts.acceptance, "左侧可交付 PRD 应随讨论内容实时更新，右侧聊天应保留用户与各 AI 角色的上下文。");
  }
  if (facts.users.length) {
    uniquePush(facts.acceptance, "不同角色提出的问题应符合其职责视角，且不能替用户擅自拍板关键业务结论。");
  }
  if (facts.edgeCases.some((item) => item.includes("幻觉"))) {
    uniquePush(facts.acceptance, "未确认内容必须在聊天中向用户追问，不得直接写成 PRD 结论。");
  }

  facts.openQuestions = buildOpenQuestions();
}

function buildOpenQuestions() {
  const missing = [];
  if (!state.facts.background.length) missing.push("这个需求为什么现在要做，当前最大痛点是什么？");
  if (!state.facts.users.length) missing.push("核心使用者、决策者和协作角色分别是谁？");
  if (!state.facts.flow.length) missing.push("用户从哪里进入，主流程经过哪些页面或操作步骤？");
  if (!state.facts.rules.length) missing.push("哪些规则需要明确，例如保存生效、编辑删除、权限和范围边界？");
  if (!state.facts.edgeCases.length) missing.push("无数据、失败、权限不足、配置冲突等异常场景如何兜底？");
  if (!state.facts.metrics.length) missing.push("首版关键业务指标、埋点事件和可检查的交互结果是什么？");
  return missing.length ? missing : ["当前信息已具备初版 PRD 条件，后续重点是确认细节和研发约束。"];
}

function chooseQuestion(role) {
  const bank = questionBank[role];
  const index = Math.min(state.round, bank.length - 1);
  return bank[index] || fallbackAnswers[role];
}

function getExplicitRoleFromUser(input) {
  const normalized = input.replace(/\s+/g, "");
  const roleAliases = {
    pm: ["产品", "PM", "prd", "PRD"],
    user: ["用户", "使用者", "客户"],
    engineer: ["研发", "开发", "技术", "工程师"],
    leader: ["领导", "负责人", "老板", "管理"]
  };

  for (const [role, aliases] of Object.entries(roleAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) return role;
  }
  return "";
}

function getDiscussionPhaseRole() {
  const facts = state.facts;
  if (!facts.background.length || !facts.goals.length) return "pm";
  if (!facts.users.length || !facts.scenarios.length) return "user";
  if (!facts.flow.length) return "pm";
  if (!facts.rules.length || !facts.edgeCases.length) return "engineer";
  if (!facts.metrics.length || !facts.acceptance.length) return "leader";
  return "pm";
}

function buildAttentionProfile(input = "") {
  const facts = state.facts;
  const text = [
    input,
    facts.title,
    ...facts.background,
    ...facts.goals,
    ...facts.users,
    ...facts.scenarios,
    ...facts.flow,
    ...facts.rules,
    ...facts.edgeCases,
    ...facts.metrics
  ].join("\n");

  const dimensions = [
    {
      id: "background_goal",
      label: "背景目标",
      role: "pm",
      missing: !facts.background.length || !facts.goals.length,
      score: (!facts.background.length ? 4 : 0) + (!facts.goals.length ? 3 : 0) + (/为什么|背景|目标|痛点|价值|问题|现在/.test(text) ? 2 : 0)
    },
    {
      id: "user_scenario",
      label: "用户与场景",
      role: "user",
      missing: !facts.users.length || !facts.scenarios.length,
      score: (!facts.users.length ? 4 : 0) + (!facts.scenarios.length ? 4 : 0) + (/用户|客户|场景|首次|日常|高频|低频|会前|会中|会后|体验/.test(text) ? 2 : 0)
    },
    {
      id: "page_flow",
      label: "页面与流程",
      role: "pm",
      missing: !facts.flow.length,
      score: (!facts.flow.length ? 5 : 0) + (/入口|页面|流程|点击|返回|跳转|弹窗|toast|Toast|空状态/.test(text) ? 2 : 0)
    },
    {
      id: "rules_state",
      label: "规则与状态",
      role: "engineer",
      missing: !facts.rules.length,
      score: (!facts.rules.length ? 5 : 0) + (/规则|状态|保存|生效|编辑|删除|排序|权限|为空|互斥|优先级|配置/.test(text) ? 3 : 0)
    },
    {
      id: "exceptions_boundary",
      label: "异常与边界",
      role: "engineer",
      missing: !facts.edgeCases.length,
      score: (!facts.edgeCases.length ? 5 : 0) + (/异常|失败|弱网|断网|无数据|加载|权限不足|冲突|重试|中断|恢复|低电量/.test(text) ? 3 : 0)
    },
    {
      id: "priority_delivery",
      label: "优先级与交付",
      role: "leader",
      missing: !facts.metrics.length && !facts.acceptance.length,
      score: (!facts.metrics.length ? 3 : 0) + (!facts.acceptance.length ? 2 : 0) + (/优先级|MVP|范围|一期|二期|指标|埋点|验收|排期|成本|上线/.test(text) ? 4 : 0)
    }
  ].map((dimension) => ({
    ...dimension,
    score: Math.max(0, dimension.score)
  })).sort((a, b) => b.score - a.score);

  const missingCritical = dimensions.filter((dimension) => dimension.missing && dimension.score > 0);
  return {
    dimensions,
    focus: dimensions[0] || null,
    missingCritical: missingCritical.map((dimension) => dimension.id),
    readyForPrd: Boolean(
      facts.background.length
      && facts.scenarios.length
      && facts.flow.length
      && facts.rules.length
      && facts.edgeCases.length
    ),
    nextBestRole: (dimensions.find((dimension) => dimension.missing)?.role || dimensions[0]?.role || getDiscussionPhaseRole())
  };
}

function selectSpeakerRole(input) {
  const active = ["pm", "user", "engineer", "leader"].filter((role) => state.activeRoles.has(role));
  if (!active.length) return "";

  const explicitRole = getExplicitRoleFromUser(input);
  if (explicitRole && active.includes(explicitRole)) return explicitRole;

  if (state.pendingQuestionRole && active.includes(state.pendingQuestionRole)) {
    return state.pendingQuestionRole;
  }

  const attentionRole = buildAttentionProfile(input).nextBestRole;
  if (active.includes(attentionRole)) return attentionRole;

  const phaseRole = getDiscussionPhaseRole();
  if (active.includes(phaseRole)) return phaseRole;

  return active[0];
}

function generateRoleMessage(role, latestInput) {
  const facts = state.facts;
  const question = chooseQuestion(role);
  const attention = buildAttentionProfile(latestInput);
  const focus = attention.focus?.label || "当前关键缺口";

  if (role === "pm") {
    const known = [
      facts.title !== "未命名需求" ? `需求暂定为「${facts.title}」` : "需求名称还未稳定",
      facts.flow.length ? "页面形态已出现左 PRD、右讨论室的方向" : "主流程仍需明确"
    ].join("；");
    return `当前理解：${known}。我先把注意力放在「${focus}」。\n${question}`;
  }

  if (role === "user") {
    const scene = facts.scenarios.at(-1) || "需求讨论过程中逐步补全文档";
    return `我按真实用户视角补一句：当前最明确的场景是「${scene}」。我先看「${focus}」是否会影响真实使用。\n${question}`;
  }

  if (role === "engineer") {
    const risk = facts.edgeCases.at(-1) || "AI 可能脑补未确认结论";
    return `研发侧先标一个风险：${risk}。当前最需要拆的是「${focus}」。\n${question}`;
  }

  if (role === "leader") {
    const goal = facts.goals.at(-1) || "通过讨论收束需求并降低返工";
    return `我先看目标和范围：当前目标可概括为「${goal}」。这一轮先判断「${focus}」是否影响交付取舍。\n${question}`;
  }

  return fallbackAnswers[role] || latestInput;
}

function messageAsksQuestion(content) {
  return /[?？]|确认|请补充|需要明确|是否|能否|怎么|如何|哪/.test(content);
}

function getPromptSummary(role) {
  return state.rolePrompts[role].split("\n").find(Boolean) || roleMeta[role].name;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;
  let inTable = false;
  let inQuote = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  function closeQuote() {
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
  }

  function closeTable() {
    if (inTable) {
      html.push("</tbody></table>");
      inTable = false;
    }
  }

  for (const line of lines) {
    if (!line.trim()) {
      closeList();
      closeTable();
      closeQuote();
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      closeList();
      closeQuote();
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.every((cell) => /^-+$/.test(cell))) continue;
      if (!inTable) {
        html.push("<table><tbody>");
        inTable = true;
      }
      html.push(`<tr>${cells.map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`).join("")}</tr>`);
      continue;
    }

    closeTable();

    if (line.startsWith(">")) {
      closeList();
      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }
      html.push(`<p>${formatInlineMarkdown(line.replace(/^>\s?/, ""))}</p>`);
    } else if (line.startsWith("# ")) {
      closeList();
      closeQuote();
      html.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      closeQuote();
      html.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      closeQuote();
      html.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("#### ")) {
      closeList();
      closeQuote();
      html.push(`<h4>${formatInlineMarkdown(line.slice(5))}</h4>`);
    } else if (/^\s*-\s+/.test(line)) {
      closeQuote();
      if (!inList) {
        html.push('<ul class="markdown-list">');
        inList = true;
      }
      const match = line.match(/^(\s*)-\s+(.+)$/);
      const depth = Math.min(Math.floor((match?.[1] || "").replace(/\t/g, "  ").length / 2), 3);
      html.push(`<li class="list-depth-${depth}">${formatInlineMarkdown(match?.[2] || line.trim().slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      closeList();
      closeQuote();
      html.push(`<p class="numbered-line">${formatInlineMarkdown(line)}</p>`);
    } else {
      closeList();
      closeQuote();
      html.push(`<p>${formatInlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  closeTable();
  closeQuote();
  return html.join("");
}

function formatInlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function uniqueCompact(items) {
  return Array.from(new Set(items.map((item) => String(item || "").trim()).filter(Boolean)));
}

function sentenceText(items, fallback) {
  const lines = uniqueCompact(items);
  return lines.length ? lines.join("\n\n") : fallback;
}

function trimTitle(value, fallback) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.length > 24 ? `${text.slice(0, 24)}...` : text;
}

function buildDemandMarkdown(title, background, data = {}) {
  return `# ${title}

## 背景
${background}

## 要求、交互规则和文案细节
- 入口与触发
  - 触发条件：${data.trigger}
  - 输入框文案：${data.inputCopy}
  - 按钮文案：${data.buttonCopy}
- 用户操作
  - 用户在右侧聊天框输入需求、补充说明或回答角色问题。
  - 按 Enter 直接发送；按 Shift + Enter 换行。
  - 发送后用户消息展示在聊天区，左侧 PRD 按当前已确认内容实时更新。
- 角色回应
  - 每次只允许一个 AI 角色发言，前一个角色发言完成后再判断是否需要下一个角色继续。
  - 发言前在聊天区展示该角色头像和动态思考气泡，发言完成后移除思考气泡。
  - 角色必须根据上一句讨论内容判断是否发言，不按固定关键词或全员轮流回复。
- PRD 生成
  - 多个需求默认拆成多个一级标题展示，每个一级标题只描述一个需求。
  - 单个需求最多保留三个二级标题，默认只使用「背景」和「要求、交互规则和文案细节」。
  - 未确认内容只在聊天中追问，不写入左侧 PRD。
- 系统反馈与异常
  - API 不可用时展示系统消息「API 暂不可用，已使用本地兜底逻辑继续」。
  - 模型返回无法解析时保留用户已输入内容和当前 PRD，并使用本地兜底逻辑继续。`;
}

function hasDisallowedPrdContent(markdown) {
  return [
    /^#{1,4}\s*版本范围/m,
    /^#{1,4}\s*待确认/m,
    /^#{1,4}\s*涉及角色/m,
    /^#{1,4}\s*背景与目标/m,
    /^#{1,4}\s*需求触发流程/m,
    /^#{1,4}\s*关键规则/m,
    /^#{1,4}\s*风险与异常/m,
    /^#{1,4}\s*验收口径/m,
    /^#{1,4}\s*验收标准/m,
    /^#{1,4}\s*完成标准/m,
    /完成标准：/,
    /验收标准/,
    /待补充：/,
    /建议文案/,
    /可选方案表格/
  ].some((pattern) => pattern.test(markdown));
}

function buildPrdMarkdown() {
  if (state.draftMarkdown.trim() && !hasDisallowedPrdContent(state.draftMarkdown)) {
    return state.draftMarkdown;
  }

  const facts = state.facts;
  const background = sentenceText(
    [...facts.background, ...facts.goals],
    "本需求用于在多角色需求讨论中收束信息，并在左侧实时生成可交付 PRD；右侧聊天负责承接用户决策和 AI 角色追问，未确认内容只在聊天中确认。"
  );
  const demandItems = uniqueCompact([...facts.scenarios, ...facts.flow]).slice(0, 4);
  const demandTitles = demandItems.length > 1
    ? demandItems.map((item, index) => trimTitle(item, `需求 ${index + 1}`))
    : [facts.title];
  const baseData = {
    trigger: "用户进入页面后，在右侧聊天框发起需求讨论或补充已有 PRD 信息。",
    inputCopy: "输入你的需求或回复角色问题...",
    buttonCopy: "发送"
  };

  return demandTitles.map((title) => buildDemandMarkdown(title, background, baseData)).join("\n\n");
}

function buildLocalPrototypePrompt() {
  return `Create a high-fidelity UI prototype screenshot for the product requirement below.

Product context:
Use the current role prompts and PRD content as the project context. Do not invent a different product background.

Screen goal:
Create a reviewable UI prototype from the PRD below.

Source PRD:
${buildPrdMarkdown().slice(0, 12000)}

Layout:
- Follow the PRD interaction order from top to bottom.
- Show the main entry, content area, controls, feedback state, and exception state.
- Keep Chinese UI copy short and readable.

Visual style:
Clean product prototype, calm natural green accent, paper-like surface, readable typography, precise spacing, no decorative clutter.

Do not include:
Marketing poster, photorealistic people, random stock images, unrelated logos, unreadable filler text, or extra buttons not described in the PRD.`;
}

function renderPrd() {
  const markdown = buildPrdMarkdown();
  prdPreview.innerHTML = markdownToHtml(markdown);
  updateChromeStatus();
}

function startNewSession() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(`${storageKey}:updatedAt`);
  reportUsage("reset_session");
  resetState();
}

function applyFacts(nextFacts) {
  state.facts = {
    title: nextFacts.title || "未命名需求",
    background: Array.isArray(nextFacts.background) ? nextFacts.background : [],
    goals: Array.isArray(nextFacts.goals) ? nextFacts.goals : [],
    users: Array.isArray(nextFacts.users) ? nextFacts.users : [],
    scenarios: Array.isArray(nextFacts.scenarios) ? nextFacts.scenarios : [],
    flow: Array.isArray(nextFacts.flow) ? nextFacts.flow : [],
    rules: Array.isArray(nextFacts.rules) ? nextFacts.rules : [],
    edgeCases: Array.isArray(nextFacts.edgeCases) ? nextFacts.edgeCases : [],
    metrics: Array.isArray(nextFacts.metrics) ? nextFacts.metrics : [],
    acceptance: Array.isArray(nextFacts.acceptance) ? nextFacts.acceptance : [],
    openQuestions: Array.isArray(nextFacts.openQuestions) ? nextFacts.openQuestions : []
  };
  saveState();
}

function setPrdPrompt(content) {
  state.prdPrompt = content.slice(0, 30000);
  state.draftMarkdown = "";
  addMessage("system", "已更新 PRD Prompt。后续左侧 PRD 会按新的生成规则输出。");
  reportUsage("update_prd_prompt");
  renderPrd();
  saveState();
}

function resetPrdPrompt() {
  state.prdPrompt = defaultPrdPrompt;
  state.draftMarkdown = "";
  prdImportText.value = defaultPrdPrompt;
  addMessage("system", "已恢复默认 PRD Prompt。");
  reportUsage("reset_prd_prompt");
  renderPrd();
  saveState();
}

function runLocalRound(input) {
  absorbInput(input);
  const role = selectSpeakerRole(input);
  if (!role) {
    addMessage("system", "当前没有启用任何 AI 角色。请至少启用一个角色后继续讨论。");
  } else {
    const content = generateRoleMessage(role, input);
    addMessage(role, content);
    state.lastAiRole = role;
    state.pendingQuestionRole = messageAsksQuestion(content) ? role : "";
  }
  state.round += 1;
  renderPrd();
  saveState();
}

async function runRound(input) {
  sendButton.disabled = true;
  sendButton.textContent = "发送中";
  reportUsage("send_message", input.slice(0, 80));

  try {
    const attentionProfile = buildAttentionProfile(input);
    let currentSpeakerRole = selectSpeakerRole(input);
    let shouldContinue = Boolean(currentSpeakerRole);
    const maxTurns = 3;

    for (let turnIndex = 0; shouldContinue && turnIndex < maxTurns; turnIndex += 1) {
      const thinkingNode = createThinkingMessage(currentSpeakerRole);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          latestUserInput: input,
          messages: state.messages,
          facts: state.facts,
          prdPrompt: state.prdPrompt,
          draftMarkdown: buildPrdMarkdown(),
          rolePrompts: state.rolePrompts,
          activeRoles: Array.from(state.activeRoles),
          currentSpeakerRole,
          turnIndex,
          maxTurns,
          attentionProfile,
          pendingQuestionRole: state.pendingQuestionRole,
          lastAiRole: state.lastAiRole
        })
      });
      const payload = await response.json();
      removeThinkingMessage(thinkingNode);
      if (!payload.ok) throw new Error(payload.error || "API 请求失败");

      const result = payload.result;
      applyFacts(result.facts);
      if (
        typeof result.draftMarkdown === "string"
        && result.draftMarkdown.trim()
        && !hasDisallowedPrdContent(result.draftMarkdown)
      ) {
        state.draftMarkdown = result.draftMarkdown.trim();
        saveState();
      }
      addMessage(result.speakerRole, result.message);
      state.pendingQuestionRole = result.pendingQuestionRole || "";
      state.lastAiRole = result.lastAiRole || result.speakerRole;
      renderPrd();

      const nextSpeakerRole = result.nextSpeakerRole || "";
      shouldContinue = Boolean(result.shouldContinue && nextSpeakerRole && state.activeRoles.has(nextSpeakerRole));
      currentSpeakerRole = nextSpeakerRole;
    }

    state.round += 1;
    renderPrd();
    saveState();
  } catch (error) {
    addMessage("system", `API 暂不可用，已使用本地兜底逻辑继续：${error.message}`);
    runLocalRound(input);
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "发送";
    messageInput.focus();
  }
}

function resetState() {
  state.messages = [];
  state.round = 0;
  state.facts = {
    title: "未命名需求",
    background: [],
    goals: [],
    users: [],
    scenarios: [],
    flow: [],
    rules: [],
    edgeCases: [],
    metrics: [],
    acceptance: [],
    openQuestions: [
      "需求背景、涉及角色、方案范围、关键规则和风险点仍需在讨论中确认。"
    ]
  };
  state.editingRole = "pm";
  state.pendingQuestionRole = "";
  state.lastAiRole = "";
  state.nextSpeakerRole = "";
  state.prdPrompt = defaultPrdPrompt;
  state.draftMarkdown = "";
  chatLog.innerHTML = "";
  addMessage("system", "讨论室已就绪。先描述需求背景或当前想法，我会让产品、用户、研发、领导四个视角分别追问，并在左侧实时沉淀可交付 PRD。");
  syncPromptEditor();
  renderPrd();
  saveState();
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = messageInput.value.trim();
  if (!input) return;
  addMessage("me", input);
  messageInput.value = "";
  runRound(input);
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

resetButton.addEventListener("click", startNewSession);

roleSettingsButton.addEventListener("click", () => {
  roleSettingsPanel.hidden = !roleSettingsPanel.hidden;
});

copyPrdButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(buildPrdMarkdown());
  copyPrdButton.textContent = "已复制";
  window.setTimeout(() => {
    copyPrdButton.textContent = "复制 Markdown";
  }, 1200);
});

async function saveDemandSnapshot() {
  const defaultDir = localStorage.getItem("prd-discussion-generator:last-save-dir") || "D:\\work space\\需求缓存";
  const baseDir = window.prompt("请输入保存文件夹路径（这是运行服务的电脑上的路径）", defaultDir);
  if (!baseDir) return;
  localStorage.setItem("prd-discussion-generator:last-save-dir", baseDir);

  const response = await fetch("/api/save-demand", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-prd-session-id": getSessionId()
    },
    body: JSON.stringify({
      baseDir,
      title: state.facts.title || "未命名需求",
      state: getSerializableState(),
      draftMarkdown: buildPrdMarkdown(),
      facts: state.facts,
      messages: state.messages
    })
  });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || "保存失败");
  addMessage("system", `已保存需求缓存：${payload.result.directory}`);
  reportUsage("save_demand", payload.result.directory);
}

async function loadDemandSnapshot() {
  const filePath = window.prompt("请输入要恢复的 .session.json 文件路径");
  if (!filePath) return;

  const response = await fetch("/api/load-demand", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-prd-session-id": getSessionId()
    },
    body: JSON.stringify({ filePath })
  });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || "读取失败");
  const savedState = payload.result.state || payload.result;
  isRestoringState = true;
  applySavedState(savedState);
  isRestoringState = false;
  saveState();
  addMessage("system", `已恢复需求缓存：${payload.result.title || savedState.facts?.title || "未命名需求"}`);
  reportUsage("load_demand", filePath);
}

saveDemandButton.addEventListener("click", async () => {
  saveDemandButton.disabled = true;
  try {
    await saveDemandSnapshot();
  } catch (error) {
    addMessage("system", `保存需求失败：${error.message}`);
  } finally {
    saveDemandButton.disabled = false;
  }
});

loadDemandButton.addEventListener("click", async () => {
  loadDemandButton.disabled = true;
  try {
    await loadDemandSnapshot();
  } catch (error) {
    addMessage("system", `打开缓存失败：${error.message}`);
  } finally {
    loadDemandButton.disabled = false;
  }
});

openPrdImportButton.addEventListener("click", () => {
  prdImportPanel.hidden = !prdImportPanel.hidden;
  if (!prdImportPanel.hidden) {
    prdImportText.value = state.prdPrompt;
    prdImportText.focus();
  }
});

function setPrototypePromptButtonTitle(content) {
  const titleNode = generatePrototypePromptButton.querySelector("[data-prototype-button-title]")
    || generatePrototypePromptButton.querySelector(".tool-title")
    || generatePrototypePromptButton.querySelector("strong")
    || generatePrototypePromptButton.querySelector("span");
  if (titleNode) {
    titleNode.textContent = content;
  } else {
    generatePrototypePromptButton.textContent = content;
  }
}

const copyLocalizationUi = (() => {
  const button = document.querySelector("#localizeCopyButton");
  const panel = document.createElement("section");
  panel.className = "floating-panel";
  panel.id = "copyLocalizationPanel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="floating-panel__head">
      <div>
        <p class="eyebrow">Localization</p>
        <h2>产品文案多语言交付</h2>
      </div>
      <button class="ghost-button" id="closeCopyLocalizationButton" type="button">关闭</button>
    </div>
    <textarea id="copyLocalizationText" spellcheck="false" placeholder="翻译结果会显示在这里"></textarea>
    <div class="floating-panel__actions">
      <button class="secondary-button" id="copyLocalizationResultButton" type="button">复制结果</button>
    </div>
  `;
  document.body.appendChild(panel);

  return {
    button,
    panel,
    title: button.querySelector("[data-copy-localization-title]"),
    closeButton: panel.querySelector("#closeCopyLocalizationButton"),
    copyButton: panel.querySelector("#copyLocalizationResultButton"),
    textarea: panel.querySelector("#copyLocalizationText")
  };
})();

function formatCopyLocalizationResult(result = {}) {
  const lines = [];
  const handoffRows = Array.isArray(result.handoffRows) ? result.handoffRows : [];
  if (handoffRows.length) {
    const columns = ["序号", "原文", "使用场景", "繁中", "日语", "韩语", "英语", "俄语", "法语", "德语", "阿拉伯语", "西班牙语", "泰语", "马来语", "荷兰语", "备注"]
      .filter((column) => handoffRows.some((row) => Object.prototype.hasOwnProperty.call(row, column)));
    lines.push("# 产品内文案多语言交付表", "");
    lines.push(`| ${columns.join(" | ")} |`);
    lines.push(`| ${columns.map(() => "---").join(" | ")} |`);
    for (const row of handoffRows) {
      lines.push(`| ${columns.map((column) => String(row[column] ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>")).join(" | ")} |`);
    }
    lines.push("");
  }

  const items = Array.isArray(result.items) ? result.items : [];
  if (!handoffRows.length && items.length) {
    lines.push("# 产品内文案翻译表", "");
    for (const item of items) {
      lines.push(`## ${item.id || "copy"}`);
      lines.push(`- 场景：${item.scenario || "未标注"}`);
      lines.push(`- 类型：${item.type || "other"}`);
      lines.push(`- 中文：${item.sourceZh || ""}`);
      const translations = item.translations || {};
      for (const [locale, text] of Object.entries(translations)) {
        lines.push(`- ${locale}：${text || ""}`);
      }
      if (item.notes) lines.push(`- 备注：${item.notes}`);
      lines.push("");
    }
  }

  const pendingQuestions = Array.isArray(result.pendingQuestions) ? result.pendingQuestions : [];
  if (pendingQuestions.length) {
    lines.push("# 待确认问题", "");
    for (const question of pendingQuestions) {
      if (typeof question === "string") {
        lines.push(`- ${question}`);
      } else {
        const parts = ["原文", "场景缺口", "方案A", "方案A理由", "方案B", "方案B理由", "方案C", "方案C理由", "建议选择"]
          .filter((key) => question[key])
          .map((key) => `${key}：${question[key]}`);
        lines.push(`- ${parts.join("；")}`);
      }
    }
  }

  return lines.join("\n").trim() || "未提取到可翻译的产品内文案。";
}

async function generateCopyLocalization() {
  copyLocalizationUi.button.disabled = true;
  copyLocalizationUi.title.textContent = "生成中";
  copyLocalizationUi.panel.hidden = false;
  copyLocalizationUi.textarea.value = "正在提取 PRD 中的产品内文案并生成多语言交付表...";
  reportUsage("generate_localization");

  try {
    const response = await fetch("/api/localize-copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draftMarkdown: state.draftMarkdown || "",
        facts: state.facts,
        prdPrompt: state.prdPrompt,
        rolePrompts: state.rolePrompts,
        targetLocales: ["繁中", "日语", "韩语", "英语", "俄语", "法语", "德语", "阿拉伯语", "西班牙语", "泰语", "马来语", "荷兰语"]
      })
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "文案翻译失败");
    copyLocalizationUi.textarea.value = formatCopyLocalizationResult(payload.result);
    if (payload.warning) addMessage("system", payload.warning);
  } catch (error) {
    copyLocalizationUi.textarea.value = `文案翻译失败：${error.message}`;
    addMessage("system", `文案翻译失败：${error.message}`);
  } finally {
    copyLocalizationUi.button.disabled = false;
    copyLocalizationUi.title.textContent = "文案翻译";
    copyLocalizationUi.textarea.focus();
  }
}

generatePrototypePromptButton.addEventListener("click", async () => {
  generatePrototypePromptButton.disabled = true;
  setPrototypePromptButtonTitle("生成中");
  prototypePromptPanel.hidden = false;
  prototypePromptText.value = "正在生成原型图 Prompt...";
  reportUsage("generate_prototype_prompt");

  try {
    const response = await fetch("/api/prototype-prompt", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        draftMarkdown: buildPrdMarkdown(),
        facts: state.facts,
        prdPrompt: state.prdPrompt,
        rolePrompts: state.rolePrompts
      })
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "生成失败");
    prototypePromptText.value = payload.result.prompt;
  } catch (error) {
    prototypePromptText.value = buildLocalPrototypePrompt();
    addMessage("system", `原型图 Prompt 已使用本地兜底生成：${error.message}`);
  } finally {
    generatePrototypePromptButton.disabled = false;
    setPrototypePromptButtonTitle("生成原型图 Prompt");
    prototypePromptText.focus();
  }
});

closePrdImportButton.addEventListener("click", () => {
  prdImportPanel.hidden = true;
});

closePrototypePromptButton.addEventListener("click", () => {
  prototypePromptPanel.hidden = true;
});

applyPrdImportButton.addEventListener("click", () => {
  const content = prdImportText.value.trim();
  if (!content) {
    addMessage("system", "PRD Prompt 不能为空。");
    return;
  }
  setPrdPrompt(content);
  prdImportPanel.hidden = true;
});

clearPrdImportButton.addEventListener("click", () => {
  resetPrdPrompt();
});

copyPrototypePromptButton.addEventListener("click", async () => {
  const text = prototypePromptText.value.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyPrototypePromptButton.textContent = "已复制";
  window.setTimeout(() => {
    copyPrototypePromptButton.textContent = "复制提示词";
  }, 1200);
});

function syncRoleCards() {
  for (const card of roleButtons) {
    const role = card.dataset.role;
    card.classList.toggle("active", state.activeRoles.has(role));
  }
  for (const toggle of roleToggles) {
    toggle.checked = state.activeRoles.has(toggle.dataset.roleToggle);
  }
  updateChromeStatus();
}

copyLocalizationUi.button.addEventListener("click", generateCopyLocalization);

copyLocalizationUi.closeButton.addEventListener("click", () => {
  copyLocalizationUi.panel.hidden = true;
});

copyLocalizationUi.copyButton.addEventListener("click", async () => {
  const text = copyLocalizationUi.textarea.value.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyLocalizationUi.copyButton.textContent = "已复制";
  setTimeout(() => {
    copyLocalizationUi.copyButton.textContent = "复制结果";
  }, 1200);
});

function syncPromptEditor() {
  const role = state.editingRole;
  promptEditorTitle.textContent = `编辑「${roleMeta[role].name}」Prompt`;
  rolePromptInput.value = state.rolePrompts[role];
}

for (const toggle of roleToggles) {
  toggle.addEventListener("change", () => {
    const role = toggle.dataset.roleToggle;
    if (toggle.checked) {
      state.activeRoles.add(role);
    } else {
      state.activeRoles.delete(role);
    }
    syncRoleCards();
    saveState();
  });
}

for (const button of editRoleButtons) {
  button.addEventListener("click", () => {
    state.editingRole = button.dataset.editRole;
    roleSettingsPanel.hidden = false;
    promptEditor.hidden = false;
    syncPromptEditor();
  });
}

closePromptEditor.addEventListener("click", () => {
  promptEditor.hidden = true;
});

savePromptButton.addEventListener("click", () => {
  state.rolePrompts[state.editingRole] = rolePromptInput.value.trim() || defaultRolePrompts[state.editingRole];
  addMessage("system", `已更新「${roleMeta[state.editingRole].name}」Prompt：${getPromptSummary(state.editingRole)}`);
  reportUsage("update_role_prompt", state.editingRole);
  saveState();
});

resetPromptButton.addEventListener("click", () => {
  state.rolePrompts[state.editingRole] = defaultRolePrompts[state.editingRole];
  syncPromptEditor();
  reportUsage("reset_role_prompt", state.editingRole);
  saveState();
});

window.addEventListener("beforeunload", saveState);

if (!restoreState() && !localStorage.getItem(storageKey)) {
  resetState();
}

reportUsage("page_ready");
window.setInterval(() => {
  reportUsage("heartbeat");
}, 30000);
