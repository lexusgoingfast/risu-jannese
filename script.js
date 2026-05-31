function wrapWorksLists() {
  document.querySelectorAll('.rj-works-list').forEach((list) => {
    if (list.querySelector(':scope > .rj-works-inner')) return;
    const inner = document.createElement('div');
    inner.className = 'rj-works-inner';
    const scroll = document.createElement('div');
    scroll.className = 'rj-works-scroll';
    while (list.firstChild) scroll.appendChild(list.firstChild);
    inner.appendChild(scroll);
    list.appendChild(inner);
  });
}

function getBlockCost(block) {
  const styles = window.getComputedStyle(block);
  return block.offsetHeight + parseFloat(styles.marginBottom || '0');
}

function fitYearLists() {
  const years = document.querySelector('.rj-years');
  if (!years) return;

  const blocks = Array.from(years.querySelectorAll(':scope > .rj-year-block'));
  const expanded = [];
  let fixedHeight = 0;

  blocks.forEach((block) => {
    const list = block.querySelector('.rj-works-list');
    const scroll = block.querySelector('.rj-works-scroll');
    if (!list || !scroll) return;

    // Measure each list at its natural height first.
    scroll.style.maxHeight = 'none';

    if (list.classList.contains('collapsed')) {
      fixedHeight += getBlockCost(block);
    } else {
      const styles = window.getComputedStyle(block);
      expanded.push({
        block,
        scroll,
        desired: scroll.scrollHeight,
        min: block.querySelector('.rj-year-label')?.offsetHeight || 0,
        margin: parseFloat(styles.marginBottom || '0'),
      });
    }
  });

  if (expanded.length === 0) return;

  let available = years.clientHeight - fixedHeight;
  expanded.forEach((item) => { available -= item.margin; });
  available = Math.max(0, available);

  // Give short expanded years their full height first; long years get the
  // remaining room and scroll internally. This keeps collapsed years visible.
  const sorted = [...expanded].sort((a, b) => a.desired - b.desired);
  const sizes = new Map();
  let remaining = available;
  let pending = sorted.length;

  for (const item of sorted) {
    const fairShare = pending > 0 ? remaining / pending : 0;
    if (item.desired <= fairShare) {
      sizes.set(item, item.desired);
      remaining -= item.desired;
      pending -= 1;
    }
  }

  const unsized = sorted.filter((item) => !sizes.has(item));
  const shared = unsized.length > 0 ? remaining / unsized.length : 0;

  unsized.forEach((item) => {
    sizes.set(item, Math.max(item.min, shared));
  });

  expanded.forEach((item) => {
    const size = Math.max(0, Math.floor(sizes.get(item) || item.min));
    item.scroll.style.maxHeight = `${size}px`;
  });
}

function initSpoilers() {
  const labels = document.querySelectorAll('.rj-year-label');
  if (labels.length === 0) return false;

  wrapWorksLists();
  fitYearLists();

  labels.forEach((label) => {
    label.addEventListener('click', function () {
      const toggleIcon = this.querySelector('.rj-toggle');
      const worksList = this.nextElementSibling;
      if (!worksList) return;

      if (worksList.classList.contains('collapsed')) {
        worksList.classList.remove('collapsed');
        if (toggleIcon) toggleIcon.textContent = 'v';
      } else {
        worksList.classList.add('collapsed');
        if (toggleIcon) toggleIcon.textContent = '>';
      }

      fitYearLists();
    });
  });

  return true;
}

function initTimer() {
  const timerElement = document.getElementById('rj-timer');
  if (!timerElement) return false;
  if (timerElement.getAttribute('data-running')) return true;
  timerElement.setAttribute('data-running', 'true');

  let d = 227;
  let h = 6;
  let m = 30;
  let s = 19;

  setInterval(() => {
    s++;
    if (s >= 60) { s = 0; m++; }
    if (m >= 60) { m = 0; h++; }
    if (h >= 24) { h = 0; d++; }

    const mins = m < 10 ? '0' + m : m;
    const secs = s < 10 ? '0' + s : s;

    timerElement.innerText = `${d}:${h}:${mins}:${secs}`;
  }, 1000);

  return true;
}

const BLANK_PIXEL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

function markMissing(img) {
  if (img.dataset.missing) return;
  img.dataset.missing = 'true';
  img.classList.add('rj-media-missing');
  img.removeAttribute('alt');
  img.src = BLANK_PIXEL;
}

function initMediaFallbacks() {
  document.querySelectorAll('.rj-profile-pic, .rj-star-logo').forEach((img) => {
    img.addEventListener('error', () => markMissing(img));
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  const video = document.querySelector('.rj-video-avatar');
  if (video) {
    video.addEventListener('error', () => video.classList.add('rj-media-missing'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSpoilers();
  initTimer();
  initMediaFallbacks();
  window.addEventListener('resize', fitYearLists);
  window.addEventListener('load', fitYearLists);
  if (document.fonts) {
    document.fonts.ready.then(fitYearLists);
  }
});
