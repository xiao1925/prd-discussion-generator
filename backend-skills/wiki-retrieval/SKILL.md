---
name: wiki-retrieval
description: Retrieve and use LAN wiki knowledge for PRD requirement discussions. Use when the app needs to search a local-network wiki, compress retrieved chunks, cite sources, and avoid hallucinating unavailable knowledge.
---

# Wiki Retrieval

Use the wiki as a read-only source of project knowledge. Do not download or inject the whole wiki into the model context.

## When to search

Search the wiki when any of these are true:

- The user asks to reference existing docs, historical rules, previous PRDs, specs, or wiki content.
- The current requirement likely depends on existing product rules, terminology, permissions, data definitions, API constraints, or design conventions.
- A role needs evidence for a rule that should not be guessed.
- The discussion mentions "之前", "历史", "规范", "知识库", "wiki", "已有文档", "旧版本", "接口文档", or "规则".

Do not search for casual chat, purely creative copy options, or questions that can be answered from the active conversation.

## Knowledge model

This wiki is an LLM Wiki, not a raw RAG dump.

- Raw Sources: read-only factual sources used for traceability.
- Wiki: LLM-edited Markdown knowledge pages. These pages are distilled encyclopedia entries, not raw document copies.
- Schema: rules for classification, conflict handling, naming, and page maintenance.
- `index.md`: the routing center. Prefer using the index to identify relevant pages before reading detailed chunks or documents.

Retrieval should prefer "index first, page second, chunk third":

1. Search or read `index.md` to identify candidate wiki pages.
2. Search/read the most relevant pages identified by the index.
3. Use chunks only as supporting evidence or when the target page is unknown.
4. Do not treat raw-source-looking snippets as the final answer when a distilled wiki page exists.

## Retrieval contract

Use a small query built from:

- latest user input
- requirement title
- recent background/scenario/flow/rule facts

Request only top 3-5 chunks. Each chunk should include:

- title
- docId or path
- snippet
- updatedAt
- score when available

## Context compression

Inject wiki results in this compact form:

```text
[Wiki 引用]
1. 标题
- 来源：path-or-docId
- 更新时间：timestamp
- 相关片段：short snippet
```

Keep wiki context under 16k characters. Prefer relevant snippets over full documents.

## Use rules

- Treat wiki results as evidence, not as user decisions.
- Never invent wiki content that was not retrieved.
- If wiki is unavailable, continue the discussion and say the knowledge base needs later confirmation.
- If PRD uses wiki-derived information, preserve the source title or path in the related flow text when useful.
- If wiki conflicts with the user's explicit decision, ask the user to resolve the conflict in chat.
- Do not expose backend network details or tokens to the browser or PRD.

## Failure behavior

If search fails:

- Use cached search results if available and mark them stale internally.
- If no cache exists, continue without wiki and avoid claiming any wiki-backed rule.
- Do not block PRD generation solely because wiki is unavailable.
## Expected LAN API

The PRD generator expects a small read-only HTTP API. Prefer backend-to-backend calls; do not expose wiki tokens in the browser.

### GET /api/wiki/search

Query parameters:

- `q`: required search text.
- `limit`: optional, default 5, max 10.

Response:

```json
{
  "ok": true,
  "query": "search text",
  "items": [
    {
      "chunkId": "stable-chunk-id",
      "docId": "stable-doc-id-or-path",
      "title": "document title",
      "path": "optional/wiki/path.md",
      "snippet": "short matched markdown/plain text snippet",
      "updatedAt": "2026-06-10T10:00:00+08:00",
      "score": 0.83
    }
  ]
}
```

### Optional endpoints

- `GET /api/wiki/manifest`: return wiki version, updatedAt, document count, and index status.
- `GET /api/wiki/chunk/:chunkId`: return a single chunk when the model needs more context.
- `GET /api/wiki/doc/:docId`: return document metadata or full markdown only for explicit export/debug flows.

## Runtime behavior

- `WIKI_ENABLED=false` means the PRD generator never calls the wiki automatically.
- When enabled, search is triggered only when recent discussion mentions existing docs, historical rules, specs, APIs, terminology, permissions, data definitions, product conventions, or AINOTE-related scenarios that should be grounded.
- `WIKI_AUTO_SEARCH_ALWAYS=true` forces every turn to search; avoid it unless debugging because it wastes tokens and network calls.
