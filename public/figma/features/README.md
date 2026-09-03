# Feature band artwork

Exports from the Figma file "Remittix Redesign" (key `9nPoeOeGE25OXU6GMlqSPe`), section node `2343:116`.
Each file is the card's illustration group exported as PNG at 2x; the `<img>` in
`src/components/FigmaFeatures/FigmaFeatures.tsx` displays it at the 1x box below.

| File               | Figma node  | Box (1x)  | Card                              |
| ------------------ | ----------- | --------- | --------------------------------- |
| pay-remittix.png   | `2361:2281` | 562 × 188 | Pay Remittix                      |
| zero-fx.png        | `2354:693`  | 480 × 361 | Zero FX fees. (node is 435 × 244; the export adds the cards' shadow bleed, 22px each side and 10px above, see the CSS) |
| made-simple.png    | `2348:1733` | 709 × 334 | Crypto-to-fiat payments made simple. |
| super-fast.png     | `2361:2199` | 500 × 436 | Super fast.                       |
| interface.png      | `2360:1807` | 668 × 234 | User-friendly interface.          |
| accel-icon.svg     | `2361:2195` | 20 × 20   | "Acceleration" chip icon          |

To regenerate: with the Figma MCP server, call `download_assets` for each node with
`defaultFormat: png, defaultScale: 2` (svg for the icon) and save the `export` URL to the file above.
Requires network access to `www.figma.com`.
