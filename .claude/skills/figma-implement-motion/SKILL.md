---
name: figma-implement-motion
description: "Translate Figma motion and animation into production code (motion.dev, CSS keyframes, SwiftUI)."
---

# figma-implement-motion

This command is a pointer to Figma's own skill, served live by the Figma connector so it never goes stale.

Before doing anything else:

1. Call `mcp__Figma__get_figma_skill` with `uri: "skill://figma/figma-implement-motion/SKILL.md"` and follow the returned instructions exactly.
2. When those instructions link a reference file such as `references/foo.md`, read it with the same tool at `skill://figma/figma-implement-motion/references/foo.md`.
3. Pass `skillNames: "resource:figma-implement-motion"` on the Figma tool calls the skill asks for.

If the Figma connector's tools appear as deferred tools, load their schemas first with one `ToolSearch` call, for example `select:mcp__Figma__use_figma,mcp__Figma__get_screenshot,mcp__Figma__get_metadata`.
