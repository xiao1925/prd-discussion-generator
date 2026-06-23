import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const backendSkillsDir = path.join(__dirname, "backend-skills");
const defaultPort = Number(process.env.PORT || 4188);
const defaultModel = "gpt-5.5";
const backendSkills = {};
const wikiSearchCache = new Map();
const defaultLocalizationColumns = ["繁中", "日语", "韩语", "英语", "俄语", "法语", "德语", "阿拉伯语", "西班牙语", "泰语", "马来语", "荷兰语"];
const usageEvents = [];
const usageSessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const resolved = path.normalize(path.join(publicDir, requested));

  if (!resolved.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(resolved);
    const contentType = mimeTypes[path.extname(resolved).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store"
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "";
}

function getSessionId(req) {
  return String(req.headers["x-prd-session-id"] || req.headers["x-session-id"] || "").slice(0, 80);
}

function recordUsage(req, event = {}) {
  const now = new Date();
  const sessionId = event.sessionId || getSessionId(req) || `${getClientIp(req) || "unknown"}:${req.headers["user-agent"] || "unknown"}`;
  const item = {
    time: now.toISOString(),
    ip: getClientIp(req),
    sessionId,
    method: req.method,
    path: event.path || new URL(req.url, "http://localhost").pathname,
    action: event.action || "",
    status: event.status || "",
    detail: String(event.detail || "").slice(0, 300),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 180)
  };

  usageEvents.push(item);
  while (usageEvents.length > 300) usageEvents.shift();

  const existing = usageSessions.get(sessionId) || {
    sessionId,
    ip: item.ip,
    firstSeen: item.time,
    lastSeen: item.time,
    userAgent: item.userAgent,
    events: 0,
    lastAction: ""
  };
  existing.ip = item.ip || existing.ip;
  existing.lastSeen = item.time;
  existing.userAgent = item.userAgent || existing.userAgent;
  existing.events += 1;
  existing.lastAction = item.action || item.path;
  usageSessions.set(sessionId, existing);
}

function getUsageSnapshot() {
  const now = Date.now();
  const sessions = [...usageSessions.values()]
    .map((session) => ({
      ...session,
      online: now - Date.parse(session.lastSeen) < 2 * 60 * 1000
    }))
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen));
  return {
    ok: true,
    now: new Date().toISOString(),
    onlineCount: sessions.filter((session) => session.online).length,
    sessionCount: sessions.length,
    sessions,
    recentEvents: usageEvents.slice(-80).reverse()
  };
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > limit) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sanitizeFileName(name, fallback = "未命名需求") {
  return String(name || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || fallback;
}

function formatDiscussionMarkdown(messages = []) {
  if (!Array.isArray(messages) || !messages.length) return "# 讨论记录\n\n暂无讨论记录。\n";
  const lines = ["# 讨论记录", ""];
  for (const message of messages) {
    const role = message.role || "unknown";
    const time = message.time || "";
    const content = String(message.content || "").trim();
    lines.push(`## ${role}${time ? ` · ${time}` : ""}`, "", content || "（空）", "");
  }
  return lines.join("\n");
}

async function handleSaveDemand(req, res) {
  try {
    const raw = await readBody(req, 5_000_000);
    const payload = JSON.parse(raw || "{}");
    const baseDir = String(payload.baseDir || "").trim();
    if (!baseDir) {
      sendJson(res, 400, { ok: false, error: "保存目录不能为空。" });
      return;
    }

    const title = sanitizeFileName(payload.title || payload.facts?.title);
    const demandDir = path.resolve(baseDir, title);
    await fs.mkdir(demandDir, { recursive: true });

    const savedAt = new Date().toISOString();
    const snapshot = {
      version: 1,
      savedAt,
      title,
      state: payload.state || {},
      draftMarkdown: String(payload.draftMarkdown || ""),
      facts: payload.facts || {},
      messages: Array.isArray(payload.messages) ? payload.messages : []
    };

    const stamp = savedAt.replace(/[:.]/g, "-");
    const fileBase = `${title}.${stamp}`;
    const sessionPath = path.join(demandDir, `${fileBase}.session.json`);
    const prdPath = path.join(demandDir, `${fileBase}.prd.md`);
    const discussionPath = path.join(demandDir, `${fileBase}.discussion.md`);

    await fs.writeFile(sessionPath, JSON.stringify(snapshot, null, 2), "utf8");
    await fs.writeFile(prdPath, snapshot.draftMarkdown || "# 未命名需求\n", "utf8");
    await fs.writeFile(discussionPath, formatDiscussionMarkdown(snapshot.messages), "utf8");

    recordUsage(req, { action: "save_demand", detail: demandDir });
    sendJson(res, 200, {
      ok: true,
      result: {
        directory: demandDir,
        files: {
          session: sessionPath,
          prd: prdPath,
          discussion: discussionPath
        },
        savedAt
      }
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}

async function handleLoadDemand(req, res) {
  try {
    const raw = await readBody(req, 1_000_000);
    const payload = JSON.parse(raw || "{}");
    const filePath = String(payload.filePath || "").trim();
    if (!filePath) {
      sendJson(res, 400, { ok: false, error: "缓存文件路径不能为空。" });
      return;
    }

    const resolved = path.resolve(filePath);
    const content = await fs.readFile(resolved, "utf8");
    const snapshot = JSON.parse(content);
    recordUsage(req, { action: "load_demand", detail: resolved });
    sendJson(res, 200, { ok: true, result: snapshot });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}

async function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env is optional; production should use real environment variables.
  }
}

function stripSkillFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\s*/, "").trim();
}

async function loadBackendSkills() {
  for (const name of ["prd-template", "prototype-image-prompt", "ainote-role-context", "wiki-retrieval", "product-copy-localization", "discussion-orchestration"]) {
    try {
      const filePath = path.join(backendSkillsDir, name, "SKILL.md");
      backendSkills[name] = stripSkillFrontmatter(await fs.readFile(filePath, "utf8"));
    } catch {
      backendSkills[name] = "";
    }
  }
}

function getWikiConfig() {
  return {
    enabled: String(process.env.WIKI_ENABLED || "").toLowerCase() === "true",
    baseUrl: (process.env.WIKI_BASE_URL || "http://10.10.124.11:8787").replace(/\/$/, ""),
    token: process.env.WIKI_TOKEN || "",
    timeoutMs: Number(process.env.WIKI_TIMEOUT_MS || 5000),
    cacheTtlMs: Number(process.env.WIKI_CACHE_TTL_MS || 5 * 60 * 1000),
    searchPath: process.env.WIKI_SEARCH_PATH || "/api/wiki/search",
    docPath: process.env.WIKI_DOC_PATH || "/api/wiki/doc",
    chunkPath: process.env.WIKI_CHUNK_PATH || "/api/wiki/chunk",
    indexDocId: process.env.WIKI_INDEX_DOC_ID || "wiki/index.md",
    maxSearchResults: Number(process.env.WIKI_MAX_SEARCH_RESULTS || 12),
    maxExpandedChunks: Number(process.env.WIKI_MAX_EXPANDED_CHUNKS || 4)
  };
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      const message = data?.error || data?.message || response.statusText;
      throw new Error(`HTTP ${response.status}: ${message}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function buildWikiHeaders(config) {
  const headers = { accept: "application/json" };
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`;
    headers["x-wiki-token"] = config.token;
  }
  return headers;
}

function normalizeWikiItems(data) {
  const rawItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];

  return rawItems.map((item, index) => ({
    chunkId: String(item.chunkId || item.id || item.chunk_id || ""),
    docId: String(item.docId || item.doc_id || item.path || item.source || ""),
    title: String(item.title || item.name || item.docTitle || `知识片段 ${index + 1}`),
    path: String(item.path || item.docPath || item.doc_id || item.docId || ""),
    snippet: String(item.snippet || item.summary || item.text || item.content || "").slice(0, 1200),
    updatedAt: String(item.updatedAt || item.updated_at || item.mtime || ""),
    score: Number(item.score || item.rank || 0)
  })).filter((item) => item.title || item.snippet || item.docId);
}

