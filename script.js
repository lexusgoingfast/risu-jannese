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

/* Artist explorer — fixed artist order from Figma (259:2); works mapped explicitly. */
const RJ_ARTISTS = [
  { key: '9mice', name: '9mice' },
  { key: 'egor-kreed', name: 'egor kreed' },
  { key: 'nettspend', name: 'Nettspend' },
  { key: 'hype-o-holics', name: 'HYPE-O-HOLICS' },
  { key: 'madk1d', name: 'madk1d' },
  { key: 'gosha-rubchinskiy', name: 'gosha rubchinskiy' },
  { key: 'myspacemark', name: 'myspacemark' },
  { key: 'brunette', name: 'BRUNETTE' },
  { key: 'gotlibgotlibgotlib', name: 'gotlibgotlibgotlib' },
  { key: 'no-faith-studios', name: 'NO FAITH STUDIOS' },
  { key: 'viperr-x-lifeiswar', name: 'VIPERR X LIFEISWAR' },
  { key: 'eldzhey', name: 'eldzhey' },
  { key: 'anikv', name: 'ANIKV' },
  { key: 'dora', name: 'dora' },
  { key: 'trayma', name: 'TRAYMA' },
  { key: 'poemi-koso', name: 'Poemi Koso' },
];

const RJ_PROJECTS = [
  { label: 'Do Vesni', videoId: 'Wb4-qaF7RAs', role: 'Directed', artists: ['9mice'] },
  { label: 'Jealous', videoId: 'q4pVTvUOWJA', role: 'Camera', artists: ['9mice', 'egor-kreed', 'madk1d'] },
  { label: 'ГОША РУБЧИНСКИЙ', videoId: '9FfB-mhoy08', role: 'Directed', artists: ['9mice', 'gosha-rubchinskiy'] },
  { label: 'u+me', videoId: 'vQZY-0rws3w', role: 'Directed', artists: ['9mice'] },
  { label: 'SEOUL', videoId: '5X0HY_n77sU', role: 'Directed', artists: ['9mice'] },
  { label: 'RIOT MUZIK', videoId: 'yxc37RhrmxY', role: 'Directed', artists: ['9mice'] },
  { label: 'Tommy', videoId: 'nyMawpTaaG8', role: 'Edit', artists: ['nettspend'] },
  { label: 'Shhh', videoId: 'L-hu8_cRbVE', role: 'Directed', artists: ['hype-o-holics'] },
  { label: 'дырки в штанах', videoId: '3KVuiRBk5RI', role: 'Edit', artists: ['madk1d'] },
  { label: 'TRY', videoId: 'WblRgIwyWi4', role: 'Edit', artists: ['brunette'] },
  { label: 'mannequin', videoId: '9YAbR-LkuAU', role: 'Edit', artists: ['myspacemark'] },
  { label: 'aromat', videoId: 'xnFAk-6Mt84', role: 'Edit', artists: ['gotlibgotlibgotlib'] },
  { label: 'Море', videoId: 'qrU4xhBvMhc', role: 'Edit', artists: ['egor-kreed'] },
  { label: 'MAC&CHEESE', videoId: 'wr6zDt-zV1w', role: 'Edit', artists: ['eldzhey'] },
  { label: 'SPORT', videoId: 'TPP5agm13DI', role: 'Directed', artists: ['eldzhey', 'anikv'] },
  { label: 'VIPERR X LIFEISWAR', photoGallery: 'viperr', artists: ['viperr-x-lifeiswar'] },
];

function rjBuildArtistExplorerData(artists, projects) {
  const worksByKey = new Map(artists.map((artist) => [artist.key, []]));
  projects.forEach((project) => {
    (project.artists || []).forEach((key) => {
      if (!worksByKey.has(key)) return;
      worksByKey.get(key).push({
        label: project.label,
        videoId: project.videoId || null,
        photoGallery: project.photoGallery || null,
        role: project.role || null,
      });
    });
  });
  return artists.map((artist) => ({
    ...artist,
    works: worksByKey.get(artist.key) || [],
  }));
}

function rjPad(value, size) {
  return String(value).padStart(size, '0');
}

/* Slug for URL routing — lowercase, unicode letters/numbers kept, rest → dashes. */
function rjSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* Breadcrumb router — reflects explorer/modal state in the address bar:
   /                          → home
   /projects/<artist>         → artist pinned
   /projects/<artist>/<work>  → work modal open
   The visible on-page breadcrumb can be layered on later. */
