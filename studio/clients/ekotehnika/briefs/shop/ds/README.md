# Data sheets as data

One JSON per shop product, read from the English Linde data sheets (DS_*.pdf) in the client Drive by `ekotehnika-hero/scripts/shop-datasheets.py`. Nothing is translated. To redo it, run `python3 scripts/shop-datasheets.py <download dir>` from `ekotehnika-hero`.

## Files

- `<slug>.json` holds the first data sheet of the product at the top level. That is the one the catalogue links, unless it has no VDI table and another one in the folder has. When the folder holds more than one English data sheet, for example two sub-series, the others follow as `more_datasheets`, with the same fields each.
- A product with no data sheet is the slug and `"datasheet": null` and nothing else.
- `datasheet` is the file name and the Drive id. `heading`, `range`, `capacity`, `tagline` and `benefits[]` come from page 1.
- `versions[]` are the model names of row 1.2. `vdi[]` has one entry per VDI number with `no`, `section`, `label`, `unit`, `values[]` and `notes[]`, both in the order of `versions[]`. `notes[]` holds the footnote marks taken off each value, and a null value is a cell that was empty or that the parse could not place. `footnotes[]` are the footnote texts.
- `masts` is raw text per mast type. `equipment[]` is `group`, `columns[]` and `items[]`, `characteristics[]` is `group` and `bullets[]`.
- `unparsed` is whatever the parse could not place, as raw text. Its `image_pages` are the PDF pages that hold no text at all, so there is nothing to read from them. `characteristics_captions` are the picture captions beside the characteristics.

## The equipment marks

The standard and optional marks of the equipment table are drawn shapes, not text, so they are lost in the PDF text. What survives is the long dash that means not available. Each item that has one carries `na`, the version columns it sits under. An item with no `na` is standard or optional for the columns of its table, and this data does not say which. The marks can be read from the page images later if the product pages need them.

## Known blemishes

- A few equipment group names are cut or joined where two turned labels sit close together, for example `forks` and `tyres` on R14 to R25, `Standard` and `Lift Series` on two pages that are not equipment. The items under them are right.
- Group names are as each sheet spells them, so Environment, Enviroment and Digitalization all occur.
- On the older sheets a few cells of a row beside a side table can carry a line of its text.
- Footnote marks that touch a value with no space are split by rule, so a value that really ends in a digit followed by a footnote can lose that digit. The footnote numbers of the sheet are used to choose, and every glued mark was checked against them.

## Coverage

89 products, 83 with a data sheet and 6 without. 53 products are fully parsed. Full means the title block, benefits, VDI table, equipment and characteristics were all found in the first data sheet. Masts are not part of it, a warehouse truck has none. The counts are for that first data sheet.