async function searchWiki(query, limit = 5) {
  const config = getWikiConfig();
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) return { ok: false, error: "检索词为空", items: [] };

  const cacheKey = `${normalizedQuery}::${limit}`;
  const cached = wikiSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < config.cacheTtlMs) {
    return { ...cached.value, cached: true };
  }

  const url = new URL(`${config.baseUrl}${config.searchPath}`);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("limit", String(limit));

  try {
    const data = await fetchJsonWithTimeout(url, {
      method: "GET",
      headers: buildWikiHeaders(config)
    }, config.timeoutMs);
    const value = {
      ok: true,
      baseUrl: config.baseUrl,
      query: normalizedQuery,
      items: normalizeWikiItems(data).slice(0, limit)
    };
    wikiSearchCache.set(cacheKey, { savedAt: Date.now(), value });
    return value;
  } catch (error) {
    if (cached?.value) return { ...cached.value, ok: true, cached: true, stale: true, warning: error.message };
    return {
      ok: false,
      baseUrl: config.baseUrl,
      query: normalizedQuery,
      error: error.message,
      items: []
    };
  }
}

async function fetchWikiDoc(docId) {
  const config = getWikiConfig();
  const normalizedDocId = String(docId || "").trim();
  if (!normalizedDocId) return null;

  const url = new URL(`${config.baseUrl}${config.docPath}/${encodeURIComponent(normalizedDocId)}`);
  const data = await fetchJsonWithTimeout(url, {
    method: "GET",
    headers: buildWikiHeaders(config)
  }, config.timeoutMs);
  return data?.doc || data?.item || data;
}

async function fetchWikiChunk(chunkId) {
  const config = getWikiConfig();
  const normalizedChunkId = String(chunkId || "").trim();
  if (!normalizedChunkId) return null;

  const url = new URL(`${config.baseUrl}${config.chunkPath}/${encodeURIComponent(normalizedChunkId)}`);
  const data = await fetchJsonWithTimeout(url, {
    method: "GET",
    headers: buildWikiHeaders(config)
  }, config.timeoutMs);
  return data?.item || data?.chunk || data;
}

function buildWikiQuery(payload = {}) {
  const facts = normalizeFacts(payload.facts || {});
  return [
    payload.latestUserInput,
    facts.title,
    ...facts.background.slice(-2),
    ...facts.scenarios.slice(-2),
    ...facts.flow.slice(-2),
    ...facts.rules.slice(-2)
  ].filter(Boolean).join("\n").slice(0, 1200);
}

