'use strict';

const LITURGY_SCHEDULE = [
  { day: 6, hour: 8, minute: 0, labelEn: 'Saturday Liturgy', labelAr: 'قداس السبت' },
  { day: 0, hour: 6, minute: 0, labelEn: 'Sunday First Liturgy', labelAr: 'قداس الأحد الأول' },
  { day: 0, hour: 8, minute: 0, labelEn: 'Sunday Second Liturgy', labelAr: 'قداس الأحد الثاني' },
  { day: 3, hour: 8, minute: 0, labelEn: 'Wednesday Liturgy', labelAr: 'قداس الأربعاء' },
  { day: 4, hour: 8, minute: 0, labelEn: 'Thursday Liturgy', labelAr: 'قداس الخميس' },
  { day: 5, hour: 7, minute: 30, labelEn: 'Friday First Liturgy', labelAr: 'قداس الجمعة الأول' },
  { day: 5, hour: 9, minute: 30, labelEn: 'Friday Second Liturgy', labelAr: 'قداس الجمعة الثاني' }
];

function getCurrentLanguage() {
  return localStorage.getItem('siteLang') || 'en';
}

function decodeValue(value) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function setTextOrHtml(element, value) {
  const decoded = decodeValue(value);
  if (element.dataset.i18n === 'html') {
    element.innerHTML = decoded;
  } else {
    element.textContent = decoded;
  }
}

function applyLanguage(lang) {
  const html = document.documentElement;
  const body = document.body;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('siteLang', lang);

  document.querySelectorAll('[data-en][data-ar]').forEach((element) => {
    const value = lang === 'ar' ? element.dataset.ar : element.dataset.en;
    setTextOrHtml(element, value);
  });

  document.querySelectorAll('[data-en-placeholder][data-ar-placeholder]').forEach((element) => {
    const value = lang === 'ar' ? element.dataset.arPlaceholder : element.dataset.enPlaceholder;
    element.placeholder = decodeValue(value);
  });

  document.querySelectorAll('option[data-en][data-ar]').forEach((option) => {
    const value = lang === 'ar' ? option.dataset.ar : option.dataset.en;
    option.textContent = decodeValue(value);
  });

  const title = lang === 'ar' ? body.dataset.titleAr : body.dataset.titleEn;
  const desc = lang === 'ar' ? body.dataset.descAr : body.dataset.descEn;
  if (title) document.title = decodeValue(title);
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && desc) metaDesc.setAttribute('content', decodeValue(desc));

  updateCountdown();
  initNumberedGallery();
}

function toggleLanguage() {
  applyLanguage(getCurrentLanguage() === 'ar' ? 'en' : 'ar');
}

function toggleMenu() {
  const mob = document.getElementById('navMob');
  const btn = document.getElementById('hamburger');
  if (!mob || !btn) return;
  mob.classList.toggle('open');
  btn.classList.toggle('open');
}

function closeMenu() {
  const mob = document.getElementById('navMob');
  const btn = document.getElementById('hamburger');
  if (!mob || !btn) return;
  mob.classList.remove('open');
  btn.classList.remove('open');
}

