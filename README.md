# Risu Jannise — Portfolio

Static single-page portfolio for visual artist **Risu Jannise**. Plain HTML/CSS/JS, no build step.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html      Page markup (bio, video/photo work lists, timer)
style.css       Layout + theme (two-column sidebar / content)
script.js       Year spoilers (collapse/expand), running timer, media fallbacks
assets/         Media
  rj-logo.svg      Header wordmark
  tr-white.svg     Sidebar TRAUMA star logo (vectorized from tr-white_tshirt.pdf)
  img_0326.jpg     Bio portrait
  undo-relife.mp4  Sidebar background video
```

Missing media degrades gracefully (neutral placeholder boxes via the
`rj-media-missing` fallback in `script.js`).

## Theme

| Token | Value |
| --- | --- |
| Background (`--rj-bg`) | `#FEFFFF` |
| Columns / page | `#F3F3F3` |
| Borders (`--rj-border`) | `#E0E0E0` |
| Text (`--rj-text`) | `#000000` |
| Links (`--rj-link`) | `#36237E` |

Spacing scale is driven by `--base: 25px` (red `25` / green `12` / blue `6`).

Fonts: **TT Interfaces** for body/UI (install locally or swap for a hosted copy), **Times New Roman** for the `Video` / `Photo` category headers.
