---
name: figma-create-new-file
description: "MANDATORY before create_new_file. Create a new blank Figma design, FigJam or Slides file. Usage: /figma-create-new-file [design|figjam|slides] [name]"
---

# figma-create-new-file

This command is a pointer to Figma's own skill, served live by the Figma connector so it never goes stale.

Before doing anything else:

1. Call `mcp__Figma__get_figma_skill` with `uri: "skill://figma/figma-create-new-file/SKILL.md"` and follow the returned instructions exactly.
2. When those instructions link a reference file such as `references/foo.md`, read it with the same tool at `skill://figma/figma-create-new-file/references/foo.md`.
3. Pass `skillNames: "resource:figma-create-new-file"` on the Figma tool calls the skill asks for.

If the Figma connector's tools appear as deferred tools, load their schemas first with one `ToolSearch` call, for example `select:mcp__Figma__use_figma,mcp__Figma__get_screenshot,mcp__Figma__get_metadata`.
