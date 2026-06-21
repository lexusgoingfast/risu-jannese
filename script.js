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

  document.querySelectorAll('.rj-video-avatar').forEach((video) => {
    video.addEventListener('error', () => video.classList.add('rj-media-missing'));
  });
}

function initThemeMedia() {
  const lightVideo = document.querySelector('.rj-video-avatar--light');
  const darkVideo = document.querySelector('.rj-video-avatar--dark');
  if (!lightVideo || !darkVideo) return;

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = (isDark) => {
    const active = isDark ? darkVideo : lightVideo;
    const inactive = isDark ? lightVideo : darkVideo;
    inactive.pause();
    active.play().catch(() => {});
  };

  sync(mq.matches);
  mq.addEventListener('change', (event) => sync(event.matches));
}

const RJ_MODAL_ANIM_MS = 820;

function openModalAnimated(modal, onOpen) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('rj-modal-open');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      if (onOpen) onOpen();
    });
  });
}

function closeModalAnimated(modal, onSettled) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('rj-modal-open');
  window.setTimeout(() => {
    if (onSettled) onSettled();
  }, RJ_MODAL_ANIM_MS);
}

function initProjectModal() {
  const modal = document.getElementById('rj-project-modal');
  const media = modal ? modal.querySelector('.rj-modal-media') : null;
  const panel = modal ? modal.querySelector('.rj-modal-panel') : null;
  const triggers = document.querySelectorAll('[data-video-id]');
  if (!modal || !media || triggers.length === 0) return;

  let activeTrigger = null;

  const openModal = (trigger) => {
    activeTrigger = trigger;
    const title = trigger.textContent.trim();
    const videoSrc = `https://www.youtube-nocookie.com/embed/${trigger.dataset.videoId}?rel=0`;
    media.removeAttribute('src');
    media.setAttribute('title', title);
    if (panel) panel.setAttribute('aria-label', title);
    openModalAnimated(modal, () => {
      requestAnimationFrame(() => {
        media.setAttribute('src', videoSrc);
      });
    });
  };

  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    if (activeTrigger) activeTrigger.blur();
    activeTrigger = null;
    closeModalAnimated(modal, () => {
      media.removeAttribute('src');
    });
  };

  const closeButton = modal.querySelector('.rj-modal-close');
  if (closeButton) closeButton.addEventListener('click', closeModal);

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

const PHOTO_GALLERIES = {
  viperr: [
    'assets/photos/viperr-01.webp',
    'assets/photos/viperr-02.webp',
    'assets/photos/viperr-03.webp',
    'assets/photos/viperr-04.webp',
    'assets/photos/viperr-05.webp',
    'assets/photos/viperr-06.webp',
    'assets/photos/viperr-07.webp',
    'assets/photos/viperr-08.webp',
    'assets/photos/viperr-09.webp',
    'assets/photos/viperr-10.webp',
    'assets/photos/viperr-11.webp',
  ],
  india: [
    'assets/photos/india-01.webp',
    'assets/photos/india-02.webp',
    'assets/photos/india-03.webp',
    'assets/photos/india-04.webp',
    'assets/photos/india-05.webp',
    'assets/photos/india-07.webp',
    'assets/photos/india-08.webp',
    'assets/photos/india-09.webp',
    'assets/photos/india-10.webp',
    'assets/photos/india-11.webp',
    'assets/photos/india-12.webp',
    'assets/photos/india-13.webp',
    'assets/photos/india-14.webp',
    'assets/photos/india-15.webp',
    'assets/photos/india-16.webp',
    'assets/photos/india-17.webp',
    'assets/photos/india-18.webp',
    'assets/photos/india-19.webp',
  ],
};

