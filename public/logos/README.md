# Auditor logos

| File | Contents |
| --- | --- |
| `certik.svg` | CertiK emblem + `CERTIK` wordmark lockup |
| `certik-mark.svg` | CertiK emblem only |
| `coinsult.svg` | Coinsult tile + `Coinsult` wordmark lockup |
| `coinsult-mark.svg` | Coinsult tile only |

Both wordmarks and the CertiK emblem are `fill="currentColor"`, so they take the
surrounding text colour when inlined and fall back to black when loaded through
`<img>`. The Coinsult tile keeps its own green-to-blue gradient (`#3D926F` →
`#1D7793`) and a white mark, which is how Coinsult renders it.

## Where they came from

Neither vendor's site is reachable from CI, so these were rebuilt from the
artwork each firm ships in its own audit reports:

- **CertiK** — exact vector paths lifted from the cover of a CertiK audit report
  (`STFX-IO/audits`, `CertiK - STFX Staking Audit Report.pdf`). Curves are the
  original artwork, not a trace.
- **Coinsult** — Coinsult's report template embeds the tile as a 114px raster, so
  the tile is a geometric reconstruction: ring radii, arc gaps, corner radius and
  gradient stops were measured off that artwork and rebuilt as arcs. The wordmark
  is IBM Plex Sans Bold, outlined from the same report.

The Coinsult tile is therefore a close reconstruction rather than the vendor
original. Swap in the official asset from Coinsult's press kit if precision
matters.