const rjRouter = {
  artistKey: null,
  workSlug: null,
  applying: false,
  works: new Map(),
  closers: [],
  _pin: null,
  _unpin: null,

  registerArtist(pin, unpin) {
    this._pin = pin;
    this._unpin = unpin;
  },
  registerWork(artistKey, slug, open) {
    this.works.set(`${artistKey}/${slug}`, open);
  },
  registerCloser(fn) {
    this.closers.push(fn);
  },

  path() {
    if (this.artistKey && this.workSlug) return `/projects/${this.artistKey}/${this.workSlug}`;
    if (this.artistKey) return `/projects/${this.artistKey}`;
    return '/';
  },
  push(replace) {
    const path = this.path();
    const state = { artistKey: this.artistKey, workSlug: this.workSlug };
    if (replace) {
      history.replaceState(state, '', path);
    } else if (path !== location.pathname) {
      history.pushState(state, '', path);
    }
  },

  setArtist(key) {
    if (this.applying) return;
    this.artistKey = key;
    this.workSlug = null;
    this.push(false);
  },
  clear() {
    if (this.applying) return;
    this.artistKey = null;
    this.workSlug = null;
    this.push(false);
  },
  setWork(artistKey, slug) {
    if (this.applying) return;
    this.artistKey = artistKey;
    this.workSlug = slug;
    this.push(false);
  },
  clearWork() {
    if (this.applying) return;
    this.workSlug = null;
    this.push(false);
  },

  parse(pathname) {
    const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts[0] !== 'projects') return { artistKey: null, workSlug: null };
    return { artistKey: parts[1] || null, workSlug: parts[2] || null };
  },

  apply(state) {
    const targetArtist = (state && state.artistKey) || null;
    const targetWork = (state && state.workSlug) || null;
    this.applying = true;
    this.closers.forEach((fn) => fn());
    if (targetArtist) {
      if (this._pin) this._pin(targetArtist);
    } else if (this._unpin) {
      this._unpin();
    }
    if (targetArtist && targetWork) {
      const open = this.works.get(`${targetArtist}/${targetWork}`);
      if (open) open();
    }
    this.artistKey = targetArtist;
    this.workSlug = targetWork;
    this.applying = false;
  },

  init() {
    if (!document.querySelector('.rj-projects')) return;
    const parsed = this.parse(location.pathname);
    if (parsed.artistKey) this.apply(parsed);
    this.push(true);
    window.addEventListener('popstate', (event) => {
      this.apply(event.state || this.parse(location.pathname));
    });
  },
};

function initProjectsExplorer() {
  const root = document.querySelector('.rj-projects');
  if (!root) return;
  const list = root.querySelector('.rj-artist-list');
  const worksPanel = root.querySelector('.rj-artist-works');
  if (!list || !worksPanel) return;

  const artists = rjBuildArtistExplorerData(RJ_ARTISTS, RJ_PROJECTS);

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
      workItem.className = 'rj-work rj-work-item';

      const workIdx = document.createElement('span');
      workIdx.className = 'rj-work-index';
      workIdx.textContent = `${rjPad(workIndex + 1, 3)}.`;

      const workBtn = document.createElement('button');
      workBtn.className = 'rj-project rj-project-trigger';
      workBtn.type = 'button';
      workBtn.textContent = work.label;
      if (work.videoId) workBtn.dataset.videoId = work.videoId;
      if (work.photoGallery) workBtn.dataset.photoGallery = work.photoGallery;

      const workSlug = rjSlug(work.label);
      workBtn.dataset.artistKey = artist.key;
      workBtn.dataset.workSlug = workSlug;
      rjRouter.registerWork(artist.key, workSlug, () => workBtn.click());

      workItem.append(workIdx, workBtn);
      if (work.role) {
        const role = document.createElement('span');
        role.className = 'rj-role';
        role.textContent = work.role;
        workItem.appendChild(role);
      }
      group.appendChild(workItem);
    });

    worksPanel.appendChild(group);
    groupByKey.set(artist.key, group);
  });

  let pinnedKey = null;
  let scrollLockY = 0;

  const lockScroll = () => {
    scrollLockY = window.scrollY;
    document.documentElement.classList.add('rj-projects-scroll-locked');
    document.body.style.top = `-${scrollLockY}px`;
  };

  const unlockScroll = () => {
    document.documentElement.classList.remove('rj-projects-scroll-locked');
    document.body.style.top = '';
    window.scrollTo(0, scrollLockY);
  };

  const render = () => {
    root.classList.toggle('is-pinned', Boolean(pinnedKey));
    itemByKey.forEach((item, k) => item.classList.toggle('is-active', k === pinnedKey));
    groupByKey.forEach((group, k) => { group.hidden = k !== pinnedKey; });
  };

  const pinDom = (key) => {
    if (pinnedKey === key) return;
    if (!pinnedKey) lockScroll();
    pinnedKey = key;
    render();
  };

  const unpinDom = () => {
    if (!pinnedKey) return;
    pinnedKey = null;
    unlockScroll();
    render();
  };

  rjRouter.registerArtist(pinDom, unpinDom);

  itemByKey.forEach((item, key) => {
    const nameBtn = item.querySelector('.rj-artist-name');

    nameBtn.addEventListener('click', () => {
      if (pinnedKey === key) {
        unpinDom();
        rjRouter.clear();
        return;
      }

      pinDom(key);
      rjRouter.setArtist(key);
    });
  });

  document.addEventListener('click', (event) => {
    if (!pinnedKey) return;
    if (event.target.closest('.rj-artist-name')) return;
    if (event.target.closest('.rj-artist-works')) return;
    if (event.target.closest('.rj-modal')) return;
    unpinDom();
    rjRouter.clear();
  });
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
    if (trigger.dataset.artistKey && trigger.dataset.workSlug) {
      rjRouter.setWork(trigger.dataset.artistKey, trigger.dataset.workSlug);
    }
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
    rjRouter.clearWork();
    closeModalAnimated(modal, () => {
      media.removeAttribute('src');
    });
  };

  rjRouter.registerCloser(closeModal);

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
      if (trigger.dataset.artistKey && trigger.dataset.workSlug) {
        rjRouter.setWork(trigger.dataset.artistKey, trigger.dataset.workSlug);
      }
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
    rjRouter.clearWork();
    closeModalAnimated(modal, () => {
      media.removeAttribute('src');
      activePhotos = [];
      activeIndex = 0;
    });
  };

  rjRouter.registerCloser(closeModal);

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
      const cleanup = () => {
        document.documentElement.classList.remove('rj-preloading');
        overlay.remove();
      };
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
  rjRouter.init();
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
