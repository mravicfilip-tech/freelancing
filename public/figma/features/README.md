# Feature band artwork

Exports from the Figma file "Remittix Redesign" (key `9nPoeOeGE25OXU6GMlqSPe`), section node `2343:116`.

The five card illustrations are rebuilt layer by layer in
`src/components/FigmaFeatures/illustrations/` so each part can animate; `parts/` holds the 49
layer exports (SVG and PNG) that `get_design_context` returned for the section, named after the
constants in that response (`imgGroup.svg`, `imgFrame2085662048.svg`, …). The six connector
graphics that are drawn as strokes live inline under `illustrations/svg/` (imported `?raw`).

| Illustration        | Figma node  | Box (1x)  | Card                                 |
| ------------------- | ----------- | --------- | ------------------------------------ |
| illustrations/Pay   | `2361:2281` | 562 × 188 | Pay Remittix                         |
| illustrations/Fx    | `2354:693`  | 435 × 244 | Zero FX fees.                        |
| illustrations/Simple| `2348:1733` | 709 × 334 | Crypto-to-fiat payments made simple. |
| illustrations/Fast  | `2361:2199` | 500 × 436 | Super fast.                          |
| illustrations/Ui    | `2360:1807` | 668 × 234 | User-friendly interface.             |
| accel-icon.svg      | `2361:2195` | 20 × 20   | "Acceleration" chip icon             |

To regenerate the layers: with the Figma MCP server, call `get_design_context` on `2343:116` and
save each asset URL it lists into `parts/` under its constant name. Requires network access to
`www.figma.com`; the URLs expire after seven days.