function initPhotoModal() {
  const modal = document.getElementById('rj-photo-modal');
  const media = modal ? modal.querySelector('.rj-photo-modal-media') : null;
  const panel = modal ? modal.querySelector('.rj-photo-modal-panel') : null;
  const prevButton = modal ? modal.querySelector('.rj-photo-nav--prev') : null;
  const nextButton = modal ? modal.querySelector('.rj-photo-nav--next') : null;
  const triggers = document.querySelectorAll('[data-photo-gallery]');
  if (!modal || !media || !prevButton || !nextButton || triggers.length === 0) return;

  let activeTrigger = null;
  let activePhotos = [];
  let activeIndex = 0;

  const renderPhoto = () => {
    const src = activePhotos[activeIndex];
    const title = activeTrigger ? activeTrigger.textContent.trim() : 'Photo project';
    media.src = src;
    media.alt = `${title} photo ${activeIndex + 1}`;
    if (panel) panel.setAttribute('aria-label', `${title} photo ${activeIndex + 1} of ${activePhotos.length}`);
  };

  const showPhoto = (direction) => {
    if (activePhotos.length === 0) return;
    activeIndex = (activeIndex + direction + activePhotos.length) % activePhotos.length;
    renderPhoto();
  };

  const openModal = (trigger) => {
    const gallery = PHOTO_GALLERIES[trigger.dataset.photoGallery] || [];
    if (gallery.length === 0) return;

    const beginOpen = () => {
      activeTrigger = trigger;
      activePhotos = gallery;
      activeIndex = 0;
      renderPhoto();
      openModalAnimated(modal);
    };

    const preload = new Image();
    preload.onload = beginOpen;
    preload.onerror = beginOpen;
    preload.src = gallery[0];
    if (preload.complete) beginOpen();
  };

  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    if (activeTrigger) activeTrigger.blur();
    activeTrigger = null;
    closeModalAnimated(modal, () => {
      media.removeAttribute('src');
      activePhotos = [];
      activeIndex = 0;
    });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger));
  });

  const setNavCursor = (button, event) => {
    const rect = button.getBoundingClientRect();
    button.style.setProperty('--rj-photo-cursor-x', `${event.clientX - rect.left}px`);
    button.style.setProperty('--rj-photo-cursor-y', `${event.clientY - rect.top}px`);
  };

  [prevButton, nextButton].forEach((button) => {
    button.addEventListener('pointermove', (event) => setNavCursor(button, event));
  });

  prevButton.addEventListener('click', () => showPhoto(-1));
  nextButton.addEventListener('click', () => showPhoto(1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') showPhoto(-1);
    if (event.key === 'ArrowRight') showPhoto(1);
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
      if (isTouchLike) {
        lightTargets.forEach((target) => target.classList.add('is-light-hinted'));
      }
      mark.style.setProperty('--rj-trayma-light-x', `${lightX}%`);
      mark.style.setProperty('--rj-trayma-light-y', `${lightY}%`);
    });
  };

  const resetTilt = () => {
    if (frameId) window.cancelAnimationFrame(frameId);
    mark.classList.remove('is-light-active');
    lightTargets.forEach((target) => target.classList.remove('is-light-hinted'));
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

function initPreloader() {
  const overlay = document.getElementById('rj-preloader');
  if (!overlay) return;

  const start = performance.now();
  const MIN_VISIBLE = 1700; // run the intro for 1.7s, then fade out into the site
  let finished = false;

  const reveal = () => {
    if (finished) return;
    finished = true;
    const wait = Math.max(0, MIN_VISIBLE - (performance.now() - start));
    window.setTimeout(() => {
      overlay.classList.add('is-hidden');
      document.documentElement.classList.remove('rj-preloading');
      const cleanup = () => overlay.remove();
      overlay.addEventListener('transitionend', cleanup, { once: true });
      window.setTimeout(cleanup, 1100); // fallback if transitionend doesn't fire
    }, wait);
  };

  if (document.readyState === 'complete') {
    reveal();
  } else {
    window.addEventListener('load', reveal, { once: true });
    window.setTimeout(reveal, 6000); // safety net if `load` never fires
  }
}

initPreloader();

document.addEventListener('DOMContentLoaded', () => {
  initWorkLists();
  fitPortfolioToViewport();
  fitTraymaToViewport();
  initTimer();
  initMediaFallbacks();
  initThemeMedia();
  initProjectModal();
  initPhotoModal();
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
