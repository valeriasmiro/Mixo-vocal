// =========================================================
// MIXO — лаборатория современного вокала
// Навигация, галерея афиш (из posters/posters.json), лайтбокс, анимации
// =========================================================

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------------- Появление элементов при скролле ---------------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = (!prefersReducedMotion && 'IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 })
  : null;

function revealOnScroll(el) {
  if (!revealObserver) {
    el.classList.add('is-visible');
    return;
  }
  el.classList.add('reveal');
  revealObserver.observe(el);
}

// Наблюдаем за всеми карточками и блоками
document.querySelectorAll('.plan, .promo__card, .stat, .process__card, .pricing__sale, .pricing__offer').forEach(revealOnScroll);

/* ---------------- Мобильное меню ---------------- */
const nav = document.querySelector('.nav');
const burger = document.getElementById('burger');

if (burger) {
  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('.nav__links a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  });
});

/* ---------------- Галерея афиш ---------------- */
const wall = document.getElementById('galleryWall');
let posters = [];
let currentIndex = 0;

function titleFromFilename(filename) {
  if (!filename) return 'Афиша';
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Афиша';
}

function renderEmptyState() {
  if (!wall) return;
  wall.innerHTML = `
    <div class="gallery__empty">
      <div class="gallery__empty-frame"></div>
      <p>Афиши скоро появятся здесь.<br>
      Добавьте изображение в папку <code>posters/</code> и впишите его имя
      в <code>posters/posters.json</code>.</p>
    </div>`;
}

function renderPosters(list) {
  if (!wall) return;
  if (!list || !list.length) {
    renderEmptyState();
    return;
  }
  wall.innerHTML = list.map((item, i) => {
    const file = item.file || item;
    const title = item.title || titleFromFilename(file);
    return `
      <figure class="frame" data-index="${i}" tabindex="0" role="button" aria-label="Открыть афишу «${title}»">
        <span class="frame__ribbon" aria-hidden="true"></span>
        <div class="frame__mat">
          <img src="posters/${encodeURIComponent(file)}" alt="${title}" loading="lazy"
               onerror="this.closest('.frame').style.display='none'">
        </div>
        <figcaption class="frame__title">${title}</figcaption>
      </figure>`;
  }).join('');

  wall.querySelectorAll('.frame').forEach(frame => {
    frame.addEventListener('click', () => {
      const idx = Number(frame.dataset.index);
      if (!isNaN(idx)) openLightbox(idx);
    });
    frame.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = Number(frame.dataset.index);
        if (!isNaN(idx)) openLightbox(idx);
      }
    });
    revealOnScroll(frame);
  });
}

// Загрузка постеров
fetch('posters/posters.json')
  .then(res => {
    if (!res.ok) throw new Error('posters.json не найден');
    return res.json();
  })
  .then(data => {
    posters = Array.isArray(data) ? data : [];
    renderPosters(posters);
  })
  .catch(() => {
    posters = [];
    renderEmptyState();
  });

/* ---------------- Лайтбокс: просмотр и приближение ---------------- */
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbTitle = document.getElementById('lbTitle');
const lbZoomWrap = document.getElementById('lbZoomWrap');
const lbHint = document.getElementById('lbHint');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

let isZoomed = false;
let dragState = null;
let panX = 0, panY = 0;

function openLightbox(index) {
  if (!posters || !posters.length) return;
  if (index < 0 || index >= posters.length) return;
  currentIndex = index;
  updateLightboxContent();
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  resetZoom();
}

function updateLightboxContent() {
  const item = posters[currentIndex];
  if (!item) return;
  const file = item.file || item;
  const title = item.title || titleFromFilename(file);
  lbImage.src = `posters/${encodeURIComponent(file)}`;
  lbImage.alt = title;
  lbTitle.textContent = title;
  resetZoom();
}

function resetZoom() {
  isZoomed = false;
  panX = 0;
  panY = 0;
  if (lbZoomWrap) lbZoomWrap.classList.remove('is-zoomed');
  if (lbImage) lbImage.style.transform = 'translate(0,0) scale(1)';
  if (lbHint) lbHint.textContent = 'Нажмите на афишу, чтобы приблизить';
}

function showNext() {
  if (!posters || !posters.length) return;
  currentIndex = (currentIndex + 1) % posters.length;
  updateLightboxContent();
}

function showPrev() {
  if (!posters || !posters.length) return;
  currentIndex = (currentIndex - 1 + posters.length) % posters.length;
  updateLightboxContent();
}

// Обработчики событий (с проверкой на существование элементов)
if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lbNext) lbNext.addEventListener('click', showNext);
if (lbPrev) lbPrev.addEventListener('click', showPrev);

if (lightbox) {
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
}

document.addEventListener('keydown', e => {
  if (!lightbox || !lightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

// Клик по изображению — приблизить/отдалить
if (lbZoomWrap) {
  lbZoomWrap.addEventListener('click', () => {
    isZoomed = !isZoomed;
    if (isZoomed) {
      lbImage.style.transform = `translate(${panX}px, ${panY}px) scale(2.2)`;
      lbZoomWrap.classList.add('is-zoomed');
      lbHint.textContent = 'Перетащите, чтобы рассмотреть детали';
    } else {
      resetZoom();
    }
  });

  // Перетаскивание при приближении
  lbZoomWrap.addEventListener('mousedown', e => {
    if (!isZoomed) return;
    dragState = { startX: e.clientX - panX, startY: e.clientY - panY };
    e.preventDefault();
  });
}

window.addEventListener('mousemove', e => {
  if (!dragState || !isZoomed || !lbImage) return;
  panX = e.clientX - dragState.startX;
  panY = e.clientY - dragState.startY;
  lbImage.style.transform = `translate(${panX}px, ${panY}px) scale(2.2)`;
});

window.addEventListener('mouseup', () => {
  dragState = null;
});

// Свайп на тач-устройствах для переключения афиш
let touchStartX = null;
if (lbZoomWrap) {
  lbZoomWrap.addEventListener('touchstart', e => {
    if (isZoomed) return;
    touchStartX = e.touches[0].clientX;
  });

  lbZoomWrap.addEventListener('touchend', e => {
    if (isZoomed || touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? showPrev() : showNext();
    }
    touchStartX = null;
  });
}

/* ---------------- Плавный скролл для якорных ссылок ---------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

/* ---------------- Защита от дублирования при быстрых кликах ---------------- */
let isLightboxOpening = false;

const originalOpenLightbox = openLightbox;
openLightbox = function(index) {
  if (isLightboxOpening) return;
  isLightboxOpening = true;
  originalOpenLightbox(index);
  setTimeout(() => {
    isLightboxOpening = false;
  }, 300);
};

console.log('🎤 MIXO — лаборатория современного вокала');
console.log('🌿 Сайт загружен успешно!');