| slug | data sheets | versions | VDI rows | benefits | equipment | characteristics | mast types | status | notes |
|---|---|---|---|---|---|---|---|---|---|
| e10 | 1 | 2 | 49 | 5 | 6 groups, 40 items | 4 groups | 3 | full |  |
| e14-do-e20 | 2 | 14 | 63 | 5 | 9 groups, 56 items | 4 groups | 3 | full |  |
| e16-do-e20 | 1 | 5 | 56 | 0 | 0 groups, 0 items | 0 groups | 1 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| e16-do-e20-p | 2 | 14 | 63 | 5 | 9 groups, 56 items | 4 groups | 3 | full |  |
| e20-do-e35 | 2 | 10 | 62 | 4 | 4 groups, 55 items | 4 groups | 3 | full |  |
| e25s-do-e35s-sh | 1 | 5 | 54 | 0 | 2 groups, 32 items | 5 groups | 3 | partial | benefits are running text, kept raw under unparsed |
| e35-do-e50 | 2 | 6 | 63 | 5 | 8 groups, 50 items | 4 groups | 3 | full |  |
| e60-do-e80 | 1 | 4 | 60 | 4 | 8 groups, 52 items | 4 groups | 2 | full |  |
| eg16-do-eg20 | 1 | 5 | 58 | 4 | 4 groups, 41 items | 4 groups | 3 | full |  |
| eg25-do-eg35 | 1 | 5 | 59 | 4 | 8 groups, 37 items | 0 groups | 3 | partial | the characteristics page has no text, it is an image |
| x20-do-x35 | 1 | 4 | 62 | 4 | 5 groups, 56 items | 4 groups | 3 | full |  |
| x35-do-x50 | 1 | 10 | 61 | 5 | 7 groups, 52 items | 4 groups | 3 | full |  |
| xi10-do-xi20 | 2 | 7 | 62 | 7 | 9 groups, 54 items | 4 groups | 3 | full |  |
| xi16-do-xi20-p | 2 | 6 | 61 | 6 | 9 groups, 58 items | 4 groups | 3 | full |  |
| h16-do-h20 | 1 | 9 | 61 | 6 | 8 groups, 56 items | 4 groups | 3 | full |  |
| h20-do-h35 | 1 | 13 | 54 | 5 | 5 groups, 60 items | 4 groups | 3 | full |  |
| h35-do-h50 | 1 | 13 | 66 | 5 | 8 groups, 58 items | 4 groups | 3 | full |  |
| h50-do-h80 | 1 | 6 | 61 | 5 | 8 groups, 53 items | 4 groups | 2 | full |  |
| e100-do-e180 | 1 | 12 | 59 | 5 | 9 groups, 52 items | 4 groups | 1 | full |  |
| h100-do-h180-d | 3 | 10 | 55 | 5 | 8 groups, 63 items | 4 groups | 1 | full | DS_Rotating_Cabin_BR1401_en_A_0414_view.pdf has no VDI table; DS_ElevatingCabin_BR1401_en_A_0515_view.pdf has no VDI table |
| ht100-do-ht180-ds | 1 | 12 | 54 | 5 | 8 groups, 64 items | 4 groups | 1 | full |  |
| r10-do-r16-b | 1 | 4 | 57 | 5 | 6 groups, 48 items | 4 groups | 1 | full |  |
| r14-do-r17-x | 1 | 5 | 58 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| r14-do-r20-g | 1 | 3 | 55 | 4 | 6 groups, 46 items | 4 groups | 1 | full |  |
| r14-do-r25 | 2 | 12 | 61 | 4 | 36 groups, 156 items | 0 groups | 1 | partial | the characteristics page has no text, it is an image |
| r20-do-r25-f | 1 | 2 | 57 | 5 | 11 groups, 53 items | 4 groups | 1 | full |  |
| mv01 | 1 | 1 | 36 | 4 | 3 groups, 22 items | 4 groups | 0 | full |  |
| n16-do-n25 | 5 | 8 | 50 | 5 | 10 groups, 108 items | 4 groups | 0 | full |  |
| n20-do-n25-c | none in the Drive folder | | | | | | | no data sheet | |
| n20-xl | 2 | 1 | 56 | 4 | 7 groups, 50 items | 4 groups | 1 | full |  |
| v-modular | 1 | 6 | 51 | 5 | 5 groups, 58 items | 4 groups | 4 | full |  |
| v08 | 1 | 3 | 56 | 5 | 7 groups, 55 items | 4 groups | 0 | full |  |
| v10 | 1 | 2 | 51 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| d06-do-d10 | 1 | 4 | 54 | 6 | 11 groups, 53 items | 0 groups | 2 | partial | the characteristics page has no text, it is an image |
| d10-ap | 1 | 1 | 54 | 5 | 12 groups, 42 items | 4 groups | 3 | full |  |
| d10 | 1 | 1 | 50 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| d12-r | 1 | 1 | 54 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| d12-rw | 1 | 1 | 55 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| d12-s-sf | 1 | 2 | 49 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| d12-do-d14-ap | 1 | 2 | 53 | 6 | 11 groups, 46 items | 4 groups | 3 | full |  |
| l03-ex | none in the Drive folder | | | | | | | no data sheet | |
| l06-do-l16-ac | 3 | 4 | 51 | 5 | 5 groups, 47 items | 4 groups | 0 | full | DS_L06 AC_L16 AC_1171_en_B_0622_print.pdf has no VDI table |
| l10-do-l12-b-as | 1 | 2 | 50 | 5 | 10 groups, 45 items | 4 groups | 3 | full |  |
| l10-do-l16-b | 2 | 4 | 53 | 5 | 8 groups, 55 items | 4 groups | 3 | full |  |
| l14-do-l16-sp | 1 | 2 | 57 | 5 | 11 groups, 49 items | 0 groups | 3 | partial | the characteristics page has no text, it is an image |
| l14-do-l16-r-ri | 1 | 3 | 54 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| l14-do-l16-rw | 1 | 2 | 53 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| l14-do-l20 | 2 | 3 | 49 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| l14-do-l16-as-as-ap | none in the Drive folder | | | | | | | no data sheet | |
| l14-do-l20-ap | 1 | 3 | 53 | 0 | 10 groups, 46 items | 0 groups | 5 | partial | no title block found, benefits are running text, kept raw under unparsed, the characteristics page has no text, it is an image |
| m25 | 1 | 1 | 22 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| mt15-c | 1 | 1 | 41 | 3 | 6 groups, 19 items | 4 groups | 0 | full |  |
| t14-do-t20 | 2 | 6 | 50 | 4 | 8 groups, 47 items | 4 groups | 0 | full |  |
| t14-s-t20-do-t25-s-sf | 1 | 5 | 44 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| t16-do-t20-p | 2 | 3 | 45 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| t16-l | 1 | 1 | 58 | 5 | 9 groups, 45 items | 0 groups | 0 | partial | the characteristics page has no text, it is an image |
| t20-do-t25-ap | 1 | 4 | 51 | 5 | 10 groups, 45 items | 0 groups | 0 | partial | the characteristics page has no text, it is an image |
| t20-do-t25-rw | 1 | 2 | 46 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| t20-do-t25-r-sr | 2 | 2 | 48 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| t20-do-t25-sp | 1 | 4 | 51 | 5 | 10 groups, 45 items | 0 groups | 0 | partial | the characteristics page has no text, it is an image |
| t20-do-t25-ap-n | 2 | 2 | 48 | 5 | 11 groups, 41 items | 4 groups | 0 | full |  |
| t25-do-t30 | 2 | 2 | 45 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| t33-r-hp | 1 | 1 | 41 | 4 | 5 groups, 35 items | 4 groups | 0 | full |  |
| mp13 | 1 | 1 | 36 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| p120 | 1 | 6 | 43 | 4 | 5 groups, 45 items | 4 groups | 0 | full |  |
| p180 | 1 | 6 | 43 | 4 | 5 groups, 45 items | 4 groups | 0 | full |  |
| p20 | 1 | 1 | 40 | 4 | 11 groups, 36 items | 4 groups | 0 | full |  |
| p250-lwb | 1 | 6 | 43 | 4 | 5 groups, 45 items | 4 groups | 0 | full |  |
| p250-swb | 1 | 6 | 43 | 4 | 5 groups, 45 items | 4 groups | 0 | full |  |
| p350 | 1 | 6 | 43 | 4 | 5 groups, 45 items | 4 groups | 0 | full |  |
| p40-do-p60-c | 1 | 3 | 41 | 6 | 8 groups, 56 items | 0 groups | 0 | partial | the characteristics page has no text, it is an image |
| p60-do-p80 | 1 | 2 | 42 | 5 | 7 groups, 60 items | 4 groups | 0 | full |  |
| w04 | 1 | 1 | 40 | 4 | 11 groups, 36 items | 4 groups | 0 | full |  |
| w08 | none in the Drive folder | | | | | | | no data sheet | |
| w20 | 1 | 2 | 44 | 6 | 5 groups, 43 items | 4 groups | 0 | full |  |
| w30 | 1 | 2 | 44 | 6 | 5 groups, 43 items | 4 groups | 0 | full |  |
| a-5224 | 1 | 3 | 53 | 4 | 5 groups, 60 items | 4 groups | 0 | full |  |
| k-5231 | 1 | 3 | 52 | 0 | 0 groups, 0 items | 0 groups | 0 | partial | older collage layout, the page 1 text is kept raw under unparsed |
| c-matic-i-c-matic-hp | 1 | 2 | 25 | 5 | 9 groups, 34 items | 0 groups | 0 | partial | the characteristics page has no text, it is an image |
| k-matic | 1 | 3 | 47 | 5 | 7 groups, 27 items | 4 groups | 2 | full |  |
| l-matic-ac | 1 | 1 | 40 | 6 | 7 groups, 20 items | 4 groups | 1 | full |  |
| l-matic-core | 1 | 1 | 47 | 5 | 7 groups, 30 items | 0 groups | 1 | partial | the characteristics page has no text, it is an image |
| l-matic-hd | 1 | 2 | 49 | 5 | 7 groups, 28 items | 3 groups | 0 | full |  |
| l-matic-hd-k | 1 | 2 | 49 | 5 | 7 groups, 28 items | 3 groups | 0 | full |  |
| l-matic | 1 | 4 | 49 | 5 | 6 groups, 28 items | 4 groups | 1 | full |  |
| l-matic-133 | none in the Drive folder | | | | | | | no data sheet | |
| p-matic | none in the Drive folder | | | | | | | no data sheet | |
| r-matic | 1 | 4 | 49 | 5 | 4 groups, 35 items | 4 groups | 0 | full |  |
| r-matic-k | 1 | 3 | 53 | 6 | 5 groups, 29 items | 4 groups | 0 | full |  |

