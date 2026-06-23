---
name: prd-template
description: Generate the left-side deliverable PRD for AINOTE requirement discussions. Use when producing or validating PRD Markdown structure, headings, section limits, and content exclusions.
---

# PRD Template

Write only deliverable PRD content. Ask unresolved choices in chat instead of writing them into the PRD.

Hard rules:

1. Split multiple independent requirements into multiple `#` level titles. Each `#` title covers one requirement only.
2. For one requirement, use no more than three `##` sections. Default to exactly two:
   - `## 背景`
   - `## 要求、交互规则和文案细节`
3. In `## 背景`, merge background, light goal context, and usage scenario into 1-2 concise paragraphs. Do not use `背景与目标`.
4. In `## 要求、交互规则和文案细节`, organize details in user interaction order:
   - entry / trigger
   - page state and layout
   - user action
   - system response
   - copy text
   - target product/device landscape behavior
   - exception fallback
   - save / effective rules
   Treat landscape as the target product's tablet/device landscape usage state, not this H5/web app's responsive layout.
5. Use nested lists when details have hierarchy. Do not flatten every item into the same list level.
6. Provide final page copy, button copy, toast copy, and modal copy directly.
7. If copy needs user choice, ask in chat with 2-4 options and explain why each option exists. Do not put unselected copy options into the PRD. Write only the confirmed final copy.
8. Do not output standalone sections or fixed fields named:
   - 待确认问题
   - 待补充
   - 版本范围
   - 目标用户
   - 设计用户
   - 验收标准
   - 完成标准
   - 关键规则
   - 风险与异常
   - 建议文案
   - 可选方案
