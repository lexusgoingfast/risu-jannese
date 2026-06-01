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

function fitYearLists() {
  document.querySelectorAll('.rj-works-scroll').forEach((scroll) => {
    scroll.style.maxHeight = 'none';
  });
}

function fitPortfolioToViewport() {
  const root = document.documentElement;
  const portfolio = document.querySelector('.rj-portfolio');
  if (!portfolio) return;

  const styles = window.getComputedStyle(root);
  const designWidth = parseFloat(styles.getPropertyValue('--rj-design-width')) || portfolio.offsetWidth;
  const designHeight = parseFloat(styles.getPropertyValue('--rj-design-height')) || portfolio.offsetHeight;
  const sideGap = parseFloat(styles.getPropertyValue('--gap-red')) || 25;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const availableWidth = isMobile
    ? document.documentElement.clientWidth
    : Math.max(0, document.documentElement.clientWidth - sideGap * 2);
  const availableHeight = isMobile
    ? Number.POSITIVE_INFINITY
    : window.innerHeight;
  const scale = Math.min(availableWidth / designWidth, availableHeight / designHeight, 1);

  root.style.setProperty('--rj-scale', scale.toFixed(4));
}

function initWorkLists() {
  wrapWorksLists();
  fitYearLists();
  return true;
}

function initTimer() {
  const timerElement = document.getElementById('rj-timer');
  if (!timerElement) return false;
  if (timerElement.getAttribute('data-running')) return true;
  timerElement.setAttribute('data-running', 'true');

  const updateTimer = () => {
    const now = new Date();
    const target = new Date(2027, 0, 16, 0, 0, 0, 0);
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const mins = String(minutes).padStart(2, '0');
    const secs = String(seconds).padStart(2, '0');

    timerElement.innerText = `${days}:${hours}:${mins}:${secs}`;
  };

  updateTimer();
  setInterval(updateTimer, 1000);

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

function initProjectModal() {
  const modal = document.getElementById('rj-project-modal');
  const media = modal ? modal.querySelector('.rj-modal-media') : null;
  const panel = modal ? modal.querySelector('.rj-modal-panel') : null;
  const triggers = document.querySelectorAll('[data-video-id]');
  if (!modal || !media || triggers.length === 0) return;

  let activeTrigger = null;
  let mediaResetTimer = null;

  const openModal = (trigger) => {
    if (mediaResetTimer) window.clearTimeout(mediaResetTimer);
    activeTrigger = trigger;
    const title = trigger.textContent.trim();
    media.setAttribute('src', `https://www.youtube-nocookie.com/embed/${trigger.dataset.videoId}?rel=0`);
    media.setAttribute('title', title);
    if (panel) panel.setAttribute('aria-label', title);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rj-modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rj-modal-open');
    if (activeTrigger) activeTrigger.blur();
    activeTrigger = null;
    mediaResetTimer = window.setTimeout(() => {
      media.removeAttribute('src');
    }, 420);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger));
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initWorkLists();
  fitPortfolioToViewport();
  initTimer();
  initMediaFallbacks();
  initProjectModal();
  window.addEventListener('resize', () => {
    fitYearLists();
    fitPortfolioToViewport();
  });
  window.addEventListener('load', () => {
    fitYearLists();
    fitPortfolioToViewport();
  });
  if (document.fonts) {
    document.fonts.ready.then(() => {
      fitYearLists();
      fitPortfolioToViewport();
    });
  }
});
