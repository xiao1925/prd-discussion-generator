# PRD Discussion Generator

一个面向需求澄清和 PRD 沉淀的多角色讨论工作台。页面左侧实时生成可交付 PRD，右侧是由多个 AI 角色参与的需求讨论室，用对话逐步收束需求范围、流程、规则和文案。

这个项目的核心不是“让 AI 一次性写 PRD”，而是模拟真实需求评审前的多轮讨论：产品、用户、研发、领导围绕同一需求接力追问、补漏洞、质疑假设，并把已经确认的信息沉淀到左侧 PRD。

## 核心设计

### 1. 上下文接力式多角色对话

项目内置四类角色：

- 资深产品：负责收束范围、整理交互流程、把模糊表达变成可开发需求。
- 用户：负责从真实使用场景检查入口、理解成本、失败恢复和文案可读性。
- 研发：负责识别状态机、接口边界、异常兜底、数据一致性和实现成本。
- 领导：负责判断目标、优先级、MVP 范围和交付边界。

角色不是每轮全员机械回复，而是根据上一句讨论内容、当前信息缺口、用户最新指令和历史注意力分配来决定下一位发言者。用户发言拥有最高优先级，AI 角色需要围绕用户意图推进，而不是自顾自展开。

对话编排目标是让讨论更像真实需求会：

- 有人提出方案时，下一位角色优先检查漏洞。
- 有人提出风险时，下一位角色需要判断是否影响主流程。
- 信息已经足够时，角色应主动收束，而不是继续发散。
- 涉及文案选择时，AI 在聊天区给出候选方案和理由，由用户拍板后再写入 PRD。

### 2. PRD 实时构建逻辑

左侧 PRD 是讨论过程中的实时交付物，只写已经确认或可明确推导的内容，不把待确认事项塞进文档里。

默认 PRD Prompt 约束了输出规则：

- 多个独立需求拆成多个一级标题。
- 单个需求默认只保留少量二级标题，通常是「背景」和「要求、交互规则和文案细节」。
- 背景、目标和使用场景合并到「背景」里，避免冗长模板化。
- 需求主体按用户交互顺序写清楚入口、触发、页面表现、用户操作、系统反馈、文案、异常兜底、保存和生效规则。
- 不单独输出「待确认问题」「验收标准」「版本范围」「风险与异常」等模板章节，避免 PRD 变成空泛清单。
- 文案必须给最终交付文本；如果存在选择，就在聊天区先让用户决策。

PRD Prompt 可以在页面中直接修改。底层编排只负责遵守当前 Prompt，不应写死某个产品线的规则，这样后续可以切换到其他项目或产品线。

### 3. Skill 化后台能力

项目把一些稳定能力拆成 `backend-skills`，用于降低每轮对话中重复解释规则的成本：

- `discussion-orchestration`：多角色对话分配、注意力顺序和接力规则。
- `prd-template`：PRD 结构、章节限制和交付表达规则。
- `wiki-retrieval`：局域网 LLM Wiki 的检索、证据组织和引用规则。
- `prototype-image-prompt`：把 PRD 转成可供图像模型理解的原型图提示词。
- `product-copy-localization`：提取产品内文案并生成多语言交付表。
- `ainote-role-context`：示例产品线角色背景，可按项目替换。

这些 Skill 的作用是把长期稳定的工作方法沉到后台，让每轮模型调用只关注当前需求上下文。

### 4. 搭配 LLM Wiki 知识库使用效果更好

项目支持连接局域网内的只读 LLM Wiki 知识库。推荐搭配使用，因为需求讨论经常需要引用历史 PRD、术语规范、产品规则、接口定义、市场口径或旧版本方案。

LLM Wiki 的理想形态是：

- `index.md` 作为入口索引，先帮助模型定位相关页面。
- Wiki 页面是经过大模型整理后的知识精华，而不是原始资料搬运。
- 查询时先读索引，再读取相关页面或 chunk，减少无效 token 消耗。
- 检索结果作为只读证据包进入对话，AI 只能基于检索到的内容引用，不应编造 Wiki 中没有的信息。

当前项目已支持：

