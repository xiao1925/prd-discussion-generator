---
name: product-copy-localization
description: Extract finalized user-facing product copy from PRDs and localize it into an engineering handoff table. Adapted from ainote-localization for the PRD discussion generator.
---

# Product Copy Localization

This skill is used after a PRD is mostly complete. It extracts only copy that will appear in the product UI, then localizes it into a multilingual engineering handoff table.

It is adapted from `ainote-localization`, but must remain project-aware: AINOTE/e-ink rules apply only when the current PRD, role prompts, or wiki evidence indicate AINOTE, office notebook, meeting transcription, AI minutes, handwriting, OCR, sync, account, settings, or device-system scenes.

## Target Languages

Unless the request provides a subset, translate into all target columns below:

| Column title | Locale guidance |
| --- | --- |
| 繁中 | Traditional Chinese, prefer Taiwan-style product UI wording unless Hong Kong is specified |
| 日语 | Japanese, concise UI tone; prefer noun phrases and plain action labels over long polite sentences |
| 韩语 | Korean, concise product UI tone; avoid over-formal marketing copy |
| 英语 | Natural product UI English; use sentence case for labels unless a platform convention requires title case |
| 俄语 | Russian |
| 法语 | French |
| 德语 | German |
| 阿拉伯语 | Arabic; keep right-to-left text intact and preserve placeholders |
| 西班牙语 | Spanish, neutral international wording unless locale is specified |
| 泰语 | Thai |
| 马来语 | Malay |
| 荷兰语 | Dutch |

## What To Extract

Extract only finalized user-visible product copy:

- Button labels.
- Navigation labels and tab labels.
- Page titles displayed in the product.
- Toasts and status messages.
- Dialog titles and dialog body text.
- Error messages.
- Empty-state text.
- Confirmation prompts.
- Permission prompts.
- Loading text.
- Onboarding and guidance text.
- User-visible setting names.
- User-visible feature names.

Do not extract or translate:

- PRD section headings.
- Requirement explanations.
- Internal implementation notes.
- Acceptance criteria.
- Role discussion messages.
- Product manager comments.
- Candidate copy that the user has not confirmed.
- Descriptions of copy strategy that are not final UI strings.

If the PRD contains multiple copy options, do not translate all options as final text. Return a pending question asking the user to choose.

## Workflow

1. Parse the PRD and identify finalized product copy strings.
2. Preserve IDs, placeholders, variables, line breaks, punctuation constraints, and any character limits exactly.
3. Identify the UI scene for each string: button, tab, setting, dialog title, dialog body, toast, error, empty state, onboarding, permission prompt, device feature, release note, or PRD string.
4. Apply the tone and glossary guidance below.
5. Translate every confirmed string into all target languages unless `targetLocales` specifies a subset.
6. If meaning depends on missing context, return `pendingQuestions` with 2-3 options and concise reasons. Do not silently guess.
7. Return JSON only. The frontend will render the result as a table; do not return Markdown from the model.

## Output JSON

Return this shape:

```json
{
  "handoffRows": [
    {
      "序号": 1,
      "原文": "开始书写",
      "使用场景": "空白笔记页主按钮",
      "繁中": "開始書寫",
      "日语": "書き始める",
      "韩语": "쓰기 시작",
      "英语": "Start writing",
      "俄语": "",
      "法语": "",
      "德语": "",
      "阿拉伯语": "",
      "西班牙语": "",
      "泰语": "",
      "马来语": "",
      "荷兰语": "",
      "备注": ""
    }
  ],
  "pendingQuestions": [
    {
      "原文": "同步",
      "场景缺口": "不确定是按钮动作、同步中状态还是同步完成状态",
      "方案A": "Sync",
      "方案A理由": "适合按钮动作",
      "方案B": "Syncing",
      "方案B理由": "适合同步进行中状态",
      "建议选择": "如果是按钮，选 A；如果是状态，选 B。"
    }
  ]
}
```

Compatibility: if a caller expects `items`, the server may convert `handoffRows` to preview text. Prefer `handoffRows`.