function buildWikiQueries(payload = {}) {
  const facts = normalizeFacts(payload.facts || {});
  const latest = String(payload.latestUserInput || "").trim();
  const background = facts.background.slice(-2).join(" ");
  const scenarios = facts.scenarios.slice(-2).join(" ");
  const flow = facts.flow.slice(-3).join(" ");
  const rules = facts.rules.slice(-3).join(" ");
  const seeds = [
    latest,
    [facts.title, latest].filter(Boolean).join(" "),
    [facts.title, background, scenarios].filter(Boolean).join(" "),
    [facts.title, flow, rules].filter(Boolean).join(" "),
    ["index", "索引", facts.title, latest].filter(Boolean).join(" ")
  ];
  const queries = [];
  for (const seed of seeds) {
    const query = String(seed || "").replace(/\s+/g, " ").trim().slice(0, 500);
    if (query && !queries.includes(query)) queries.push(query);
  }
  return queries.slice(0, 5);
}

function shouldSearchWiki(payload = {}) {
  if (String(process.env.WIKI_AUTO_SEARCH_ALWAYS || "").toLowerCase() === "true") return true;

  const facts = normalizeFacts(payload.facts || {});
  const recentMessages = Array.isArray(payload.messages)
    ? payload.messages.slice(-6).map((message) => `${message.role || ""}:${message.content || message.text || ""}`)
    : [];
  const text = [
    payload.latestUserInput,
    facts.title,
    ...facts.background.slice(-2),
    ...facts.scenarios.slice(-2),
    ...facts.flow.slice(-2),
    ...facts.rules.slice(-2),
    ...recentMessages
  ].filter(Boolean).join("\n").slice(-3000);

  return /wiki|知识库|已有文档|历史|之前|旧版本|规范|规则|接口|API|字段|权限|埋点|数据定义|技术方案|PRD|prd|竞品|市场|品牌|口径|术语|同步|转写|纪要|手写/.test(text);
}
function getWikiTerms(text) {
  const normalized = String(text || "").toLowerCase();
  const terms = new Set();
  for (const match of normalized.matchAll(/[a-z0-9][a-z0-9_-]{1,}/g)) terms.add(match[0]);
  for (const match of normalized.matchAll(/[\u4e00-\u9fa5]{2,}/g)) {
    const phrase = match[0];
    if (phrase.length <= 12) terms.add(phrase);
    for (let index = 0; index < phrase.length - 1; index += 2) {
      terms.add(phrase.slice(index, index + 2));
    }
  }
  return [...terms].filter((term) => term.length >= 2).slice(0, 80);
}