## What failed

- No data sheet in the Drive folder for n20-do-n25-c, l03-ex, l14-do-l16-as-as-ap, w08, l-matic-133, p-matic. They get `"datasheet": null`.
- e16-do-e20, older collage layout, the page 1 text is kept raw under unparsed.
- e25s-do-e35s-sh, benefits are running text, kept raw under unparsed.
- eg25-do-eg35, the characteristics page has no text, it is an image.
- r14-do-r17-x, older collage layout, the page 1 text is kept raw under unparsed.
- r14-do-r25, the characteristics page has no text, it is an image.
- v10, older collage layout, the page 1 text is kept raw under unparsed.
- d06-do-d10, the characteristics page has no text, it is an image.
- d10, older collage layout, the page 1 text is kept raw under unparsed.
- d12-r, older collage layout, the page 1 text is kept raw under unparsed.
- d12-rw, older collage layout, the page 1 text is kept raw under unparsed.
- d12-s-sf, older collage layout, the page 1 text is kept raw under unparsed.
- l14-do-l16-sp, the characteristics page has no text, it is an image.
- l14-do-l16-r-ri, older collage layout, the page 1 text is kept raw under unparsed.
- l14-do-l16-rw, older collage layout, the page 1 text is kept raw under unparsed.
- l14-do-l20, older collage layout, the page 1 text is kept raw under unparsed.
- l14-do-l20-ap, no title block found, benefits are running text, kept raw under unparsed, the characteristics page has no text, it is an image.
- m25, older collage layout, the page 1 text is kept raw under unparsed.
- t14-s-t20-do-t25-s-sf, older collage layout, the page 1 text is kept raw under unparsed.
- t16-do-t20-p, older collage layout, the page 1 text is kept raw under unparsed.
- t16-l, the characteristics page has no text, it is an image.
- t20-do-t25-ap, the characteristics page has no text, it is an image.
- t20-do-t25-rw, older collage layout, the page 1 text is kept raw under unparsed.
- t20-do-t25-r-sr, older collage layout, the page 1 text is kept raw under unparsed.
- t20-do-t25-sp, the characteristics page has no text, it is an image.
- t25-do-t30, older collage layout, the page 1 text is kept raw under unparsed.
- mp13, older collage layout, the page 1 text is kept raw under unparsed.
- p40-do-p60-c, the characteristics page has no text, it is an image.
- k-5231, older collage layout, the page 1 text is kept raw under unparsed.
- c-matic-i-c-matic-hp, the characteristics page has no text, it is an image.
- l-matic-core, the characteristics page has no text, it is an image.
