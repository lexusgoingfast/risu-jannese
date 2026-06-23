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

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (isMobile) {
    root.style.setProperty('--rj-scale', '1');
    return;
  }

  const styles = window.getComputedStyle(root);
  const designWidth = parseFloat(styles.getPropertyValue('--rj-design-width')) || 1380;
  const designHeight = parseFloat(styles.getPropertyValue('--rj-design-height')) || 982;
  const scale = Math.min(
    document.documentElement.clientWidth / designWidth,
    window.innerHeight / designHeight,
    1
  );

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

/* Source of truth for the artist explorer. One entry per work; the artist(s)
   are parsed from the title (everything before the first spaced dash). */
const RJ_PROJECTS = [
  { title: '9mice – Do Vesni', videoId: 'Wb4-qaF7RAs' },
  { title: '9mice, Егор Крид, тёмный принц, madk1d – Jealous', videoId: 'q4pVTvUOWJA' },
  { title: '9mice – ГОША РУБЧИНСКИЙ', videoId: '9FfB-mhoy08' },
  { title: '9mice – u+me', videoId: 'vQZY-0rws3w' },
  { title: 'Nettspend – Tommy', videoId: 'nyMawpTaaG8' },
  { title: 'Exvy, Fakov, FBS – Shhh', videoId: 'L-hu8_cRbVE' },
  { title: 'madk1d – дырки в штанах', videoId: '3KVuiRBk5RI' },
  { title: '9mice - SEOUL', videoId: '5X0HY_n77sU' },
  { title: 'BRUNETTE – TRY', videoId: 'WblRgIwyWi4' },
  { title: 'myspacemark - mannequin', videoId: '9YAbR-LkuAU' },
  { title: 'gotlibgotlibgotlib — aromat', videoId: 'xnFAk-6Mt84' },
  { title: 'Егор Крид – Море', videoId: 'qrU4xhBvMhc' },
  { title: 'Элджей, Onative - MAC&CHEESE', videoId: 'wr6zDt-zV1w' },
  { title: 'Foolboi Sasha - GOINGMYWAY', videoId: '0HIj_OZTm3Q' },
  { title: 'Элджей, ANIKV - SPORT', videoId: 'TPP5agm13DI' },
  { title: '9mice – RIOT MUZIK', videoId: 'yxc37RhrmxY' },
  { title: 'India', photoGallery: 'india' },
  { title: 'VIPERR X LIFEISWAR', photoGallery: 'viperr' },
];

// A dash flanked by spaces splits "Artist(s) – Project". Names like "u+me"
// or "MAC&CHEESE" have no such dash and are left intact.
const RJ_ARTIST_SEPARATOR = /\s[–—-]\s/;