function selectRelevantIndexLines(indexDoc, queries) {
  const content = String(indexDoc?.content || indexDoc?.text || indexDoc?.markdown || "");
  if (!content) return [];

  const terms = getWikiTerms(queries.join("\n"));
  const scored = content.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-*_]{3,}$/.test(line))
    .map((line) => {
      const lower = line.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (lower.includes(term) ? Math.min(term.length, 8) : 0), 0);
      return { line, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((item) => item.line.slice(0, 260));
  return [...new Set(scored)];
}

function mergeWikiItems(results, queries) {
  const terms = getWikiTerms(queries.join("\n"));
  const merged = new Map();
  for (const result of results) {
    for (const item of result.items || []) {
      const key = item.chunkId || item.docId || item.path || `${item.title}:${item.snippet.slice(0, 80)}`;
      const text = `${item.title}\n${item.path}\n${item.docId}\n${item.snippet}`.toLowerCase();
      const lexicalScore = terms.reduce((sum, term) => sum + (text.includes(term) ? Math.min(term.length, 8) : 0), 0);
      const ranked = {
        ...item,
        score: Number(item.score || 0) + lexicalScore,
        matchedQueries: [result.query].filter(Boolean)
      };
      const existing = merged.get(key);
      if (!existing || ranked.score > existing.score) {
        merged.set(key, existing ? { ...ranked, matchedQueries: [...new Set([...existing.matchedQueries, ...ranked.matchedQueries])] } : ranked);
      } else {
        existing.matchedQueries = [...new Set([...existing.matchedQueries, ...ranked.matchedQueries])];
      }
    }
  }
  return [...merged.values()].sort((a, b) => b.score - a.score);
}

async function expandWikiItems(items) {
  const config = getWikiConfig();
  const expanded = [];
  for (const item of items.slice(0, config.maxExpandedChunks)) {
    if (!item.chunkId) {
      expanded.push(item);
      continue;
    }
    try {
      const chunk = await fetchWikiChunk(item.chunkId);
      expanded.push({
        ...item,
        snippet: String(chunk?.content || chunk?.text || chunk?.snippet || item.snippet || "").slice(0, 1800),
        updatedAt: String(chunk?.updatedAt || chunk?.updated_at || item.updatedAt || ""),
        path: String(chunk?.path || item.path || ""),
        docId: String(chunk?.docId || chunk?.doc_id || item.docId || "")
      });
    } catch {
      expanded.push(item);
    }
  }
  return [...expanded, ...items.slice(config.maxExpandedChunks)];
}

async function retrieveWikiContext(payload) {
  const config = getWikiConfig();
  const queries = buildWikiQueries(payload);
  if (!queries.length) return { ok: false, error: "检索词为空", queries, items: [] };

  let indexLines = [];
  try {
    const indexDoc = await fetchWikiDoc(config.indexDocId);
    indexLines = selectRelevantIndexLines(indexDoc, queries);
  } catch {
    indexLines = [];
  }

  const results = await Promise.all(queries.map((query) => searchWiki(query, 6)));
  const items = await expandWikiItems(mergeWikiItems(results, queries).slice(0, config.maxSearchResults));
  const failed = results.filter((result) => !result.ok).map((result) => result.error).filter(Boolean);
  return {
    ok: items.length > 0 || indexLines.length > 0,
    queries,
    indexLines,
    items,
    error: failed[0] || ""
  };
}

function formatWikiContext(searchResult) {
  if (!searchResult?.ok || !searchResult.items?.length) {
    if (searchResult?.indexLines?.length) {
      return `以下是 LLM Wiki 的 index.md 相关索引行。只能基于这些索引定位知识，不要编造未检索到的内容。\n\n${searchResult.indexLines.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;
    }
    return searchResult?.error ? `知识库检索不可用：${searchResult.error}` : "";
  }

  const items = searchResult.items.map((item, index) => [
    `### ${index + 1}. ${item.title}`,
    item.path || item.docId ? `- 来源：${item.path || item.docId}` : "",
    item.updatedAt ? `- 更新时间：${item.updatedAt}` : "",
    item.matchedQueries?.length ? `- 命中检索：${item.matchedQueries.slice(0, 2).join(" / ")}` : "",
    item.snippet ? `- 相关片段：${item.snippet}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");

  const indexSection = searchResult.indexLines?.length
    ? `\n\n[index.md 相关索引]\n${searchResult.indexLines.slice(0, 12).map((line, index) => `${index + 1}. ${line}`).join("\n")}`
    : "";

  return `以下是局域网 LLM Wiki 的只读证据包。这个 wiki 是由大模型维护的 Markdown 精华百科，不是原始资料搬运。优先相信 Wiki 页面和 index.md 定位，其次使用 chunk 片段；不要编造未检索到的内容；引用到 PRD 或发言时保留来源标题或路径。${indexSection}\n\n${items}`;
}

async function enrichPayloadWithWiki(payload) {
  const config = getWikiConfig();
  if (!config.enabled) return payload;
  if (!shouldSearchWiki(payload)) return payload;

  const searchResult = await retrieveWikiContext(payload);
  return {
    ...payload,
    wikiSearchResult: searchResult,
    wikiContext: formatWikiContext(searchResult)
  };
}
function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 20);
}

function normalizeFacts(value = {}) {
  return {
    title: String(value.title || "未命名需求").trim() || "未命名需求",
    background: normalizeStringArray(value.background),
    goals: normalizeStringArray(value.goals),
    users: normalizeStringArray(value.users),
    scenarios: normalizeStringArray(value.scenarios),
    flow: normalizeStringArray(value.flow),
    rules: normalizeStringArray(value.rules),
    edgeCases: normalizeStringArray(value.edgeCases),
    metrics: normalizeStringArray(value.metrics),
    acceptance: normalizeStringArray(value.acceptance),
    openQuestions: normalizeStringArray(value.openQuestions)
  };
}

function buildOrchestratorInstructions() {
  return `你是一个“需求讨论室”编排器，负责模拟多角色需求讨论，并维护左侧实时可交付 PRD。

核心原则：
1. 用户发言拥有最高优先级。用户明确要求某个角色发言时，必须优先选择该角色。
2. 你每次只扮演一个正在发言的角色。不要一次性输出多个角色的结论。
   - 如果 payload.currentSpeakerRole 不为空，本次 speakerRole 必须等于 currentSpeakerRole。
   - 你只能决定下一位 nextSpeakerRole，不能在本次切换自己要扮演的角色。
3. 如果上一轮某个角色向用户提问，用户本轮像是在回答该问题，则优先让同一角色承接。
4. 如果没有明确承接关系，则按讨论阶段选择角色：
   - 背景、目标、需求范围不清楚：资深产品
   - 真实场景、用户阻力、首次/日常使用不清楚：用户
   - 状态、接口、保存生效、异常、权限、实现风险不清楚：研发
   - 交付优先级、完成标准、上线指标不清楚：领导
5. 角色之间可以基于上一句内容互相回应，但不要抢用户决策权。
6. 未确认的信息必须在 message 中向用户提问，不要写进 draftMarkdown。左侧 draftMarkdown 只展示已经确定或可作为当前方案交付的 PRD 内容。
7. 左侧文档是可交付 PRD，不是建议清单、不是版本范围说明、不是会议纪要。
8. 回复要短，每次优先推进一个关键问题或一个明确结论。
9. 每次发言前先检查上一位发言者的内容中是否存在漏洞、隐含假设、缺失视角或需要反驳/补充的地方。
10. 如果你认为还需要另一个角色继续讨论，在 nextSpeakerRole 中给出下一个角色，并设置 shouldContinue=true。
11. 只有当下一个角色确实能补充、质疑或收束当前角色观点时才继续，不要为了热闹强行继续。
12. 一轮用户发言后最多连续 3 个 AI 角色发言。到达 maxTurns 时必须 shouldContinue=false。
13. 选择 nextSpeakerRole 时按以下互动触发规则：
   - 产品发言后，如果缺少实现边界/状态/异常，优先研发；如果缺少真实场景，优先用户；如果范围过大，优先领导。
   - 用户发言后，如果是体验诉求，优先产品转成需求规则；如果涉及失败/性能/数据，优先研发；如果诉求过多，优先领导排序。
   - 研发发言后，如果提出技术限制，优先产品判断产品取舍；如果影响用户体验，优先用户；如果影响排期，优先领导。
   - 领导发言后，如果需要落地拆解，优先产品；如果需要技术 MVP，优先研发；如果范围压缩影响体验，优先用户。
14. 不要连续两次选择同一个角色，除非用户明确点名或 pendingQuestionRole 要承接用户回答。
15. 如果 payload 中存在 prdPrompt，draftMarkdown 必须严格遵守该 PRD Prompt 的标题结构、段落规则和禁止项。
16. draftMarkdown 应是左侧可直接展示和复制的完整 Markdown PRD 草稿，不要输出模板解释或格式建议。
17. 涉及页面文案、按钮文案、Toast、弹窗、空状态、错误提示等文案需要选择时，必须在 message 中给出 2-4 个候选方案，并分别说明每个方案出现的理由，让用户决断；不要把未选择的候选文案写入 draftMarkdown。
18. 如果 payload.wikiContext 存在，必须把它视为只读 LLM Wiki 证据包：优先依据 index.md 定位和 Wiki 精华页面，其次参考 chunk 片段，不要把 Raw Sources 当成已决策结论；只能使用其中明确出现的信息，不要编造 wiki 内容；引用到 PRD 或发言时保留来源标题或路径；如果 wikiContext 表示检索不可用，不要阻塞讨论，只说明需要后续确认。
19. 注意力分配必须先看 payload.attentionProfile：优先处理 score 最高且 missing=true 的维度；如果用户明确要求某个方向，以用户要求为准。
20. 多轮梳理顺序默认是：背景目标 -> 用户/角色/场景 -> 页面/流程 -> 规则/状态 -> 异常/边界 -> 优先级/交付 -> PRD 就绪判断。不要一次性问完整清单，每轮只推进最关键的 1-3 个问题。
21. 如果 attentionProfile.readyForPrd=true，角色应主动收束，不要继续机械追问；如果还缺关键信息，应说明缺口并只问最影响返工的问题。
22. 底层编排不得写死具体产品线规则。产品线背景、横屏/端形态、模板章节和禁止项只能来自 payload.prdPrompt、payload.rolePrompts、payload.wikiContext 或用户当前发言。

PRD 输出规则：
0. 优先遵守 payload.prdPrompt；以下规则只作为兜底。如果 payload.prdPrompt 与以下规则冲突，以 payload.prdPrompt 为准。
1. draftMarkdown 只能写已确认或能作为当前交付方案执行的内容。未确认事项必须在 message 中问用户，不得写入 PRD。
2. 如果存在多个需求，必须拆成多个一级标题，每个一级标题对应一个独立需求；不要把多个需求塞进同一个一级标题里。
3. 每个单个需求的二级标题数量不得超过 3 个，默认只使用两个二级标题：“背景”和“要求、交互规则和文案细节”。
4. “背景”下融合背景、目标、使用场景，用 1-2 段精炼说明即可；目标不需要单独写得很完整，不要输出“背景与目标”“目标用户”“设计用户”等标题。
5. “要求、交互规则和文案细节”下按用户交互顺序从上到下组织：入口/触发、页面表现、用户操作、系统反馈、页面文案、异常兜底、保存/生效等规则。是否需要说明目标产品设备横屏状态，必须以 payload.prdPrompt 或用户当前要求为准，不要写成底层默认结论。
6. 页面文案、按钮文案、Toast/弹窗文案必须直接给最终文案，不要使用“建议”“可选”“可考虑”等表述。若文案尚未确认，先在 message 中列候选方案及理由让用户选择，PRD 暂不写这些候选项。
7. 可以使用多级列表表达细节，二级/三级列表必须体现从属关系；不要把所有内容都写成同一级列表。
8. 不要输出“待确认问题”“待补充”“建议文案”“可选方案表格”“版本范围”“验收标准”“完成标准”“关键规则”“风险与异常”等独立章节或固定字段。
9. 如果需要用户在多个方案中选择，只能在 message 中提问，不能在 PRD 里列选项让开发猜。

推荐 draftMarkdown 结构：
# 需求一名称
## 背景
用 1-2 段融合背景、目标和使用场景，保持精炼。
## 要求、交互规则和文案细节
- 入口与触发
  - 触发条件：
  - 页面文案：
- 用户操作
  - 操作规则：
  - 按钮文案：
- 系统反馈与异常
  - Toast/弹窗文案：
  - 异常兜底：

# 需求二名称
按同样结构继续。没有多个需求时只输出一个一级标题。

必须只输出 json 对象，不要输出 Markdown，不要输出解释。json 结构：
{
  "speakerRole": "pm|user|engineer|leader|system",
  "message": "当前角色本轮发言",
  "shouldContinue": false,
  "nextSpeakerRole": "",
  "draftMarkdown": "左侧展示的完整 Markdown 草稿",
  "pendingQuestionRole": "如果本轮向用户提问，填 speakerRole，否则填空字符串",
  "lastAiRole": "本轮发言角色",
  "facts": {
    "title": "需求名",
    "background": [],
    "goals": [],
    "users": [],
    "scenarios": [],
    "flow": [],
    "rules": [],
    "edgeCases": [],
    "metrics": [],
    "acceptance": [],
    "openQuestions": []
  }
}`;
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["speakerRole", "message", "shouldContinue", "nextSpeakerRole", "draftMarkdown", "facts", "pendingQuestionRole", "lastAiRole"],
  properties: {
    speakerRole: { type: "string", enum: ["pm", "user", "engineer", "leader", "system"] },
    message: { type: "string" },
    shouldContinue: { type: "boolean" },
    nextSpeakerRole: { type: "string", enum: ["", "pm", "user", "engineer", "leader"] },
    draftMarkdown: { type: "string" },
    pendingQuestionRole: { type: "string", enum: ["", "pm", "user", "engineer", "leader"] },
    lastAiRole: { type: "string", enum: ["", "pm", "user", "engineer", "leader", "system"] },
    facts: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "background",
        "goals",
        "users",
        "scenarios",
        "flow",
        "rules",
        "edgeCases",
        "metrics",
        "acceptance",
        "openQuestions"
      ],
      properties: {
        title: { type: "string" },
        background: { type: "array", items: { type: "string" } },
        goals: { type: "array", items: { type: "string" } },
        users: { type: "array", items: { type: "string" } },
        scenarios: { type: "array", items: { type: "string" } },
        flow: { type: "array", items: { type: "string" } },
        rules: { type: "array", items: { type: "string" } },
        edgeCases: { type: "array", items: { type: "string" } },
        metrics: { type: "array", items: { type: "string" } },
        acceptance: { type: "array", items: { type: "string" } },
        openQuestions: { type: "array", items: { type: "string" } }
      }
    }
  }
};

function buildModelInput(payload) {
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-18) : [];
  const rolePrompts = payload.rolePrompts || {};
  const activeRoles = Array.isArray(payload.activeRoles) ? payload.activeRoles : [];

  return [
    {
      role: "system",
      content: buildOrchestratorInstructions()
    },
    {
      role: "user",
      content: `请按 json 格式返回结果。\n${JSON.stringify({
        latestUserInput: payload.latestUserInput,
        activeRoles,
        rolePrompts,
        prdPrompt: String(payload.prdPrompt || backendSkills["prd-template"] || "").slice(0, 30000),
        prdTemplateSkill: String(backendSkills["prd-template"] || "").slice(0, 20000),
        discussionOrchestrationSkill: String(backendSkills["discussion-orchestration"] || "").slice(0, 16000),
        roleContextSkill: String(backendSkills["ainote-role-context"] || "").slice(0, 12000),
        wikiRetrievalSkill: String(backendSkills["wiki-retrieval"] || "").slice(0, 12000),
        wikiContext: String(payload.wikiContext || "").slice(0, 16000),
        attentionProfile: payload.attentionProfile || null,
        currentFacts: normalizeFacts(payload.facts),
        currentDraftMarkdown: String(payload.draftMarkdown || "").slice(0, 30000),
        currentSpeakerRole: payload.currentSpeakerRole || "",
        turnIndex: Number(payload.turnIndex || 0),
        maxTurns: Number(payload.maxTurns || 3),
        pendingQuestionRole: payload.pendingQuestionRole || "",
        lastAiRole: payload.lastAiRole || "",
        conversation: messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      })}`
    }
  ];
}

function buildChatMessages(payload) {
  const input = buildModelInput(payload);
  return input.map((item) => ({
    role: item.role,
    content: item.content
  }));
}

function getResponseText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function parseSseContent(text) {
  const chunks = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;

    try {
      const payload = JSON.parse(data);
      const delta = payload.choices?.[0]?.delta?.content;
      const message = payload.choices?.[0]?.message?.content;
      if (typeof delta === "string") chunks.push(delta);
      if (typeof message === "string") chunks.push(message);
    } catch {
      // Ignore malformed SSE keep-alive lines.
    }
  }
  return chunks.join("");
}

function getApiConfig() {
  const mode = process.env.CODEX_API_MODE || process.env.API_MODE || "responses";
  const baseUrl = process.env.CODEX_API_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.CODEX_API_MODEL || process.env.OPENAI_MODEL || defaultModel;
  const pathFromEnv = process.env.CODEX_API_PATH || process.env.OPENAI_API_PATH || "";
  const pathValue = pathFromEnv || (mode === "chat_completions" ? "/chat/completions" : "/responses");
  const apiPath = pathValue.startsWith("/") ? pathValue : `/${pathValue}`;

  return {
    mode,
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    model,
    apiPath
  };
}

async function postJson(url, apiKey, body) {
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(`无法连接模型 API：${error.message}`);
  }
}

function buildJsonFormatForChatCompletions() {
  return {
    type: "json_object"
  };
}

async function callModelApi(payload) {
  const config = getApiConfig();
  const apiKey = config.apiKey;
  if (!apiKey) {
    const error = new Error("缺少 CODEX_API_KEY 或 OPENAI_API_KEY，请在环境变量或 .env 中配置。");
    error.status = 400;
    throw error;
  }

  let response;
  if (config.mode === "chat_completions") {
    response = await postJson(`${config.baseUrl}${config.apiPath}`, apiKey, {
      model: config.model,
      messages: buildChatMessages(payload),
      response_format: buildJsonFormatForChatCompletions(),
      max_completion_tokens: 1800
    });
  } else {
    response = await postJson(`${config.baseUrl}${config.apiPath}`, apiKey, {
      model: config.model,
        input: buildModelInput(payload),
        text: {
          format: {
            type: "json_schema",
            name: "prd_discussion_turn",
            strict: true,
            schema: responseSchema
          },
          verbosity: "low"
        },
        reasoning: {
          effort: "low"
        },
        max_output_tokens: 1800
    });
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const streamedText = parseSseContent(text);
    if (streamedText) {
      data = {
        model: config.model,
        choices: [
          {
            message: {
              content: streamedText
            }
          }
        ]
      };
    } else {
      const preview = text.replace(/\s+/g, " ").trim().slice(0, 240);
      throw new Error(`模型 API 返回非 JSON：HTTP ${response.status}，前 240 字：${preview || "[空响应]"}`);
    }
  }

  if (!response.ok) {
    const message = data.error?.message || response.statusText;
    const error = new Error(`模型 API 请求失败：${message}`);
    error.status = response.status;
    throw error;
  }

  const outputText = config.mode === "chat_completions"
    ? (data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || getResponseText(data))
    : getResponseText(data);
  if (!outputText) throw new Error("OpenAI API 没有返回可解析文本。");

  const parsed = JSON.parse(outputText);
  const speakerRole = parsed.speakerRole || payload.currentSpeakerRole || "system";
  return {
    speakerRole,
    message: parsed.message,
    shouldContinue: Boolean(parsed.shouldContinue),
    nextSpeakerRole: parsed.nextSpeakerRole || "",
    draftMarkdown: String(parsed.draftMarkdown || "").trim(),
    facts: normalizeFacts(parsed.facts),
    pendingQuestionRole: parsed.pendingQuestionRole || "",
    lastAiRole: parsed.lastAiRole || speakerRole,
    model: data.model || config.model
  };
}

function buildCopyLocalizationInput(payload = {}) {
  const targetLocales = Array.isArray(payload.targetLocales) && payload.targetLocales.length
    ? payload.targetLocales.map((locale) => String(locale || "").trim()).filter(Boolean).slice(0, 12)
    : defaultLocalizationColumns;
  return JSON.stringify({
    task: "extract_and_localize_product_copy",
    skill: String(backendSkills["product-copy-localization"] || "").slice(0, 12000),
    targetLocales,
    requiredOutput: "Return JSON with handoffRows and pendingQuestions. handoffRows must use Chinese engineering handoff column names.",
    draftMarkdown: String(payload.draftMarkdown || "").slice(0, 60000),
    prdPrompt: String(payload.prdPrompt || "").slice(0, 12000),
    rolePrompts: payload.rolePrompts || {},
    instructions: [
      "Only extract copy that will appear inside the product UI.",
      "Do not translate PRD prose, requirement explanations, developer notes, or discussion content.",
      "If copy is not finalized or multiple options remain, put a concise question in pendingQuestions instead of translating all options.",
      "Return JSON only. No markdown.",
      "Default language columns are: 繁中, 日语, 韩语, 英语, 俄语, 法语, 德语, 阿拉伯语, 西班牙语, 泰语, 马来语, 荷兰语.",
      "Each handoff row must include: 序号, 原文, 使用场景, requested language columns, 备注."
    ]
  }, null, 2);
}

async function buildLocalizedCopy(payload = {}) {
  const config = getModelConfig();
  if (!config.apiKey) throw new Error("未配置 CODEX_API_KEY 或 OPENAI_API_KEY，无法调用模型生成翻译。");

  const input = buildCopyLocalizationInput(payload);
  const body = config.mode === "chat_completions"
    ? {
        model: config.model,
        messages: [
          {
            role: "system",
            content: "你是资深产品本地化编辑。你只从 PRD 中提取最终会出现在产品里的文案，并按要求翻译。必须返回严格 JSON。"
          },
          { role: "user", content: input }
        ],
        temperature: 0.2
      }
    : {
        model: config.model,
        input: [
          {
            role: "system",
            content: "你是资深产品本地化编辑。你只从 PRD 中提取最终会出现在产品里的文案，并按要求翻译。必须返回严格 JSON。"
          },
          { role: "user", content: input }
        ],
        temperature: 0.2
      };

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`模型 API 返回非 JSON：HTTP ${response.status}，前 240 字：${text.slice(0, 240)}`);
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.error || response.statusText;
    const error = new Error(`模型 API 请求失败：${message}`);
    error.status = response.status;
    throw error;
  }

  const outputText = config.mode === "chat_completions"
    ? (data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || getResponseText(data))
    : getResponseText(data);
  if (!outputText) throw new Error("模型 API 没有返回可解析文本。");

  const parsed = JSON.parse(outputText);
  return {
    handoffRows: Array.isArray(parsed.handoffRows) ? parsed.handoffRows : [],
    items: Array.isArray(parsed.items) ? parsed.items : [],
    pendingQuestions: Array.isArray(parsed.pendingQuestions) ? parsed.pendingQuestions : [],
    model: data.model || config.model
  };
}

function buildLocalCopyLocalization(payload = {}) {
  const markdown = String(payload.draftMarkdown || "");
  const candidates = [];
  const patterns = [
    /(?:按钮|文案|提示|toast|弹窗|标题|空状态|错误提示|确认文案|引导文案)[：:]\s*`([^`]+)`/gi,
    /(?:按钮|文案|提示|toast|弹窗|标题|空状态|错误提示|确认文案|引导文案)[：:]\s*「([^」]+)」/gi,
    /(?:按钮|文案|提示|toast|弹窗|标题|空状态|错误提示|确认文案|引导文案)[：:]\s*"([^"]+)"/gi
  ];
  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const sourceZh = String(match[1] || "").trim();
      if (sourceZh && !candidates.includes(sourceZh)) candidates.push(sourceZh);
    }
  }
  return {
    handoffRows: candidates.slice(0, 50).map((sourceZh, index) => {
      const row = {
        "序号": index + 1,
        "原文": sourceZh,
        "使用场景": "从 PRD 文案字段中本地提取，需人工确认场景",
        "备注": "模型不可用时的本地兜底，仅提取不翻译。"
      };
      for (const column of defaultLocalizationColumns) row[column] = "";
      return row;
    }),
    items: candidates.slice(0, 50).map((sourceZh, index) => ({
      id: `copy_${String(index + 1).padStart(3, "0")}`,
      scenario: "从 PRD 文案字段中本地提取，需人工确认场景",
      type: "other",
      sourceZh,
      translations: Object.fromEntries(defaultLocalizationColumns.map((column) => [column, ""])),
      notes: "模型不可用时的本地兜底，仅提取不翻译。"
    })),
    pendingQuestions: candidates.length ? [] : ["当前 PRD 中没有识别到明确的产品内文案。请先在 PRD 中写明最终文案。"],
    model: "local-fallback"
  };
}

