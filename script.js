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

function fitTraymaToViewport() {
  const root = document.documentElement;
  const trayma = document.querySelector('.rj-trayma');
  if (!trayma) return;

  const scale = Math.min(
    document.documentElement.clientWidth / 1856,
    window.innerHeight / 1024,
    1
  );

  root.style.setProperty('--rj-trayma-scale', scale.toFixed(4));
}

function initWorkLists() {
  wrapWorksLists();
  fitYearLists();
  return true;
}

function initTimer() {
  const timerElements = document.querySelectorAll('#rj-timer, .rj-timer');
  if (timerElements.length === 0) return false;
  if (document.documentElement.getAttribute('data-timer-running')) return true;
  document.documentElement.setAttribute('data-timer-running', 'true');

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

    const timeText = `${days}:${hours}:${mins}:${secs}`;
    timerElements.forEach((timerElement) => {
      timerElement.innerText = timeText;
    });
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

function initTraymaLogoTilt() {
  const trayma = document.querySelector('.rj-trayma');
  const mark = document.querySelector('.rj-trayma-mark');
  const lightTargets = document.querySelectorAll('.rj-trayma-title, .rj-trayma-subtitle');
  if (!trayma || !mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frameId = null;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const setMarkLight = (event) => {
    const rect = mark.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const lightX = (x * 100).toFixed(2);
    const lightY = (y * 100).toFixed(2);

    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(() => {
      mark.classList.add('is-light-active');
      mark.style.setProperty('--rj-trayma-light-x', `${lightX}%`);
      mark.style.setProperty('--rj-trayma-light-y', `${lightY}%`);
    });
  };

  const resetTilt = () => {
    if (frameId) window.cancelAnimationFrame(frameId);
    mark.classList.remove('is-light-active');
  };

  const getTextGroupRect = () => {
    const rects = Array.from(lightTargets, (target) => target.getBoundingClientRect());
    return {
      left: Math.min(...rects.map((rect) => rect.left)),
      right: Math.max(...rects.map((rect) => rect.right)),
      top: Math.min(...rects.map((rect) => rect.top)),
      bottom: Math.max(...rects.map((rect) => rect.bottom)),
    };
  };

  const setTextGroupLight = (event, constrainToTextGroup = true) => {
    const rect = getTextGroupRect();
    const isInTextGroup =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (constrainToTextGroup && !isInTextGroup) {
      lightTargets.forEach((target) => target.classList.remove('is-light-active'));
      return;
    }

    lightTargets.forEach((target) => {
      const targetRect = target.getBoundingClientRect();
      const lightX = clamp(((event.clientX - targetRect.left) / targetRect.width) * 100, 0, 100).toFixed(2);
      const lightY = clamp(((event.clientY - targetRect.top) / targetRect.height) * 100, 0, 100).toFixed(2);

      target.classList.add('is-light-active');
      target.style.setProperty('--rj-trayma-text-light-x', `${lightX}%`);
      target.style.setProperty('--rj-trayma-text-light-y', `${lightY}%`);
    });
  };

  const resetTextGroupLight = () => {
    lightTargets.forEach((target) => target.classList.remove('is-light-active'));
  };

  if (isTouchLike) {
    mark.addEventListener('pointerdown', setMarkLight);
    mark.addEventListener('pointermove', setMarkLight);
    mark.addEventListener('pointerup', resetTilt);
    mark.addEventListener('pointercancel', resetTilt);
    mark.addEventListener('pointerleave', resetTilt);
    trayma.addEventListener('pointerdown', (event) => setTextGroupLight(event));
    trayma.addEventListener('pointermove', (event) => setTextGroupLight(event));
    trayma.addEventListener('pointerup', resetTextGroupLight);
    trayma.addEventListener('pointercancel', resetTextGroupLight);
    trayma.addEventListener('pointerleave', resetTextGroupLight);
    return;
  }

  mark.addEventListener('pointermove', setMarkLight);
  mark.addEventListener('pointerleave', resetTilt);
  trayma.addEventListener('pointermove', (event) => setTextGroupLight(event));
  trayma.addEventListener('pointerleave', resetTextGroupLight);
}

document.addEventListener('DOMContentLoaded', () => {
  initWorkLists();
  fitPortfolioToViewport();
  fitTraymaToViewport();
  initTimer();
  initMediaFallbacks();
  initProjectModal();
  initTraymaLogoTilt();
  window.addEventListener('resize', () => {
    fitYearLists();
    fitPortfolioToViewport();
    fitTraymaToViewport();
  });
  window.addEventListener('load', () => {
    fitYearLists();
    fitPortfolioToViewport();
    fitTraymaToViewport();
  });
  if (document.fonts) {
    document.fonts.ready.then(() => {
      fitYearLists();
      fitPortfolioToViewport();
      fitTraymaToViewport();
    });
  }
});
