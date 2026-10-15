# Tasks, ovallo

Claude keeps this file current as a side effect of normal work and never asks first. A task is one
thing Filip would say out loud in a status call, titled the way he would say it. Keys run
`ovallo-1`, `ovallo-2` and so on, one higher than the highest key in this file.

Rules
- New work goes under Backlog, or under In progress when it starts at once.
- When the state changes, cut the whole task block and paste it under the new heading.
- Steps are the checklist under a task. Add them as the shape of the work becomes clear and tick
  each one the moment the conversation shows it done. Ticking a step never moves the task.
- Steps are for this file only. They never appear in anything sent to a client, a status note, an
  invoice line or a summary. Those read at task level.
- Put the preview URL, the ticket number or the design link in the task line.

Task format

```
- ovallo-1 Pricing page prototype. Link https://example.com/preview
  - [x] Capture the reference
  - [ ] Build the page
```

## Backlog

## In progress

## Review

## Done

- ovallo-3 Set up the Ovallo landing fork for building. Fork https://github.com/mravicfilip-tech/ovallo-landing of https://github.com/tankosic2324-design/ovallo-landing, branch claude/exciting-johnson-577zey at cf3faec, baseline Ovallo6 https://ovallo6.vercel.app at 7a18b5b. Keys start at 3 because the fork's docs/studio/zadaci.md already holds ovallo-1 and ovallo-2
  - [x] Register the client folder
  - [x] Get this session access to the code through the fork
  - [x] Clone it and confirm it builds
  - [x] Turn off git deploys for claude/* in its vercel.json
  - [x] Point brand and taste at the fork's docs/studio files
  - [x] Name the baseline
  - [x] Add npm run live for Filip's localhost
