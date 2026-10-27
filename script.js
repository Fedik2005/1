// Главная: колесо блюд, поле цвета главного ингредиента, сменяющиеся фразы
const phrases = ["We cook.", "We love.", "Je t'aime.", "cooking.", "WE."];
const MENU_URL = 'menu.html?v=13';

const root = document.documentElement;
const wheel = document.getElementById('wheel');
const wheelList = document.getElementById('wheelList');
const dishBox = document.getElementById('homeDish');
const swatch = document.getElementById('homeSwatch');
const fact = document.getElementById('homeFact');
const openDish = document.getElementById('openDish');
const openDishLabel = document.getElementById('openDishLabel');
const phrase = document.getElementById('phrase');
const pageFade = document.getElementById('pageFade');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneQuery = window.matchMedia('(max-width: 799px)');

const categoryName = {};
CATEGORIES.forEach(c => { categoryName[c.id] = c.name; });

function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

wheelList.innerHTML = RECIPES.map((r, i) =>
    '<li><button class="wheel-item" type="button" data-i="' + i + '" style="--f:' + r.field.color + '">' +
    '<span class="wheel-thumb"><img src="' + r.image + '" alt=""></span>' + escapeHtml(r.name) + '</button></li>'
).join('');
const items = Array.from(wheelList.querySelectorAll('.wheel-item'));

// фото заранее, чтобы смена была мгновенной
RECIPES.forEach(r => { const im = new Image(); im.src = r.image; });

let current = -1;

function placeWheel() {
    const el = items[current];
    if (!el) return;
    if (phoneQuery.matches) {
        const x = el.offsetLeft + el.offsetWidth / 2;
        wheelList.style.transform = 'translateX(' + (-x) + 'px)';
    } else {
        const y = el.parentElement.offsetTop + el.offsetHeight / 2;
        wheelList.style.transform = 'translateY(' + (-y) + 'px)';
    }
}

function show(i) {
    const n = RECIPES.length;
    i = (i + n) % n;
    if (i === current) return;
    const r = RECIPES[i];
    const first = current === -1;
    current = i;

    items.forEach((el, k) => {
        const d = Math.min(Math.abs(k - i), n - Math.abs(k - i));
        el.classList.toggle('is-current', k === i);
        el.classList.toggle('d1', d === 1);
        el.classList.toggle('d2', d === 2);
        el.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    placeWheel();

    // поле перекрашивается в цвет главного ингредиента
    root.style.setProperty('--field', r.field.color);
    root.style.setProperty('--field-ink', r.field.ink);

    // тарелку «ставят на стол»: старая уезжает, новая опускается с поворотом
    const old = dishBox.querySelector('img');
    const img = document.createElement('img');
    img.src = r.image;
    img.alt = r.name;
    dishBox.appendChild(img);
    if (!reduceMotion && img.animate) {
        img.animate([
            { opacity: 0, transform: 'translateX(18%) rotate(-18deg) scale(1.08)' },
            { opacity: 1, transform: 'none' }
        ], { duration: first ? 1100 : 950, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
    if (old) {
        if (!reduceMotion && old.animate) {
            old.animate([
                { opacity: 1, transform: 'none' },
                { opacity: 0, transform: 'translateX(-22%) rotate(12deg) scale(0.9)' }
            ], { duration: 650, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'forwards' }).finished.then(() => old.remove());
        } else {
            old.remove();
        }
    }

    const kcal = r.nutrition && r.nutrition.kcal ? ' · ' + r.nutrition.kcal + ' ккал на 100 г' : '';
    fact.innerHTML = '<b>' + escapeHtml(categoryName[r.category] || '') + '</b>' + kcal + ' · ' + r.ingredients.length + ' ингредиентов';
    swatch.innerHTML = 'На цвете: ' + escapeHtml(r.field.name.toLowerCase()) + '<span>' + r.field.color + '</span>';
    const href = MENU_URL + '#' + r.id;
    openDish.href = href;
    dishBox.href = href;
    openDishLabel.textContent = 'Открыть рецепт';
    openDish.setAttribute('aria-label', 'Открыть рецепт: ' + r.name);
}

// Автосмена блюд, пока человек не трогает колесо
let autoTimer = null;
let pausedUntil = 0;

function scheduleAuto() {
    clearTimeout(autoTimer);
    if (reduceMotion) return;
    autoTimer = setTimeout(() => {
        if (!document.hidden && Date.now() > pausedUntil) show(current + 1);
        scheduleAuto();
    }, 5200);
}

function userPick(i) {
    pausedUntil = Date.now() + 12000;
    show(i);
}

wheelList.addEventListener('click', (e) => {
    const b = e.target.closest('.wheel-item');
    if (b) userPick(+b.getAttribute('data-i'));
});

// колёсико мыши и клавиши листают блюда
let wheelLock = 0;
wheel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLock < 260) return;
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 4) return;
    wheelLock = now;
    userPick(current + (d > 0 ? 1 : -1));
}, { passive: false });

wheel.addEventListener('keydown', (e) => {
    const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!next) return;
    e.preventDefault();
    userPick(current + next);
    items[current].focus({ preventScroll: true });
});