- 搜索 Wiki。
- 读取 `index.md`。
- 读取相关文档和 chunk。
- 对检索结果做去重、扩展和证据包格式化。
- 在讨论和 PRD 中保留来源标题或路径。

如果没有 Wiki，项目仍可运行，但 AI 更依赖当前对话上下文；如果接入 Wiki，讨论会更容易贴近真实业务历史。

## 功能概览

- 多角色需求讨论室。
- 左侧实时 PRD 生成。
- 可编辑角色 Prompt。
- 可编辑 PRD Prompt。
- 生成原型图 Prompt。
- 提取产品内文案并生成多语言翻译交付表。
- 保存和恢复需求讨论快照。
- 局域网 Wiki 检索增强。
- 使用情况基础记录。
- 支持局域网分享访问。

## 运行方式

需要 Node.js 18 或更高版本。

```bash
npm start
```

默认访问：

```text
http://localhost:4188
```

局域网访问时，使用运行机器的局域网 IP，例如：

```text
http://10.10.116.72:4188
```

## API 配置

复制 `.env.example` 为 `.env`，然后配置你的模型中转 API。

```env
CODEX_API_KEY=your-relay-key
CODEX_API_BASE_URL=https://your-codex-api-relay.example.com/v1
CODEX_API_MODEL=gpt-5.5
CODEX_API_MODE=responses
```

如果中转站兼容 `/v1/chat/completions`，可以改成：

```env
CODEX_API_MODE=chat_completions
CODEX_API_PATH=/chat/completions
```

如果中转站兼容 `/v1/responses`，可以使用：

```env
CODEX_API_MODE=responses
CODEX_API_PATH=/responses
```

项目优先读取 `CODEX_API_*` 变量。`OPENAI_*` 变量只作为兼容兜底，不要求直连 OpenAI。

## Wiki 配置

如果要启用局域网 LLM Wiki 检索，配置：

```env
WIKI_ENABLED=true
WIKI_BASE_URL=http://10.10.124.11:8787
WIKI_SEARCH_PATH=/api/wiki/search
WIKI_DOC_PATH=/api/wiki/doc
WIKI_CHUNK_PATH=/api/wiki/chunk
WIKI_INDEX_DOC_ID=wiki/index.md
WIKI_TOKEN=
```

推荐 Wiki 服务提供这些只读接口：

- `GET /api/wiki/manifest`
- `GET /api/wiki/search?q=...&limit=...`
- `GET /api/wiki/chunk/:chunkId`
- `GET /api/wiki/doc/:docId`

如果 Wiki 服务配置了 token，可以设置：

```env
WIKI_TOKEN=your-wiki-token
```

## 保存与恢复

页面支持保存当前需求讨论快照。保存时会在指定目录下按需求标题创建文件夹，并写入：

- `.session.json`：完整会话状态。
- `.prd.md`：当前 PRD。
- `.discussion.md`：讨论记录。

恢复时输入 `.session.json` 路径即可继续讨论。

## 后续计划

后续调试稳定后，计划增加原型图 MCP 接入能力。目标是让项目不仅能生成给图像模型使用的原型图 Prompt，还可以直接调用原型图 MCP，把确认后的 PRD 流程转成可评审的界面原型。

计划方向：

- 基于 PRD 流程自动拆分页面和状态。
- 将入口、主路径、异常状态和文案转成原型图结构。
- 与原型图 MCP 联动生成多页面草图或高保真原型。
- 让讨论、PRD、原型图三者形成闭环。

## 项目定位

这个项目适合用于产品经理在需求早期进行多轮澄清，也适合团队在评审前把模糊想法变成可讨论、可开发、可追踪的 PRD。

它的创新点在于：

- 用多角色接力代替单模型一次性输出。
- 用对话收束未确认事项，而不是把问题写进 PRD。
- 用可编辑 Prompt 让 PRD 格式和角色背景可迁移。
- 用 Skill 保存稳定工作流，减少重复 token 消耗。
- 用 LLM Wiki 连接团队历史知识，降低幻觉和重复解释。
- 把 PRD、原型图 Prompt、文案翻译和需求缓存串成一个工作台。