function switchDaySchedule(dayId, btn) {
  document.querySelectorAll('.day-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.day-tab').forEach((tab) => tab.classList.remove('active'));

  const panel = document.getElementById(`day-${dayId}`);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

function nextOccurrence(item) {
  const now = new Date();
  const candidate = new Date(now);
  const diff = (item.day - now.getDay() + 7) % 7;
  candidate.setDate(now.getDate() + diff);
  candidate.setHours(item.hour, item.minute, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
  return candidate;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function getNextLiturgy() {
  let best = null;
  LITURGY_SCHEDULE.forEach((item) => {
    const when = nextOccurrence(item);
    if (!best || when < best.when) {
      best = { ...item, when };
    }
  });
  return best;
}

function updateCountdown() {
  const serviceEl = document.getElementById('cd-service');
  const dateEl = document.getElementById('cd-date');
  const dEl = document.getElementById('cd-d');
  const hEl = document.getElementById('cd-h');
  const mEl = document.getElementById('cd-m');
  const sEl = document.getElementById('cd-s');
  if (!serviceEl || !dateEl || !dEl || !hEl || !mEl || !sEl) return;

  const lang = getCurrentLanguage();
  const next = getNextLiturgy();
  const now = new Date();
  const diff = next.when - now;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  dEl.textContent = pad(days);
  hEl.textContent = pad(hours);
  mEl.textContent = pad(minutes);
  sEl.textContent = pad(seconds);

  serviceEl.textContent = lang === 'ar' ? next.labelAr : next.labelEn;
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const dateText = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(next.when);
  dateEl.textContent = dateText;
}

function submitForm(event) {
  event.preventDefault();
  const form = document.getElementById('contact-form');
  const ok = document.getElementById('form-ok');
  if (!form || !ok) return;
  ok.classList.add('show');
  form.reset();
}

function getGalleryLanguageText(index) {
  const lang = getCurrentLanguage();
  return {
    title: lang === 'ar' ? `الصورة ${index}` : `Photo ${index}`,
    missing: lang === 'ar' ? 'صورة من حياة الكنيسة' : 'A moment from church life',
    alt: lang === 'ar' ? `صورة رقم ${index}` : `Photo number ${index}`
  };
}

function createGalleryCard(index) {
  const texts = getGalleryLanguageText(index);
  const figure = document.createElement('figure');
  figure.className = 'gallery-card';

  const img = document.createElement('img');
  img.alt = texts.alt;
  img.dataset.galleryIndex = String(index);
  figure.appendChild(img);

  const caption = document.createElement('figcaption');
  caption.textContent = texts.title;
  figure.appendChild(caption);

  return { figure, img, caption };
}

function setGalleryPlaceholder(figure, caption, index) {
  const texts = getGalleryLanguageText(index);
  figure.innerHTML = `
    <div class="gallery-placeholder">
      <i class="fa-regular fa-image"></i>
      <strong>${texts.title}</strong>
      <p>${texts.missing}</p>
    </div>
  `;
  caption.textContent = texts.title;
}

function loadGalleryImage(img, figure, caption, index, attempt = 0) {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (attempt >= extensions.length) {
    setGalleryPlaceholder(figure, caption, index);
    return;
  }

  img.onerror = () => loadGalleryImage(img, figure, caption, index, attempt + 1);
  img.onload = () => {
    const texts = getGalleryLanguageText(index);
    img.alt = texts.alt;
    caption.textContent = texts.title;
  };
  img.src = `../assets/${index}.${extensions[attempt]}`;
}

function initNumberedGallery() {
  const container = document.getElementById('numbered-gallery');
  if (!container) return;

  container.innerHTML = '';
  for (let index = 1; index <= 25; index += 1) {
    const { figure, img, caption } = createGalleryCard(index);
    container.appendChild(figure);
    loadGalleryImage(img, figure, caption, index);
  }

  initGalleryInteractions();
}

let lightboxImages = [];
let lightboxIndex = 0;

function ensureLightbox() {
  if (document.getElementById('gallery-lightbox')) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.id = 'gallery-lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-dialog">
      <button type="button" class="lightbox-close" aria-label="Close gallery preview">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
      <img class="lightbox-img" alt="" />
      <div class="lightbox-count"></div>
    </div>
  `;

  document.body.appendChild(lightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('.lightbox-close')) {
      closeLightbox();
    } else if (event.target.closest('.lightbox-prev')) {
      showLightboxAt(lightboxIndex - 1);
    } else if (event.target.closest('.lightbox-next')) {
      showLightboxAt(lightboxIndex + 1);
    }
  });
}

function showLightboxAt(index) {
  if (!lightboxImages.length) return;
  lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
  const item = lightboxImages[lightboxIndex];
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  const image = lightbox.querySelector('.lightbox-img');
  const count = lightbox.querySelector('.lightbox-count');
  image.src = item.src;
  image.alt = item.alt;
  count.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;

  const showNav = lightboxImages.length > 1;
  lightbox.querySelectorAll('.lightbox-nav').forEach((btn) => {
    btn.style.display = showNav ? 'flex' : 'none';
  });
}

function openLightbox(images, startIndex) {
  ensureLightbox();
  lightboxImages = images;
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  showLightboxAt(startIndex);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function collectGalleryImages() {
  return Array.from(document.querySelectorAll('.gallery-card img'))
    .filter((img) => img.getAttribute('src'))
    .map((img) => {
      const figure = img.closest('.gallery-card');
      const caption = figure ? figure.querySelector('figcaption') : null;
      return { src: img.src, alt: img.alt, caption: caption ? caption.textContent : img.alt };
    });
}

function initGalleryInteractions() {
  document.querySelectorAll('.gallery-card img').forEach((img) => {
    if (img.dataset.lightboxBound) return;
    img.dataset.lightboxBound = 'true';
    img.addEventListener('click', () => {
      if (!img.getAttribute('src')) return;
      const images = collectGalleryImages();
      const startIndex = images.findIndex((item) => item.src === img.src);
      openLightbox(images, startIndex >= 0 ? startIndex : 0);
    });
  });
}

function initClergyCarousels() {
  document.querySelectorAll('.clergy-media').forEach((media) => {
    const slides = Array.from(media.querySelectorAll('.clergy-img'));
    const dots = Array.from(media.querySelectorAll('.clergy-dot'));
    if (slides.length <= 1) return;

    let current = slides.findIndex((slide) => slide.classList.contains('active'));
    if (current < 0) current = 0;

    setInterval(() => {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }, 4200);
  });
}

function initRevealElements() {
  const items = document.querySelectorAll('.reveal-up');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  items.forEach((item) => observer.observe(item));
}

window.addEventListener('scroll', () => {
  const btt = document.getElementById('btt');
  if (!btt) return;
  btt.classList.toggle('show', window.scrollY > 350);
});

document.addEventListener('click', (event) => {
  const nav = document.getElementById('nav');
  const mob = document.getElementById('navMob');
  if (!nav || !mob) return;
  if (!nav.contains(event.target) && !mob.contains(event.target)) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox && lightbox.classList.contains('open')) {
    if (event.key === 'ArrowRight') showLightboxAt(lightboxIndex + (document.documentElement.dir === 'rtl' ? -1 : 1));
    if (event.key === 'ArrowLeft') showLightboxAt(lightboxIndex + (document.documentElement.dir === 'rtl' ? 1 : -1));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-mob a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  applyLanguage(getCurrentLanguage());
  initNumberedGallery();
  initGalleryInteractions();
  initRevealElements();
  initClergyCarousels();
  const firstDayButton = document.querySelector('.day-tab.active') || document.querySelector('.day-tab');
  if (firstDayButton) {
    const onclickValue = firstDayButton.getAttribute('onclick') || '';
    const match = onclickValue.match(/switchDaySchedule\('([^']+)'/);
    if (match) switchDaySchedule(match[1], firstDayButton);
  }
  if (document.getElementById('cd-service')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
});