// свайп по колесу и по полю на телефоне
let touchX = null;
[wheel, document.getElementById('homeField')].forEach(el => {
    el.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 40) userPick(current + (dx < 0 ? 1 : -1));
    });
});

window.addEventListener('resize', placeWheel);
phoneQuery.addEventListener('change', placeWheel);

// Лента всех блюд и подвал
const stripRow = document.getElementById('stripRow');
function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}
document.getElementById('stripCount').textContent = RECIPES.length + ' ' + plural(RECIPES.length, 'блюдо', 'блюда', 'блюд') + ', каждое на цвете своего главного ингредиента';
stripRow.innerHTML = RECIPES.map(r =>
    '<li class="strip-item"><a class="strip-link" href="' + MENU_URL + '#' + r.id + '">' +
    '<span class="strip-frame" style="--f:' + r.field.color + '"><img src="' + r.image + '" alt="" loading="lazy"></span>' +
    '<span class="strip-name">' + escapeHtml(r.name) + '</span>' +
    '<span class="strip-kcal">' + (r.nutrition && r.nutrition.kcal ? r.nutrition.kcal + ' ккал · ' : '') + escapeHtml(r.field.name.toLowerCase()) + '</span>' +
    '</a></li>'
).join('');

const stripItems = Array.from(stripRow.querySelectorAll('.strip-item'));
if (reduceMotion || !('IntersectionObserver' in window)) {
    stripItems.forEach(el => el.classList.add('is-in'));
} else {
    const io = new IntersectionObserver((entries) => {
        let k = 0;
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            en.target.style.transitionDelay = (k++ * 80) + 'ms';
            en.target.classList.add('is-in');
            io.unobserve(en.target);
        });
    }, { rootMargin: '0px 0px -10% 0px' });
    stripItems.forEach(el => io.observe(el));
}

// колёсико мыши листает ленту вбок, пока ей есть куда ехать
stripRow.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = stripRow.scrollWidth - stripRow.clientWidth;
    if ((e.deltaY > 0 && stripRow.scrollLeft >= max - 1) || (e.deltaY < 0 && stripRow.scrollLeft <= 0)) return;
    e.preventDefault();
    stripRow.scrollLeft += e.deltaY;
}, { passive: false });

const footLinks = [{ id: 'all', name: 'Все блюда', n: RECIPES.length }]
    .concat(CATEGORIES.map(c => ({ id: c.id, name: c.name, n: RECIPES.filter(r => r.category === c.id).length })).filter(c => c.n))
    .concat([{ id: 'favorites', name: 'Избранное', n: 0 }]);
document.getElementById('footLinks').innerHTML = footLinks.map(c =>
    '<li><a href="' + MENU_URL + '#' + c.id + '">' + escapeHtml(c.name) + (c.n ? '<span>' + c.n + '</span>' : '') + '</a></li>'
).join('');

// ссылки подвала поднимаются по очереди, когда до них доходит прокрутка
const footItems = Array.from(document.querySelectorAll('#footLinks li'));
if (reduceMotion || !('IntersectionObserver' in window)) {
    footItems.forEach(el => el.classList.add('is-in'));
} else {
    const footIo = new IntersectionObserver((entries) => {
        if (!entries.some(en => en.isIntersecting)) return;
        footItems.forEach((el, k) => {
            el.style.transitionDelay = (k * 70) + 'ms';
            el.classList.add('is-in');
        });
        footIo.disconnect();
    }, { rootMargin: '0px 0px -15% 0px' });
    footIo.observe(document.getElementById('footLinks'));
}

const footDish = RECIPES.find(r => r.id === 'pizzasuper') || RECIPES[0];
const footPhoto = document.getElementById('footPhoto');
footPhoto.style.setProperty('--foot-field', footDish.field.color);
footPhoto.href = MENU_URL + '#' + footDish.id;
footPhoto.innerHTML = '<img src="' + footDish.image + '" alt="" loading="lazy">';


// сменяющиеся фразы
let phraseIndex = 0;
function nextPhrase() {
    phrase.classList.add('is-out');
    setTimeout(() => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        phrase.textContent = phrases[phraseIndex];
        phrase.classList.remove('is-out');
    }, 600);
}
if (!reduceMotion) setInterval(() => { if (!document.hidden) nextPhrase(); }, 3600);

// при каждом заходе - своё блюдо
show(Math.floor(Math.random() * RECIPES.length));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeWheel);
scheduleAuto();

// Плавное появление страницы и переход в рецепты
requestAnimationFrame(() => pageFade.classList.add('is-hidden'));

document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="menu.html"]');
    if (!a) return;
    e.preventDefault();
    pageFade.classList.remove('is-hidden');
    setTimeout(() => { window.location.href = a.getAttribute('href'); }, 380);
});

// Возврат кнопкой «назад» в Safari показывает страницу из кэша - снимаем затемнение
window.addEventListener('pageshow', () => pageFade.classList.add('is-hidden'));
