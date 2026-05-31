function initSpoilers() {
  const labels = document.querySelectorAll('.rj-year-label');
  if (labels.length === 0) return false;

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
});