async function handleLocalizeCopy(req, res) {
  try {
    const raw = await readBody(req);
    const payload = JSON.parse(raw || "{}");
    try {
      const result = await buildLocalizedCopy(payload);
      sendJson(res, 200, { ok: true, result });
    } catch (error) {
      sendJson(res, 200, {
        ok: true,
        warning: `模型翻译不可用，已使用本地兜底提取：${error.message}`,
        result: buildLocalCopyLocalization(payload)
      });
    }
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message
    });
  }
}

async function handleWikiSearch(req, res) {
  try {
    const raw = await readBody(req);
    const payload = JSON.parse(raw || "{}");
    const result = await searchWiki(payload.query || payload.q || "", Number(payload.limit || 5));
    sendJson(res, 200, { ok: result.ok, result });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message
    });
  }
}
async function handleApiChat(req, res) {
  try {
    const raw = await readBody(req);
    const payload = JSON.parse(raw || "{}");
    const enrichedPayload = await enrichPayloadWithWiki(payload);
    const result = await callModelApi(enrichedPayload);
    sendJson(res, 200, { ok: true, result });
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      error: error.message
    });
  }
}

function buildPrototypeImagePrompt(payload = {}) {
  const draftMarkdown = String(payload.draftMarkdown || "").trim();
  const facts = normalizeFacts(payload.facts || {});
  const title = facts.title || "产品需求原型";
  const rolePromptContext = Object.values(payload.rolePrompts || {})
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);
  const source = draftMarkdown || [
    `# ${title}`,
    ...facts.background.map((item) => `- ${item}`),
    ...facts.flow.map((item) => `- ${item}`),
    ...facts.rules.map((item) => `- ${item}`)
  ].join("\n");

  return `Create a high-fidelity UI prototype screenshot for the product requirement below.

Product context:
Use the PRD and role prompt context as the source of product background. Do not invent a different product, brand, or user group.
${rolePromptContext ? `\nRole prompt context:\n${rolePromptContext}\n` : ""}

Screen goal:
Turn the following PRD into a clear product prototype that a product manager, designer, and engineer can review.

Canvas and device:
Use a clean product UI mockup. If the PRD mentions product-device landscape mode, show the target product/device in landscape orientation. Do not interpret landscape as this web app's responsive layout. If the PRD mentions a specific device or surface, follow that context. Otherwise use a desktop web prototype layout.

Source PRD:
${source.slice(0, 12000)}

Layout requirements:
- Arrange the screen in the same order as the user interaction flow in the PRD.
- Show the primary entry point, main content area, action controls, feedback area, and any side panel or modal mentioned in the PRD.
- Use nested visual hierarchy: page title, section title, controls, states, helper text.
- Keep spacing consistent and make the UI readable at screenshot size.

Exact UI copy to render:
- Use only copy that appears in the PRD when possible.
- Keep copy short and legible.
- Do not invent long paragraphs.

Interaction states visible:
- Show the default state.
- If relevant, show loading / thinking / generating state.
- If relevant, show empty, error, or API-unavailable state.
- If relevant, show selected role, active tab, or focused input state.

Visual style:
Clean, modern, calm, natural green accent, paper-like background, readable Chinese UI typography, precise component boundaries, realistic product prototype, no decorative clutter.

Do not include:
Marketing posters, photorealistic people, random stock images, unrelated logos, decorative charts, unreadable filler text, extra buttons not described by the PRD, or multiple unrelated screens unless the PRD explicitly requires a multi-screen flow.

Reference skill used by the app:
${String(backendSkills["prototype-image-prompt"] || "").slice(0, 6000)}`;
}

