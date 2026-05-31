# Layout variants — scroll/expand behavior

Snapshots of the work-list expand/collapse behavior so we can switch/roll back.
Each folder holds a full copy of `index.html`, `style.css`, `script.js`.

The **live** version is always in the project root. These folders are reference copies.

## Variants

- **v1-area-scroll** — Fixed poster frame. The whole work area (`.rj-scroll`)
  scrolls with a hidden scrollbar when expanded content exceeds the frame.
  Expand/collapse is instant (`display: none`). No animation.

- **v2-push-animation** — Same fixed frame + work-area scroll, but expanding a
  year animates its height open (CSS grid `1fr ⇄ 0fr`) and smoothly pushes the
  sections below it down. Items wrapped in `.rj-works-inner` via JS.

- **v3-inner-scroll** — Page/work-area does NOT scroll. Each year container has
  its own internal scroll (hidden scrollbar) capped at `--rj-year-max`, so a
  long year scrolls inside itself. (Downside: with several long years the page
  could still clip Photo — superseded by v4.)

- **v4-photo-pinned** — Photo is pinned and always visible. The Video category
  is the flexible block: it grows and pushes Photo down, but only until Photo
  reaches the bottom; past that the whole Video years region scrolls inside
  `.rj-years`. (Downside: the year labels scroll away with the projects.)

- **v5-static-year** — Like v4 (Photo pinned), year labels stay STATIC and each
  year's project list scrolls inside itself once it passes a fixed
  `--rj-year-max` cap. Downside: a long expanded year can still push the
  collapsed years below it (2024/2023) off-screen on short viewports.

- **v6-keep-collapsed** — Refines v5: collapsed years
  are fixed-height and ALWAYS stay visible. The expanded year(s) give up space
  (flex-shrink) and scroll their projects inside the leftover room, so 2024 &
  2023 remain visible even with 2025 open. Uses `:has()`; no magic cap.

- **v7-dynamic-year-fit** (current live, in root) — Keeps the v6 goals, but
  computes each expanded year's maximum height in JS. Short expanded years
  (like 2026) get full height first; the long year (2025) gets all remaining
  safe room and scrolls only if it still cannot physically fit. This avoids
  different hard-coded clipping across viewport sizes.

## Restore a variant

From the project root:

```bash
# roll back to variant 1
cp variants/v1-area-scroll/{index.html,style.css,script.js} .

# roll back to variant 2
cp variants/v2-push-animation/{index.html,style.css,script.js} .

# back to variant 3
cp variants/v3-inner-scroll/{index.html,style.css,script.js} .

# back to variant 4
cp variants/v4-photo-pinned/{index.html,style.css,script.js} .

# back to variant 5
cp variants/v5-static-year/{index.html,style.css,script.js} .

# back to variant 6
cp variants/v6-keep-collapsed/{index.html,style.css,script.js} .

# back to variant 7 (current)
cp variants/v7-dynamic-year-fit/{index.html,style.css,script.js} .
```
