---
name: figma-generative-plugins
description: "MANDATORY before create_generative_plugin or update_generative_plugin. Author or extend a generative Figma plugin."
---

# figma-generative-plugins

This command is a pointer to Figma's own skill, served live by the Figma connector so it never goes stale.

Before doing anything else:

1. Call `mcp__Figma__get_figma_skill` with `uri: "skill://figma/figma-generative-plugins/SKILL.md"` and follow the returned instructions exactly.
2. When those instructions link a reference file such as `references/foo.md`, read it with the same tool at `skill://figma/figma-generative-plugins/references/foo.md`.
3. Pass `skillNames: "resource:figma-generative-plugins"` on the Figma tool calls the skill asks for.

If the Figma connector's tools appear as deferred tools, load their schemas first with one `ToolSearch` call, for example `select:mcp__Figma__use_figma,mcp__Figma__get_screenshot,mcp__Figma__get_metadata`.
