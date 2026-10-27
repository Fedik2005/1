// Полотно с блюдами, меню категорий и панель рецепта
document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const stage = $('stage');
    const canvas = $('canvas');
    const recipePanel = $('recipe');
    const recipeScroll = $('recipeScroll');
    const menu = $('menu');
    const menuButton = $('menuButton');
    const scrim = $('scrim');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktopQuery = window.matchMedia('(min-width: 900px)');

    const ALL = 'all';
    const FAVORITES = 'favorites';
    const byId = {};
    RECIPES.forEach(r => { byId[r.id] = r; });

    // ---------- localStorage (может быть недоступен в приватном режиме) ----------

    function load(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : v;
        } catch (e) {
            return fallback;
        }
    }

    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* без сохранения */ }
    }

    function getFavorites() {
        try { return JSON.parse(load('favorites', '[]')) || []; } catch (e) { return []; }
    }

    function setFavorites(list) {
        store('favorites', JSON.stringify(list));
    }

    function plural(n, one, few, many) {
        const m10 = n % 10, m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return one;
        if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
        return many;
    }

    function splitAmount(text) {
        const m = text.match(/^(.*?)\s+[—–-]\s+(.+)$/);
        return m ? [m[1], m[2]] : [text, ''];
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // ---------- Категории ----------

    let currentCategory = load('currentCategory', ALL);

    function recipesFor(view) {
        if (view === ALL) return RECIPES;
        if (view === FAVORITES) {
            const favs = getFavorites();
            return RECIPES.filter(r => favs.indexOf(r.name) !== -1);
        }
        return RECIPES.filter(r => r.category === view);
    }

    function viewName(view) {
        if (view === ALL) return 'Все блюда';
        if (view === FAVORITES) return 'Избранное';
        const c = CATEGORIES.find(c => c.id === view);
        return c ? c.name : 'Все блюда';
    }

    function isKnownView(view) {
        return view === ALL || view === FAVORITES || CATEGORIES.some(c => c.id === view);
    }

    if (!isKnownView(currentCategory)) currentCategory = ALL;

    function buildMenu() {
        const rows = [{ id: ALL }].concat(CATEGORIES, [{ id: 'sep' }, { id: FAVORITES }]);
        let i = 0;
        $('menuList').innerHTML = rows.map(row => {
            if (row.id === 'sep') return '<li aria-hidden="true"><div class="menu-sep"></div></li>';
            const n = recipesFor(row.id).length;
            const cls = 'menu-link' + (row.id === currentCategory ? ' is-current' : '') + (n ? '' : ' is-empty');
            return '<li><button class="' + cls + '" type="button" data-category="' + row.id + '" style="--i:' + (i++) + '"' +
                (row.id === currentCategory ? ' aria-current="true"' : '') + '>' +
                escapeHtml(viewName(row.id)) + '<span class="count">' + n + '</span></button></li>';
        }).join('');
        const total = RECIPES.length;
        $('menuTotal').textContent = total + ' ' + plural(total, 'рецепт', 'рецепта', 'рецептов');
    }

    function updateChrome() {
        $('viewName').textContent = viewName(currentCategory);
        $('viewCount').textContent = recipesFor(currentCategory).length;
        const favN = getFavorites().filter(name => RECIPES.some(r => r.name === name)).length;
        $('favCount').textContent = favN || '';
        $('favoriteIcon').classList.toggle('is-filled', currentCategory === FAVORITES);
    }

    function openMenu() {
        buildMenu();
        menu.classList.add('is-open');
        menuButton.setAttribute('aria-expanded', 'true');
        const current = menu.querySelector('.is-current');
        if (current) setTimeout(() => current.focus({ preventScroll: true }), 60);
    }

    function closeMenu() {
        menu.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu() {
        if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    }

    menuButton.addEventListener('click', toggleMenu);
    $('viewPill').addEventListener('click', toggleMenu);

    $('menuList').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-category]');
        if (!btn) return;
        closeMenu();
        changeCategory(btn.getAttribute('data-category'));
    });

    // Избранное: кнопка внизу переключает полотно на сохранённые блюда
    $('favoriteIcon').addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        changeCategory(currentCategory === FAVORITES ? ALL : FAVORITES);
    });

    $('emptyButton').addEventListener('click', () => changeCategory(ALL));

    document.addEventListener('pointerdown', (e) => {
        if (!menu.classList.contains('is-open')) return;
        if (e.target.closest('#menu, #menuButton, #viewPill')) return;
        closeMenu();
    });

    // ---------- Раскладка блюд по полотну ----------

    let items = [];
    let canvasW = 0, canvasH = 0;

    function seeded(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return function () {
            h += 0x6D2B79F5;
            let t = h;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function layout(list) {
        const W = window.innerWidth, H = window.innerHeight;
        const mobile = W < 700;
        const cell = mobile ? 150 : 230;
        const rowStep = cell;
        const caption = 34;
        const padX = mobile ? 24 : 60;
        const padTop = mobile ? 70 : 80;
        const padBottom = mobile ? 90 : 100;
        const n = list.length;
        const rand = seeded(currentCategory + ':' + n);

        const slots = n <= 2 ? n : Math.round(n * 1.3);
        let cols = Math.max(1, Math.round(Math.sqrt(slots * (W / H) * 1.1)));
        cols = Math.min(cols, slots || 1);
        const rows = Math.ceil(slots / cols) || 1;

        // Какие клетки займут блюда: часть остаётся пустой, чтобы был воздух
        const order = [];
        for (let i = 0; i < rows * cols; i++) order.push(i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        const used = order.slice(0, n).sort((a, b) => a - b);

        const single = n === 1;
        const stagger = rows > 1 ? cell * 0.5 : 0;
        canvasW = padX * 2 + cols * cell + stagger;
        canvasH = padTop + padBottom + rows * rowStep;
        if (single) {
            canvasW = Math.max(canvasW, cell * 2);
            canvasH = Math.max(canvasH, cell * 2);
        }

        // Каждое блюдо целиком помещается в свою клетку, поэтому соседи не наезжают
        return list.map((r, k) => {
            const slot = used[k];
            const row = Math.floor(slot / cols), col = slot % cols;
            const scale = single ? 1.7 : 0.6 + rand() * 0.28;
            const box = cell * scale;
            const ratio = r.width / r.height;
            const width = Math.round(Math.min(box, box * 0.86 * ratio));
            const height = width / ratio + caption;
            const jx = single ? 0 : (rand() - 0.5) * Math.max(0, cell - width) * 0.9;
            const jy = single ? 0 : (rand() - 0.5) * Math.max(0, rowStep - height) * 0.9;
            if (single) {
                return { recipe: r, x: canvasW / 2, y: canvasH / 2, width };
            }
            return {
                recipe: r,
                x: Math.round(padX + col * cell + cell / 2 + (row % 2 ? stagger : 0) + jx),
                y: Math.round(padTop + row * rowStep + rowStep / 2 + jy),
                width
            };
        });
    }

    function render(animate) {
        const list = recipesFor(currentCategory);
        items = layout(list);
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        canvas.innerHTML = items.map((it, i) =>
            '<button class="dish" type="button" data-id="' + it.recipe.id + '" style="left:' + it.x + 'px;top:' + it.y + 'px;width:' + it.width + 'px">' +
            '<img src="' + it.recipe.image + '" alt="" width="' + it.recipe.width + '" height="' + it.recipe.height + '" decoding="async"' + (i > 8 ? ' loading="lazy"' : '') + '>' +
            '<span class="dish-name">' + escapeHtml(it.recipe.name) + '</span></button>'
        ).join('');

        const empty = list.length === 0;
        $('emptyState').hidden = !empty;
        if (empty) {
            if (currentCategory === FAVORITES) {
                $('emptyTitle').textContent = 'Пока пусто';
                $('emptyText').textContent = 'У вас пока нет сохранённых рецептов. Нажмите на сердечко в рецепте, и он появится здесь.';
            } else {
                $('emptyTitle').textContent = viewName(currentCategory);
                $('emptyText').textContent = 'В этой категории пока нет рецептов. Скоро появятся.';
            }
        }

        zoom = 1;
        centerView();
        apply();
        updateZoomButtons();
        updateChrome();
        if (animate) entrance();
    }

    // Появление: блюда «ложатся» на стену от центра к краям
    function entrance() {
        if (reduceMotion || !canvas.animate) return;
        const cx = -panX + window.innerWidth / 2, cy = -panY + window.innerHeight / 2;
        canvas.querySelectorAll('.dish').forEach((el, i) => {
            const it = items[i];
            const d = Math.hypot(it.x - cx, it.y - cy);
            el.animate([
                { opacity: 0, transform: 'translate(-50%, calc(-50% + 18px)) scale(0.96)' },
                { opacity: 1, transform: 'translate(-50%, -50%)' }
            ], { duration: 700, delay: Math.min(d * 0.45, 420), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
        });
    }

    function changeCategory(view) {
        if (!isKnownView(view)) return;
        if (view === currentCategory && canvas.children.length) {
            updateChrome();
            return;
        }
        currentCategory = view;
        store('currentCategory', view);
        if (reduceMotion) {
            render(false);
            return;
        }
        canvas.classList.add('is-leaving');
        setTimeout(() => {
            canvas.classList.remove('is-leaving');
            render(true);
        }, 260);
    }

    // ---------- Перетаскивание полотна, инерция, масштаб ----------

    let panX = 0, panY = 0, zoom = 1;
    const ZOOM_MIN = 0.6, ZOOM_MAX = 1.6;
    let inertia = null;

    function limits() {
        const W = window.innerWidth, H = window.innerHeight;
        const w = canvasW * zoom, h = canvasH * zoom;
        const x = w <= W ? [(W - w) / 2, (W - w) / 2] : [W - w, 0];
        const y = h <= H ? [(H - h) / 2, (H - h) / 2] : [H - h, 0];
        return { minX: x[0], maxX: x[1], minY: y[0], maxY: y[1] };
    }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function rubber(v, min, max) {
        if (v < min) return min - (min - v) * 0.35;
        if (v > max) return max + (v - max) * 0.35;
        return v;
    }

    function apply() {
        canvas.style.transform = 'translate3d(' + panX + 'px,' + panY + 'px,0) scale(' + zoom + ')';
    }

    function centerView() {
        const l = limits();
        panX = (l.minX + l.maxX) / 2;
        panY = (l.minY + l.maxY) / 2;
    }

    function glideTo(x, y) {
        canvas.classList.add('is-gliding');
        const l = limits();
        panX = clamp(x, l.minX, l.maxX);
        panY = clamp(y, l.minY, l.maxY);
        apply();
        clearTimeout(glideTo.t);
        glideTo.t = setTimeout(() => canvas.classList.remove('is-gliding'), 620);
    }

    function stopInertia() {
        if (inertia) cancelAnimationFrame(inertia);
        inertia = null;
    }

    function runInertia(vx, vy) {
        let last = performance.now();
        function step(now) {
            const dt = Math.min(32, now - last) / 16.67;
            last = now;
            const l = limits();
            const friction = Math.pow(0.94, dt);
            vx *= friction;
            vy *= friction;
            panX += vx * dt;
            panY += vy * dt;
            // за краем - пружиним обратно
            if (panX < l.minX) { panX += (l.minX - panX) * 0.18 * dt; vx *= 0.6; }
            if (panX > l.maxX) { panX += (l.maxX - panX) * 0.18 * dt; vx *= 0.6; }
            if (panY < l.minY) { panY += (l.minY - panY) * 0.18 * dt; vy *= 0.6; }
            if (panY > l.maxY) { panY += (l.maxY - panY) * 0.18 * dt; vy *= 0.6; }
            apply();
            const outside = panX < l.minX - 0.5 || panX > l.maxX + 0.5 || panY < l.minY - 0.5 || panY > l.maxY + 0.5;
            if (Math.abs(vx) > 0.08 || Math.abs(vy) > 0.08 || outside) {
                inertia = requestAnimationFrame(step);
            } else {
                panX = clamp(panX, l.minX, l.maxX);
                panY = clamp(panY, l.minY, l.maxY);
                apply();
                inertia = null;
            }
        }
        inertia = requestAnimationFrame(step);
    }

    const pointers = new Map();
    let drag = null;
    let pinch = null;
    let suppressClick = false;

    stage.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        stopInertia();
        canvas.classList.remove('is-gliding');
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
            const [a, b] = Array.from(pointers.values());
            pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, panX, panY };
            drag = null;
            return;
        }
        drag = {
            id: e.pointerId, sx: e.clientX, sy: e.clientY, px: panX, py: panY,
            moved: false, samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]
        };
    });

    stage.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinch && pointers.size === 2) {
            const [a, b] = Array.from(pointers.values());
            const z = clamp(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist, ZOOM_MIN, ZOOM_MAX);
            panX = pinch.cx - (pinch.cx - pinch.panX) * (z / pinch.zoom);
            panY = pinch.cy - (pinch.cy - pinch.panY) * (z / pinch.zoom);
            zoom = z;
            apply();
            suppressClick = true;
            return;
        }

        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) > 6) {
            drag.moved = true;
            stage.classList.add('is-dragging');
            try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ничего */ }
            hideHint();
        }
        if (!drag.moved) return;
        const l = limits();
        panX = rubber(drag.px + dx, l.minX, l.maxX);
        panY = rubber(drag.py + dy, l.minY, l.maxY);
        apply();
        drag.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
        if (drag.samples.length > 6) drag.samples.shift();
    });

    function endPointer(e) {
        pointers.delete(e.pointerId);
        if (pinch) {
            if (pointers.size < 2) {
                pinch = null;
                updateZoomButtons();
                runInertia(0, 0);
            }
            return;
        }
        if (!drag || drag.id !== e.pointerId) return;
        stage.classList.remove('is-dragging');
        if (drag.moved) {
            suppressClick = true;
            const s = drag.samples;
            const first = s[0], last = s[s.length - 1];
            const dt = Math.max(1, last.t - first.t);
            const fresh = e.timeStamp - last.t < 80;
            const vx = fresh ? (last.x - first.x) / dt * 16.67 : 0;
            const vy = fresh ? (last.y - first.y) / dt * 16.67 : 0;
            runInertia(clamp(vx, -60, 60), clamp(vy, -60, 60));
        }
        drag = null;
    }

    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    stage.addEventListener('wheel', (e) => {
        e.preventDefault();
        stopInertia();
        canvas.classList.remove('is-gliding');
        if (e.ctrlKey) {
            zoomAt(zoom * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY, false);
            return;
        }
        const l = limits();
        panX = clamp(panX - e.deltaX, l.minX, l.maxX);
        panY = clamp(panY - e.deltaY, l.minY, l.maxY);
        apply();
        hideHint();
    }, { passive: false });

    // Нажатие на блюдо (тап без перетаскивания или Enter с клавиатуры)
    canvas.addEventListener('click', (e) => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        const dish = e.target.closest('.dish');
        if (dish) openRecipe(dish.getAttribute('data-id'), true);
    });

    stage.addEventListener('pointerdown', () => { suppressClick = false; }, true);

    function zoomAt(z, cx, cy, smooth) {
        z = clamp(z, ZOOM_MIN, ZOOM_MAX);
        const x = cx - (cx - panX) * (z / zoom);
        const y = cy - (cy - panY) * (z / zoom);
        zoom = z;
        if (smooth) {
            glideTo(x, y);
        } else {
            const l = limits();
            panX = clamp(x, l.minX, l.maxX);
            panY = clamp(y, l.minY, l.maxY);
            apply();
        }
        updateZoomButtons();
    }

    function updateZoomButtons() {
        $('zoomIn').disabled = zoom >= ZOOM_MAX - 0.01;
        $('zoomOut').disabled = zoom <= ZOOM_MIN + 0.01;
    }

    $('zoomIn').addEventListener('click', () => zoomAt(zoom + 0.25, window.innerWidth / 2, window.innerHeight / 2, true));
    $('zoomOut').addEventListener('click', () => zoomAt(zoom - 0.25, window.innerWidth / 2, window.innerHeight / 2, true));

    // Стрелки клавиатуры двигают полотно
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if ($('customAlert').classList.contains('show')) hideAlert();
            else if ($('stepDetailAlert').classList.contains('show')) hideStepDetail();
            else if (recipePanel.classList.contains('is-open')) closeRecipe();
            else closeMenu();
            return;
        }
        if (recipePanel.classList.contains('is-open') || menu.classList.contains('is-open')) return;
        const step = 160;
        const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (moves[e.key] && !e.target.closest('input, textarea')) {
            e.preventDefault();
            glideTo(panX + moves[e.key][0], panY + moves[e.key][1]);
        }
    });

    // Подсказка «тяните» исчезает после первого перетаскивания
    const hint = $('dragHint');
    if (load('dragHintSeen', '') === '1') hint.classList.add('is-gone');
    function hideHint() {
        if (hint.classList.contains('is-gone')) return;
        hint.classList.add('is-gone');
        store('dragHintSeen', '1');
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            render(false);
            if (openId) {
                markSelected(openId);
                placeSheet(sheetState);
            }
        }, 150);
    });

    // ---------- Панель рецепта ----------

    let openId = null;
    let sheetState = 'closed';
    let lastFocus = null;

    function isDesktop() { return desktopQuery.matches; }

    function sheetHeight() { return recipePanel.offsetHeight || window.innerHeight; }

    function peekOffset() {
        return Math.max(0, sheetHeight() - Math.round(window.innerHeight * 0.7));
    }

    function placeSheet(state) {
        sheetState = state;
        if (isDesktop()) {
            recipePanel.style.removeProperty('--sheet-y');
            return;
        }
        const y = state === 'full' ? 0 : state === 'peek' ? peekOffset() : sheetHeight();
        recipePanel.style.setProperty('--sheet-y', y + 'px');
    }

    function markSelected(id) {
        canvas.querySelectorAll('.dish').forEach(d => d.classList.toggle('is-selected', d.getAttribute('data-id') === id));
        canvas.classList.toggle('has-selection', !!id && isDesktop());
        if (!id || !isDesktop()) return;
        const it = items.find(i => i.recipe.id === id);
        if (!it) return;
        // Блюдо встаёт в центр свободной части экрана слева от панели
        const freeW = window.innerWidth - recipePanel.offsetWidth;
        glideTo(freeW / 2 - it.x * zoom, window.innerHeight / 2 - it.y * zoom);
    }

    function fillRecipe(recipe) {
        $('recipeName').textContent = recipe.name;
        const photo = $('recipePhoto');
        photo.src = recipe.image;
        photo.alt = recipe.name;
        $('recipeDesc').textContent = recipe.description || '';

        const labels = { protein: 'белки, г', fat: 'жиры, г', carbs: 'углеводы, г', kcal: 'ккал' };
        const n = recipe.nutrition || {};
        const keys = Object.keys(labels).filter(k => n[k]);
        $('nutrition').hidden = keys.length === 0;
        $('nutrition').innerHTML = keys.map(k => '<div><dt>' + labels[k] + '</dt><dd>' + escapeHtml(n[k]) + '</dd></div>').join('');

        $('ingredientsCount').textContent = recipe.ingredients.length;
        $('stepsCount').textContent = recipe.steps.length;

        $('ingredientsList').innerHTML = recipe.ingredients.map(text => {
            const [name, amount] = splitAmount(text);
            return '<li><button class="ingredient-item" type="button" aria-pressed="false" data-ingredient="' + escapeHtml(text) + '">' +
                '<span class="check"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.2 4.2 7.4 8 3"/></svg></span>' +
                '<span>' + escapeHtml(name) + '</span>' +
                (amount ? '<span class="ingredient-amount">' + escapeHtml(amount) + '</span>' : '') +
                '</button></li>';
        }).join('');

        $('cookingList').innerHTML = recipe.steps.map((s, i) => {
            const num = String(i + 1).padStart(2, '0');
            const detail = s.detail && s.detail.length;
            return '<li><button class="cooking-item ' + (detail ? 'clickable' : 'no-click') + '" type="button" data-step="' + i + '"' +
                (detail ? '' : ' aria-pressed="false"') + '>' +
                '<span class="step-num">' + num + '</span>' +
                '<span><span class="step-text">' + escapeHtml(s.text) + '</span>' +
                (detail ? '<br><span class="step-more"><svg class="icon" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1v8M1 5h8"/></svg>что понадобится</span>' : '') +
                '</span></button></li>';
        }).join('');

        updateSaveButton();
        updateFavoriteButton(recipe);
        switchTab('ingredients');
        recipeScroll.scrollTop = 0;
    }

    function openRecipe(id, push) {
        const recipe = byId[id];
        if (!recipe) return;
        closeMenu();
        const wasOpen = recipePanel.classList.contains('is-open');
        openId = id;
        store('selectedRecipe', recipe.name);
        fillRecipe(recipe);
        if (!wasOpen) lastFocus = document.activeElement;
        recipePanel.classList.add('is-open');
        scrim.classList.add('is-on');
        if (!wasOpen && !isDesktop()) {
            placeSheet('closed');
            recipePanel.getBoundingClientRect();
        }
        placeSheet('peek');
        markSelected(id);
        document.title = recipe.name + ' | Polkovniki Lubvi';
        if (push) history.pushState({ recipe: id }, '', '#' + id);
        setTimeout(() => $('closeRecipe').focus({ preventScroll: true }), 80);
    }

    function closeRecipe(fromHistory) {
        if (!recipePanel.classList.contains('is-open')) return;
        recipePanel.classList.remove('is-open');
        scrim.classList.remove('is-on');
        placeSheet('closed');
        openId = null;
        markSelected(null);
        document.title = 'Рецепты | Polkovniki Lubvi';
        if (!fromHistory) {
            if (history.state && history.state.recipe) history.back();
            else history.replaceState(null, '', location.pathname + location.search);
        }
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    $('closeRecipe').addEventListener('click', () => closeRecipe());
    scrim.addEventListener('click', () => closeRecipe());

    window.addEventListener('popstate', () => {
        const id = location.hash.slice(1);
        if (byId[id]) openRecipe(id, false);
        else closeRecipe(true);
    });

    // Вкладки
    const tabBtns = document.querySelectorAll('.tab-btn');
    function switchTab(tabId) {
        tabBtns.forEach(btn => {
            const on = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $('ingredients').hidden = tabId !== 'ingredients';
        $('cooking').hidden = tabId !== 'cooking';
    }
    tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));

    // Избранное (как раньше: список названий в localStorage 'favorites')
    function updateFavoriteButton(recipe) {
        const on = getFavorites().indexOf(recipe.name) !== -1;
        const btn = $('savePhoto');
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Убрать из избранного' : 'В избранное');
    }

    $('savePhoto').addEventListener('click', (e) => {
        e.stopPropagation();
        const recipe = byId[openId];
        if (!recipe) return;
        const favorites = getFavorites();
        const index = favorites.indexOf(recipe.name);
        if (index !== -1) favorites.splice(index, 1);
        else favorites.push(recipe.name);
        setFavorites(favorites);
        updateFavoriteButton(recipe);
        const btn = $('savePhoto');
        btn.classList.remove('is-pop');
        void btn.offsetWidth;
        if (index === -1) btn.classList.add('is-pop');
        updateChrome();
        if (currentCategory === FAVORITES) {
            render(false);
            markSelected(openId);
        }
    });

    // Ингредиенты: выбор и копирование
    $('ingredientsList').addEventListener('click', (e) => {
        const item = e.target.closest('.ingredient-item');
        if (!item) return;
        item.classList.toggle('selected');
        item.setAttribute('aria-pressed', item.classList.contains('selected') ? 'true' : 'false');
        updateSaveButton();
    });

    function updateSaveButton() {
        const n = document.querySelectorAll('.ingredient-item.selected').length;
        $('saveIngredientsBtn').textContent = n ? 'Скопировать выбранные · ' + n : 'Скопировать выбранные';
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
        }
        return Promise.resolve(legacyCopy(text));
    }

    function legacyCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(textarea);
        return ok;
    }

    $('saveIngredientsBtn').addEventListener('click', () => {
        const selected = document.querySelectorAll('.ingredient-item.selected');
        if (selected.length === 0) {
            showCustomAlert('────୨ৎ────', 'Выберите ингредиенты, которые хотите сохранить');
            return;
        }
        const text = Array.from(selected).map(el => el.getAttribute('data-ingredient')).join('\n');
        copyToClipboard(text).then(ok => {
            if (ok) showCustomAlert('Ингредиенты скопированы!', text + '\n\n────୨ৎ────');
            else showCustomAlert('Не получилось', 'Не удалось скопировать. Попробуйте ещё раз.');
        });
    });

    // Шаги: с подсказкой - открывают окошко, остальные отмечаются как сделанные
    $('cookingList').addEventListener('click', (e) => {
        const item = e.target.closest('.cooking-item');
        if (!item) return;
        const recipe = byId[openId];
        const step = recipe && recipe.steps[+item.getAttribute('data-step')];
        if (!step) return;
        if (step.detail && step.detail.length) {
            showStepDetail(step.detail);
        } else {
            item.classList.toggle('selected-green');
            item.setAttribute('aria-pressed', item.classList.contains('selected-green') ? 'true' : 'false');
        }
    });

    // ---------- Окошки ----------

    let dialogReturn = null;

    function showCustomAlert(title, message) {
        dialogReturn = document.activeElement;
        $('customAlertTitle').textContent = title;
        $('customAlertText').textContent = message;
        $('customAlert').classList.add('show');
        setTimeout(() => $('customAlertBtn').focus(), 50);
    }

    function hideAlert() {
        $('customAlert').classList.remove('show');
        if (dialogReturn) dialogReturn.focus({ preventScroll: true });
    }

    function showStepDetail(lines) {
        dialogReturn = document.activeElement;
        $('stepDetailList').innerHTML = lines.map(line => {
            const [name, amount] = splitAmount(line);
            return '<li><span>' + escapeHtml(name) + '</span>' + (amount ? '<span>' + escapeHtml(amount) + '</span>' : '') + '</li>';
        }).join('');
        $('stepDetailAlert').classList.add('show');
        setTimeout(() => $('stepDetailBtn').focus(), 50);
    }

    function hideStepDetail() {
        $('stepDetailAlert').classList.remove('show');
        if (dialogReturn) dialogReturn.focus({ preventScroll: true });
    }

    $('customAlertBtn').addEventListener('click', hideAlert);
    $('stepDetailBtn').addEventListener('click', hideStepDetail);
    $('customAlert').addEventListener('click', (e) => { if (e.target === e.currentTarget) hideAlert(); });
    $('stepDetailAlert').addEventListener('click', (e) => { if (e.target === e.currentTarget) hideStepDetail(); });

    // ---------- Свайпы в панели (телефон) ----------
    // Вверх - раскрыть, вниз - свернуть/закрыть, влево/вправо - переключить вкладку

    let touch = null;

    function onTouchStart(e) {
        if (isDesktop() || e.touches.length !== 1) return;
        const t = e.touches[0];
        touch = {
            x: t.clientX, y: t.clientY, mode: null,
            fromHandle: !!e.target.closest('.recipe-handle'),
            base: sheetState === 'full' ? 0 : peekOffset(),
            samples: [{ y: t.clientY, t: e.timeStamp }]
        };
    }

    function onTouchMove(e) {
        if (!touch) return;
        const t = e.touches[0];
        const dx = t.clientX - touch.x, dy = t.clientY - touch.y;

        if (!touch.mode) {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            if (Math.abs(dx) > Math.abs(dy) * 1.4) {
                touch.mode = 'tabs';
            } else {
                const atTop = recipeScroll.scrollTop <= 0;
                const wantsSheet = touch.fromHandle ||
                    (sheetState === 'peek' && dy < 0) ||
                    (atTop && dy > 0);
                touch.mode = wantsSheet ? 'sheet' : 'scroll';
                if (touch.mode === 'sheet') recipePanel.classList.add('is-dragging');
            }
        }

        if (touch.mode === 'tabs') {
            e.preventDefault();
            if (Math.abs(dx) > 50) {
                switchTab(dx < 0 ? 'cooking' : 'ingredients');
                touch = null;
            }
            return;
        }

        if (touch.mode === 'sheet') {
            e.preventDefault();
            let y = touch.base + dy;
            if (y < 0) y = y * 0.25;
            recipePanel.style.setProperty('--sheet-y', y + 'px');
            touch.samples.push({ y: t.clientY, t: e.timeStamp });
            if (touch.samples.length > 5) touch.samples.shift();
        }
    }

    function onTouchEnd() {
        if (!touch) return;
        if (touch.mode === 'sheet') {
            recipePanel.classList.remove('is-dragging');
            const s = touch.samples, first = s[0], last = s[s.length - 1];
            const v = (last.y - first.y) / Math.max(1, last.t - first.t);
            const y = touch.base + (last.y - touch.y);
            const peek = peekOffset();
            if (v > 0.5 || y > peek + 90) {
                if (sheetState === 'full' && y < peek + 90) placeSheet('peek');
                else closeRecipe();
            } else if (v < -0.4 || y < peek / 2) {
                placeSheet('full');
            } else {
                placeSheet(sheetState === 'full' && y < peek / 2 ? 'full' : 'peek');
            }
        }
        touch = null;
    }

    recipePanel.addEventListener('touchstart', onTouchStart, { passive: true });
    recipePanel.addEventListener('touchmove', onTouchMove, { passive: false });
    recipePanel.addEventListener('touchend', onTouchEnd);
    recipePanel.addEventListener('touchcancel', onTouchEnd);

    // Скролл содержимого вверх в свёрнутом виде раскрывает панель
    recipeScroll.addEventListener('scroll', () => {
        if (!isDesktop() && sheetState === 'peek' && recipeScroll.scrollTop > 4) placeSheet('full');
    });

    $('drawerHandle').addEventListener('click', () => {
        placeSheet(sheetState === 'full' ? 'peek' : 'full');
    });

    desktopQuery.addEventListener('change', () => {
        if (openId) placeSheet('peek');
        else placeSheet('closed');
    });

    // ---------- Старт ----------

    // Старые ссылки: favorites.html ведёт на menu.html#favorites
    const startHash = decodeURIComponent(location.hash.slice(1));
    if (startHash === FAVORITES) {
        currentCategory = FAVORITES;
        store('currentCategory', FAVORITES);
        history.replaceState(null, '', location.pathname);
    }

    placeSheet('closed');
    render(true);
    requestAnimationFrame(() => $('pageFade').classList.add('is-hidden'));

    if (byId[startHash]) {
        history.replaceState(null, '', location.pathname);
        history.pushState({ recipe: startHash }, '', '#' + startHash);
        openRecipe(startHash, false);
    }

    // Переход на главную - с тем же мягким затуханием
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            $('pageFade').classList.remove('is-hidden');
            setTimeout(() => { window.location.href = a.getAttribute('href'); }, 380);
        });
    });

    window.addEventListener('pageshow', () => $('pageFade').classList.add('is-hidden'));
});
