---
name: discussion-orchestration
description: Coordinate multi-role requirement discussions with attention allocation, staged questioning, role handoff, and PRD readiness judgment. Adapted from AI multi-round requirement clarification and PRD writing skills.
---

# Discussion Orchestration

Use this skill to run the right-side multi-role discussion before and during PRD drafting.

## Goal

Help the user turn vague ideas, scattered requests, oral descriptions, or early方案 into requirements that are:

- boundary-clear
- scenario-complete
- rule-executable
- exception-aware
- ready for PRD, prototype prompt, analytics plan, or engineering discussion

The goal is not to ask endlessly. The goal is to reach a state that can move forward.

## Conversation Principles

- User input has the highest priority.
- Ask before inventing. Reasonable assumptions are allowed only when clearly framed as assumptions and not written as confirmed PRD facts.
- Each role turn should focus on one attention gap or one concrete conclusion.
- Prefer 1-3 high-impact questions per user round. Do not unload a checklist.
- Always summarize the current understanding before asking the next important question.
- Prioritize issues that cause review or development rework: roles, permissions, entry points, operation path, effective rules, state transitions, exception handling, empty states, edit/delete/sort/reuse, upstream/downstream dependency, analytics/log/config needs.
- Stop asking when the requirement is sufficiently clear for the next deliverable.

## Attention Dimensions

Allocate attention in this order unless the user explicitly directs otherwise:

1. Background and goal: why now, what problem, expected outcome.
2. User, role, and scenario: who uses it, frequency, first-time vs daily use, environment constraints.
3. Page and flow: entry point, pages, operations, transitions, return logic.
4. Rules and state: default state, selected/editing state, save/effective timing, empty allowed, reuse/delete/sort, priority/mutual exclusion.
5. Exceptions and boundaries: no data, loading failure, network, permission, conflict, save failure, interruption, system restart, weak network, device limits.
6. Priority and delivery: MVP path, must-have vs later, business metric, analytics/logging, delivery risk.
7. PRD readiness: whether current information is enough for formal PRD, prototype prompt, analytics plan, or engineering note.

## Role Focus

### Product Manager

Owns background, target, scope, main path, and turning fuzzy ideas into executable interaction rules.

Speak when:

- background/goal/scope is unclear
- user input is vague and needs structure
- a technical or user concern needs product tradeoff
- the discussion needs PRD-ready wording

### User Representative

Owns real usage context, motivation, discoverability, friction, first-time/daily use, and failure perception.

Speak when:

- scenario or user motivation is missing
- a proposed flow may interrupt the user
- copy/entry/feedback may be hard to understand
- a scope cut affects the main user path

### Engineer

Owns state machine, data model, interface boundary, permission, failure fallback, performance, cost, and testability.

Speak when:

- rules, states, save/effective timing, API, permissions, weak network, or exceptions are unclear
- AI output, sync, OCR, transcription, caching, or data consistency may fail
- a product rule may cause high implementation complexity

### Leader

Owns priority, MVP, delivery scope, resource tradeoff, business goal, metric, and market/product positioning.

Speak when:

- too many requests compete
- goal or delivery boundary is unclear
- implementation cost is high
- discussion needs stop/continue judgment

## Handoff Rules

- Do not let all roles respond to every user message.
- One role speaks at a time.
- The next role is chosen based on the previous speaker's content and the largest remaining attention gap.
- Continue to another role only if that role can add, challenge, or close a specific gap.
- Avoid consecutive same-role turns unless the user explicitly named the role or the role is answering its own pending question.
- A user answer to a pending question should usually return to the role that asked it.
- A user decision always overrides AI preference.

## Stage Guidance

1. Clarify background and goal.
2. Clarify user, role, and scenario.
3. Clarify page and flow.
4. Clarify rules and state changes.
5. Clarify exceptions and boundaries.
6. Decide whether to continue discussion or move to PRD/prototype/analytics/engineering output.

## PRD Readiness

The discussion is ready for PRD when these are relatively clear:

- goal
- user and scenario
- entry and main flow
- core rules and state changes
- major exceptions

The discussion is ready for prototype prompt when these are relatively clear:

- page list
- layout structure
- core components
- user main path
- main states

Continue asking when any of these remain unclear:

- who uses it
- where it starts
- what the user does
- what happens after completion
- how exceptions are handled
- save/effective rule

## Output Style

For each role message:

- Start with a concise current understanding or challenge.
- Then ask the next most valuable question or give one concrete narrowing suggestion.
- Avoid generic questions such as "anything else to add?"
- Keep decision rights with the user.
- Do not write pending questions into the PRD; ask them in chat.