function rjBuildArtistIndex(projects) {
  const map = new Map();
  projects.forEach((project) => {
    const match = project.title.match(RJ_ARTIST_SEPARATOR);
    let artistsRaw;
    let label;
    if (match) {
      artistsRaw = project.title.slice(0, match.index);
      label = project.title.slice(match.index + match[0].length).trim();
    } else {
      artistsRaw = project.title;
      label = project.title.trim();
    }
    const artists = artistsRaw
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    artists.forEach((name) => {
      const key = name.toLocaleLowerCase('ru');
      if (!map.has(key)) map.set(key, { key, name, works: [] });
      map.get(key).works.push({
        label,
        videoId: project.videoId || null,
        photoGallery: project.photoGallery || null,
      });
    });
  });
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

function rjPad(value, size) {
  return String(value).padStart(size, '0');
}

function initProjectsExplorer() {
  const root = document.querySelector('.rj-projects');
  if (!root) return;
  const list = root.querySelector('.rj-artist-list');
  const worksPanel = root.querySelector('.rj-artist-works');
  if (!list || !worksPanel) return;

  const artists = rjBuildArtistIndex(RJ_PROJECTS);
  const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const itemByKey = new Map();
  const groupByKey = new Map();

  artists.forEach((artist, index) => {
    const li = document.createElement('li');
    li.className = 'rj-artist';
    li.dataset.key = artist.key;

    const idx = document.createElement('span');
    idx.className = 'rj-artist-index';
    idx.textContent = `${rjPad(index + 1, 2)}.`;

    const nameBtn = document.createElement('button');
    nameBtn.className = 'rj-artist-name';
    nameBtn.type = 'button';
    nameBtn.textContent = artist.name;

    li.append(idx, nameBtn);
    list.appendChild(li);
    itemByKey.set(artist.key, li);

    const group = document.createElement('ol');
    group.className = 'rj-artist-works-group';
    group.dataset.key = artist.key;
    group.hidden = true;

    artist.works.forEach((work, workIndex) => {
      const workItem = document.createElement('li');
      workItem.className = 'rj-work';

      const workIdx = document.createElement('span');
      workIdx.className = 'rj-work-index';
      workIdx.textContent = `${rjPad(workIndex + 1, 3)}.`;

      const workBtn = document.createElement('button');
      workBtn.className = 'rj-project rj-project-trigger';
      workBtn.type = 'button';
      workBtn.textContent = work.label;
      if (work.videoId) workBtn.dataset.videoId = work.videoId;
      if (work.photoGallery) workBtn.dataset.photoGallery = work.photoGallery;

      workItem.append(workIdx, workBtn);
      group.appendChild(workItem);
    });

    worksPanel.appendChild(group);
    groupByKey.set(artist.key, group);
  });

  let pinnedKey = null;

  const setActive = (key) => {
    root.classList.add('is-exploring');
    itemByKey.forEach((item, k) => item.classList.toggle('is-active', k === key));
    groupByKey.forEach((group, k) => { group.hidden = k !== key; });
  };

  const clearActive = () => {
    root.classList.remove('is-exploring');
    itemByKey.forEach((item) => item.classList.remove('is-active'));
    groupByKey.forEach((group) => { group.hidden = true; });
  };

  const restore = () => {
    if (pinnedKey) setActive(pinnedKey);
    else clearActive();
  };

  itemByKey.forEach((item, key) => {
    const nameBtn = item.querySelector('.rj-artist-name');

    if (!isTouchLike) {
      item.addEventListener('mouseenter', () => setActive(key));
      nameBtn.addEventListener('focus', () => setActive(key));
    }

    nameBtn.addEventListener('click', () => {
      if (pinnedKey === key) {
        pinnedKey = null;
        if (isTouchLike) clearActive();
        else setActive(key);
      } else {
        pinnedKey = key;
        setActive(key);
      }
    });
  });

  if (!isTouchLike) {
    root.addEventListener('mouseleave', restore);
    root.addEventListener('focusout', (event) => {
      if (root.contains(event.relatedTarget)) return;
      restore();
    });
  }
}

function initTimer() {
  const timerElements = document.querySelectorAll('#rj-timer, .rj-timer');
  if (timerElements.length === 0) return false;
  if (document.documentElement.getAttribute('data-timer-running')) return true;
  document.documentElement.setAttribute('data-timer-running', 'true');

  // January 16, 12:30 Moscow time — same instant worldwide.
  const target = new Date('2027-01-16T12:30:00+03:00');

  const updateTimer = () => {
    const now = new Date();
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

function initStarLogoProtection() {
  document.querySelectorAll('.rj-star-logo-link').forEach((link) => {
    link.addEventListener('dragstart', (event) => event.preventDefault());
    link.addEventListener('contextmenu', (event) => event.preventDefault());
  });
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

  const closeButton = modal.querySelector('.rj-video-modal-close');
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
  const markLight = mark ? mark.querySelector('.rj-trayma-mark-img--light') : null;
  const lightTargets = document.querySelectorAll('.rj-trayma-title, .rj-trayma-subtitle');
  if (!trayma || !mark || !markLight || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frameId = null;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const isPointInRect = (x, y, rect) =>
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

  const setMarkLight = (event) => {
    const rect = mark.getBoundingClientRect();
    if (!isPointInRect(event.clientX, event.clientY, rect)) {
      mark.classList.remove('is-light-active');
      return;
    }

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const lightX = (x * 100).toFixed(2);
    const lightY = (y * 100).toFixed(2);

    mark.classList.add('is-light-active');
    markLight.style.setProperty('--rj-trayma-light-x', `${lightX}%`);
    markLight.style.setProperty('--rj-trayma-light-y', `${lightY}%`);
  };

  const resetMarkLight = () => {
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

  const setTextGroupLight = (event) => {
    const rect = getTextGroupRect();
    if (!isPointInRect(event.clientX, event.clientY, rect)) {
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

  const updateTraymaLight = (event) => {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(() => {
      setMarkLight(event);
      setTextGroupLight(event);
      if (isTouchLike) {
        lightTargets.forEach((target) => target.classList.add('is-light-hinted'));
      }
    });
  };

  const resetTraymaLight = () => {
    if (frameId) window.cancelAnimationFrame(frameId);
    resetMarkLight();
    resetTextGroupLight();
  };

  if (isTouchLike) {
    trayma.addEventListener('pointerdown', updateTraymaLight);
    trayma.addEventListener('pointermove', updateTraymaLight);
    trayma.addEventListener('pointerup', resetTraymaLight);
    trayma.addEventListener('pointercancel', resetTraymaLight);
    trayma.addEventListener('pointerleave', resetTraymaLight);
    return;
  }

  trayma.addEventListener('pointermove', updateTraymaLight);
  trayma.addEventListener('pointerleave', resetTraymaLight);
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
  initStarLogoProtection();
  initThemeMedia();
  initProjectsExplorer();
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