async function handlePrototypePrompt(req, res) {
  try {
    const raw = await readBody(req);
    const payload = JSON.parse(raw || "{}");
    const prompt = buildPrototypeImagePrompt(payload);
    sendJson(res, 200, { ok: true, result: { prompt } });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/usage") {
    recordUsage(req, { action: "usage_view" });
    sendJson(res, 200, getUsageSnapshot());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/usage/ping") {
    try {
      const raw = await readBody(req, 100_000);
      const payload = JSON.parse(raw || "{}");
      recordUsage(req, {
        sessionId: payload.sessionId,
        action: payload.action || "ping",
        detail: payload.detail || ""
      });
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/save-demand") {
    await handleSaveDemand(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/load-demand") {
    await handleLoadDemand(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/wiki/search") {
    recordUsage(req, { action: "wiki_search" });
    await handleWikiSearch(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/localize-copy") {
    recordUsage(req, { action: "localize_copy" });
    await handleLocalizeCopy(req, res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/chat") {
    recordUsage(req, { action: "chat" });
    await handleApiChat(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/prototype-prompt") {
    recordUsage(req, { action: "prototype_prompt" });
    await handlePrototypePrompt(req, res);
    return;
  }

  if (req.method === "GET") {
    if (url.pathname === "/" || url.pathname === "/index.html") {
      recordUsage(req, { action: "page_view" });
    }
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

await loadDotEnv();
await loadBackendSkills();

server.listen(defaultPort, () => {
  const config = getApiConfig();
  console.log(`PRD Discussion Generator: http://localhost:${defaultPort}`);
  console.log(`Model API mode: ${config.mode}`);
  console.log(`Model API endpoint: ${config.baseUrl}${config.apiPath}`);
  console.log(`Model: ${config.model}`);
});