## Tone Model

Use the tone of established reading and note-taking devices:

- Kindle-style copy is direct, calm, and task-oriented for reading, library, notebook, sync, and account flows.
- reMarkable-style copy is minimal, focused on writing, reading, organizing, and syncing documents.
- Prefer product UI language over marketing claims.
- Prefer short labels for buttons, tabs, settings, toolbars, and e-ink layouts.
- Use sentence-style actions in English, not decorative title case.

For non-AINOTE projects, keep the same quality bar but do not force e-ink terminology.

## External Reference Lookup

When a source string requires product judgment, use comparable official wording patterns from Kindle, reMarkable, or adjacent note-taking/reading products if available in wiki evidence or prompt context.

Use reference reasoning for these cases:

- A short Chinese string could be a command, state, title, tab, or toast.
- The wording affects visible navigation, main CTA, settings, destructive actions, privacy/account flows, sync state, handwriting/OCR flows, export/share flows, or onboarding claims.
- Literal translation would be too long for a tablet UI label.
- Concepts diverge by product convention, such as `note` vs `notebook`, `document` vs `file`, or `convert` vs `recognize`.

Do not put reference explanation inside final translation cells. Put concise rationale in `备注` or `pendingQuestions`.

## Core Glossary Guidance

Choose terms by scene, not by literal Chinese alone.

| 中文 | Preferred meaning | Notes |
| --- | --- | --- |
| 笔记 | note / notebook | Use `note` for one written item; use `notebook` for a bound collection or reMarkable-style notebook object. Ask if unclear. |
| 文档 | document | Use for imported files, PDFs, Office files, and file-management contexts. |
| 页面 | page | Use for notebook/document pages. |
| 模板 | template | Use for note page templates. |
| 标签 | tag | Use for organization metadata. |
| 文件夹 | folder | Use for visible file organization. |
| 收藏 | favorite / saved | Use `favorite` for starred items; use `saved` for stored content. Ask if unclear. |
| 同步 | sync / syncing / synced | Choose action, progress, or result by UI scene. |
| 云端 | cloud | Avoid repeating "cloud" if the product name or page already implies it. |
| 手写 | handwriting / handwritten | Use `handwriting` as feature noun; `handwritten` as adjective. |
| 转文字 | convert to text | Use for handwriting OCR conversion. |
| 识别 | recognize / detect / convert | Ask for scene; OCR, shape detection, and language recognition require different translations. |
| 导入 | import | Use for bringing files into device/app. |
| 导出 | export | Use for sending files out. |
| 分享 | share | Use for sending to people/apps; do not use for export unless source means sharing. |
| 设备 | device | Use for the tablet itself. |
| 墨水屏 | E Ink screen / e-ink display | Use `E Ink` for product-facing English if brand capitalization is acceptable; otherwise `e-ink display`. |
| 待办 | to-do / task | Use `to-do` for list feature; `task` for productivity item. |

## Language-Specific Notes

- 繁中: Prefer Taiwan-style product UI terms; keep wording compact.
- 日语: Prefer concise labels. Avoid long polite forms in buttons and navigation.
- 韩语: Prefer compact product UI wording, not formal customer-service language.
- 英语: Use `Sync`, not `Synchronize`; use `Convert to text` for handwriting OCR unless the source means another recognition feature.
- 阿拉伯语: Preserve placeholders and punctuation carefully. Do not manually reverse placeholder order unless grammar requires it.
- 德语 / 法语 / 俄语 / 西班牙语 / 荷兰语: Watch length expansion. Prefer shorter UI-native terms when available.
- 泰语 / 马来语: Prefer modern device/app UI terms. Avoid over-explaining common software terms.

## Required Checks

- Every confirmed row includes all requested target-language cells.
- Placeholders appear exactly the same number of times as in the source.
- No final translation cell contains unresolved alternatives such as `A/B`, `or`, `待确认`, or `?`.
- No translation is much longer than necessary for a tablet UI.
- Parallel UI items use the same grammatical form.
- Destructive actions are clear.
- Errors are actionable when the source context supports it.
