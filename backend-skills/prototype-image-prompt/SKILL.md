---
name: prototype-image-prompt
description: Convert a PRD or requirement discussion into a GPT Image 2 prompt for generating high-fidelity UI prototype mockups. Use when the app needs to output image-generation prompts for screens, flows, states, and product UI details.
---

# Prototype Image Prompt

Generate a prompt that asks GPT Image 2 to draw a UI prototype screenshot, not a marketing poster.

Prompt structure:

1. Start with the output type:
   - `Create a high-fidelity UI prototype screenshot...`
2. Name the product and device context:
   - iFLYTEK AINOTE / AI productivity paper tablet / meeting and note workflow
   - target screen size or aspect ratio
   - desktop web, tablet, mobile, or E Ink screen when known
3. Describe the screen goal in one sentence.
4. Describe the visible layout in top-to-bottom or left-to-right order.
5. Include exact UI text from the PRD. Keep text short because image models can still struggle with precise typography.
6. Include interaction states that should be visible:
   - empty state
   - loading/thinking state
   - success state
   - error state
   - selected / active state
7. Include visual style constraints:
   - clean product prototype
   - readable typography
   - consistent spacing
   - no decorative noise
   - AINOTE / iFLYTEK green and paper-like calm style when appropriate
8. Include negative constraints:
   - no marketing banners
   - no photorealistic people
   - no random extra buttons
   - no unreadable filler paragraphs
   - no unrelated brand logos

Recommended output prompt format:

```text
Create a high-fidelity UI prototype screenshot for [product/screen].

Product context:
[short context]

Screen goal:
[one sentence]

Canvas and device:
[aspect ratio, device, orientation]

Layout:
- [region 1]
  - [elements]
- [region 2]
  - [elements]

Exact UI copy to render:
- [copy]

Interaction states visible:
- [state]

Visual style:
[style constraints]

Do not include:
[negative constraints]
```

