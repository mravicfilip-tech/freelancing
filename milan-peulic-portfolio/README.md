# Milan Peulic portfolio 2026

The Diversify general portfolio, rebranded as Milan Peulic and written in first person. 24 pages,
1920 by 1080, same colours, same layout, same case studies.

`Portfolio_Milan_Peulic_2026.pdf` is the deliverable.

## What changed

- The name Diversify became Milan Peulic on the cover, page 2, the 20 page headers and all 24
  footers. The header and footer name is set in Manrope Medium, the face the deck already uses
  there. The cover name reuses the cover's own display face, letter for letter.
- The Diversify mark is gone from the cover, page 2 and the hero orb on page 1, and the four
  large outline watermarks on pages 1, 2, 7 and 12 are gone with it.
- The header tile and the hero orb now hold an MP monogram in Manrope Medium, white, in place of
  the mark. This is a placeholder until Milan has a mark of his own.
- The letsdiversify.com pill on the right of every header is removed. It goes back the moment
  there is a URL for it.
- We became I on pages 2, 8, 10, 13, 15, 16, 17 and 19. On page 2 the studio line now reads "I
  help companies turn digital products into growth engines through design and engineering."
- On page 19 the pull quote was also baked into the background photo. A small patch of that photo,
  with the old words removed, sits under the quote so only the new wording shows.
- The invisible text layer moves with every edit, so search and copy read the new words.

## What did not change

- The tagline "Building the Digital Future, Together." in every header.
- The footer line "A unified approach to product strategy, design, and engineering".
- The hero mock on page 1, including "Product Design & Dev Team".
- Every other word, image and position. A pixel diff against the source shows changes only in the
  regions listed above.

## Rebuild

The source is the Diversify PDF, which is marked confidential and is not kept in this repo. The
tools read it and write a new file.

```
pip install pymupdf fonttools uharfbuzz opencv-python-headless pillow numpy
# Manrope Medium from Google Fonts, saved as fonts/Manrope_500.ttf
python3 -I tools/rebrand.py tools <source.pdf> Portfolio_Milan_Peulic_2026.pdf fonts
```

`tools/rebrand.py` holds every edit in one place, so a URL for the pill or a real mark is a few
lines there. `tools/edit.py` moves the outline glyphs and the text layer together.
