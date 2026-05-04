// Управление стопкой карточек
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.recipe-card');
    let currentIndex = 0;
    let currentCategory = 'first';
    
    // Данные для разных категорий
    const recipesByCategory = {
        first: [
            { name: "Суп Фо Бо", description: "Ароматный бульон, нежная говядина, свежий лайм и охлаждающая мята создают невероятный баланс — насыщенный, яркий и гармоничный. Это не просто суп, это кулинарное путешествие во Вьетнам!", image: "Рисунок1.png" },
        ],
        second: [
            { name: "Чахохбили ", description: "Простое, но очень вкусное грузинское блюдо - курочка, тушёная с помидорами и специями. Мясо получается мягким и сочным, а томатный соус - ароматным. Хмели-сунели, кориандр и зелень добавляют характерный грузинский колорит.", image: "Рисунок2.png" },
            { name: "Минтай с черри помидорками", description: "Нежное филе минтая, обжаренное до золотистой корочки, сочетается с яркими черри-томатами, которые лопаются во рту, оставляя сладковатый след. Лёгкая лимонная нотка завершает вкус — свежо, просто и изысканно.", image: "Рисунок3.png" },
            { name: "Курочка в кисло-сладком соусе", description: "Нежная курочка по-гонконгски в хрустящей корочке, политая кисло-сладким соусом с кусочками спелого ананаса. Взрыв вкуса: острое, сладкое и пикантное в каждом укусе. Просто бомба!", image: "Рисунок4.png" }
        ],
        sweet: [
            { name: "Мясная пицца", description: "Нежное филе грудки индейки, ароматный бекон и тягучая моцарелла на томатном соусе. Итальянские травы раскрывают каждый вкус, создавая идеальную гармонию. Настоящая мясная бомба!", image: "Рисунок8.png" },
            { name: "Пицца камамбер", description: "Нежная груша, томленый камамбер с благородной плесенью и горный мёд создают гармонию сладкого, пикантного и сливочного. Хрустящая основа, тающая начинка – это не просто пицца, а десерт для гурманов!", image: "Рисунок9.png" },
            { name: "Творожные бейглы", description: "Творожная основа идеально сочетается с нежным карбонатом индейки или котлетками, свежим салатом и творожным сыром. Лёгкие нотки зелени дополняют этот насыщенный вкус. Идеально для сытного перекуса.", image: "Рисунок5.png" },
            { name: "Чизкейк с рикоттой", description: "Этот чизкейк получился удивительно воздушным и лёгким, с мягким сливочным вкусом настоящей рикотты. Нежная текстура просто тает во рту, оставляя тонкий молочный оттенок и приятную сладость итальянской рикотты.", image: "Рисунок6.png" },
            { name: "Шоколадный Сан-Себастьян", description: "Нежный, с кремообразной сердцевиной, которая напоминает подтаявшее шоколадное мороженое. Каждый кусочек — гладкий, насыщенный и бесконечно вкусный. Шоколадное наслаждение без лишних слов.", image: "Рисунок7.png" },
            { name: "Творожно-банановый кекс", description: "Воздушная творожная основа, сладость спелого банана и лёгкая ванильная нотка. Мягкий, влажный, с золотистой корочкой — идеально к чаю или кофе. Просто, вкусно и уютно!", image: "Рисунок10.png" },
            { name: "Творожные синнабоны с греческим йогуртом", description: "Горячие, воздушные, с ароматной начинкой из корицы и тростникового сахара. Нежный крем из греческого йогурта слегка подтаивает на тёплой выпечке. Полезная альтернатива классическим булочкам — тот самый случай, когда вкусно и без лишней тяжести. Идеально к утреннему кофе.", image: "Рисунок11.png" },
            { name: "Шарлотка", description: "Нежная, как облако, и простая, как самое тёплое воспоминание. Снаружи — золотистая корочка, внутри — мягкая яблочная нежность, тающая во рту. Идеально с чашкой чая и сметаной в тихий вечер.", image: "Рисунок12.png" },
            { name: "Творожные оладьи", description: "ооо", image: "Рисунок13.png" },
            { name: "Шоколадный клафути с вишней", description: "Тёплый десерт с нежной текстурой и насыщенным вкусом шоколада. Сочная вишня добавляет приятную кислинку. А если добавить шарик ванильного мороженого — получится идеальный контраст: горячее и холодное, нежное и тающее.", image: "Рисунок14.png" },
        ],
        salads: [
            { name: "Цезарь", description: "Классический салат с курицей, пармезаном и соусом цезарь", image: "l4.png" },
            { name: "Вителло-тоннато", description: "Изысканная говядина су-вид с соусом тоннато", image: "l4.png" },
            { name: "Салат с ростбифом", description: "Сочный ростбиф с миксом салата и печёным перцем", image: "l4.png" }
        ],
        drinks: [
            { name: "Эспрессо", description: "Крепкий и ароматный кофе для бодрости", image: "l4.png" },
            { name: "Капучино", description: "Нежный кофе с пышной молочной пенкой", image: "l4.png" },
            { name: "Масала", description: "Пряный индийский чай с молоком и специями", image: "l4.png" }
        ],
        snacks: [
            { name: "Хачапури", description: "Грузинская лепёшка с расплавленным сыром и яйцом", image: "l4.png" },
            { name: "Курица чили", description: "Пикантная курица с чеддером и халапеньо", image: "l4.png" },
            { name: "С креветками", description: "Нежные креветки с авокадо и айоли", image: "l4.png" }
        ],
        preps: [
            { name: "Соленья", description: "Домашние солёные огурчики и помидорчики", image: "l4.png" },
            { name: "Варенье", description: "Ароматное варенье из ягод и фруктов", image: "l4.png" },
            { name: "Маринады", description: "Пряные маринады для мяса и овощей", image: "l4.png" }
        ],
        combo: [
            { name: "Комбо №1", description: "Сытный обед: суп + второе + салат", image: "l4.png" },
            { name: "Комбо №2", description: "Перекус: закуска + напиток + десерт", image: "l4.png" },
            { name: "Семейный обед", description: "Большой набор для всей семьи на 4 персоны", image: "l4.png" }
        ]
    };
    
    // Порядок категорий для навигации
    const categoryOrder = ['first', 'second', 'sweet', 'salads', 'drinks', 'snacks', 'preps', 'combo'];
    const categoryNames = {
        first: 'Первое',
        second: 'Второе',
        sweet: 'Выпечка и десерты',
        salads: 'Салаты',
        drinks: 'Напитки',
        snacks: 'Закуски',
        preps: 'Заготовки',
        combo: 'Комбо'
    };
    
    let currentRecipes = recipesByCategory.first;
    let isAnimating = false;
    let isBouncing = false;
    
    // СОХРАНЕНИЕ СОСТОЯНИЯ В localStorage
    function saveState() {
        localStorage.setItem('currentCategory', currentCategory);
        localStorage.setItem('currentCardIndex', currentIndex);
    }
    
    function loadSavedState() {
        const savedCategory = localStorage.getItem('currentCategory');
        const savedIndex = localStorage.getItem('currentCardIndex');
        
        if (savedCategory && recipesByCategory[savedCategory]) {
            currentCategory = savedCategory;
            currentRecipes = recipesByCategory[currentCategory];
            currentIndex = parseInt(savedIndex) || 0;
            
            // Проверяем, что индекс не выходит за пределы
            if (currentIndex >= currentRecipes.length) {
                currentIndex = 0;
            }
        } else {
            currentCategory = 'first';
            currentRecipes = recipesByCategory.first;
            currentIndex = 0;
        }
        
        // Обновляем активную кнопку категории
        categoryBtns.forEach(btn => {
            const category = btn.getAttribute('data-category');
            if (category === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        showCard(currentIndex);
    }
    
    function showCard(index) {
        const recipe = currentRecipes[index];
        const cardContent = document.querySelector('.recipe-card .card-content');
        
        if (cardContent && recipe) {
            cardContent.innerHTML = `
                <div style="display: flex; flex-direction: column; height: 100%; position: relative;">
                    <h3 style="font-family: 'New', sans-serif; color: #5a3921; margin-bottom: 8px; font-size: 20px; margin-top: 5px;">${recipe.name}</h3>
                    <p style="font-family: 'Mon'; color: #5a3921; opacity: 0.8; font-size: 11px; text-align: right; line-height: 1.4; margin-bottom: 12px;">${recipe.description}</p>
                    <img src="${recipe.image}" style="width: 304px; height: 250px; object-fit: cover; border-radius: 16px; position: absolute; bottom: -70px; right: -20px; opacity: 0.9;" alt="${recipe.name}">
                </div>
            `;
        }
    }
    
    function changeCategory(category) {
        if (recipesByCategory[category]) {
            currentCategory = category;
            currentRecipes = recipesByCategory[category];
            currentIndex = 0;
            showCard(currentIndex);
            saveState();
        }
    }
    
    function switchCategory(direction) {
        const currentPos = categoryOrder.indexOf(currentCategory);
        let newPos = direction === 'next' ? currentPos + 1 : currentPos - 1;
        
        if (newPos >= 0 && newPos < categoryOrder.length) {
            const newCategory = categoryOrder[newPos];
            changeCategory(newCategory);
            
            // Обновляем активную кнопку
            categoryBtns.forEach(btn => {
                const category = btn.getAttribute('data-category');
                if (category === newCategory) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }
    
    function nextCard() {
        if (isAnimating || isBouncing) return;
        if (currentIndex < currentRecipes.length - 1) {
            isAnimating = true;
            const card = document.querySelector('.recipe-card');
            card.classList.add('fade-out-up');
            
            setTimeout(() => {
                currentIndex++;
                showCard(currentIndex);
                card.classList.remove('fade-out-up');
                isAnimating = false;
                saveState();
            }, 350);
        }
    }
    
    function prevCard() {
        if (isAnimating || isBouncing) return;
        if (currentIndex > 0) {
            isAnimating = true;
            const card = document.querySelector('.recipe-card');
            card.classList.add('fade-out-down');
            
            setTimeout(() => {
                currentIndex--;
                showCard(currentIndex);
                card.classList.remove('fade-out-down');
                isAnimating = false;
                saveState();
            }, 350);
        }
    }
    
    // Функция "пружинного" эффекта при достижении границы
    function bounceCard(direction) {
        if (isBouncing) return;
        isBouncing = true;
        const card = document.querySelector('.recipe-card');
        
        const originalTransition = card.style.transition;
        
        card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        
        if (direction === 'up') {
            card.style.transform = 'translateY(-8px)';
            setTimeout(() => {
                card.style.transform = 'translateY(0)';
                setTimeout(() => {
                    card.style.transition = originalTransition;
                    isBouncing = false;
                }, 400);
            }, 120);
        } else if (direction === 'down') {
            card.style.transform = 'translateY(8px)';
            setTimeout(() => {
                card.style.transform = 'translateY(0)';
                setTimeout(() => {
                    card.style.transition = originalTransition;
                    isBouncing = false;
                }, 400);
            }, 120);
        }
    }
    
    // Кнопки категорий
    const categoryBtns = document.querySelectorAll('.cat-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            if (category) {
                changeCategory(category);
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Избранное
    const favoritePhoto = document.getElementById('favoriteIcon');
    if (favoritePhoto) {
        favoritePhoto.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'favorites.html';
        });
    }
    
    // ЛИСТАНИЕ КАРТОЧЕК С BOUNCE-ЭФФЕКТОМ
    let touchStartY = 0;
    let touchStartX = 0;
    let isSwiping = false;
    let swipeThreshold = 40;
    const cardEl = document.querySelector('.recipe-card');
    
    function onTouchStart(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
    }
    
    function onTouchMove(e) {
        if (!isSwiping || isAnimating || isBouncing) return;
        
        const deltaY = e.touches[0].clientY - touchStartY;
        const deltaX = e.touches[0].clientX - touchStartX;
        
        // СВАЙПЫ ВЛЕВО/ВПРАВО ДЛЯ ПЕРЕКЛЮЧЕНИЯ КАТЕГОРИЙ
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) {
                // Свайп вправо - предыдущая категория
                switchCategory('prev');
            } else {
                // Свайп влево - следующая категория
                switchCategory('next');
            }
            isSwiping = false;
            return;
        }
        
        // ВЕРТИКАЛЬНЫЕ СВАЙПЫ ДЛЯ КАРТОЧЕК
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0) {
                // Свайп вниз
                if (currentIndex > 0) {
                    prevCard();
                } else {
                    bounceCard('down');
                }
            } else {
                // Свайп вверх
                if (currentIndex < currentRecipes.length - 1) {
                    nextCard();
                } else {
                    bounceCard('up');
                }
            }
            isSwiping = false;
        }
    }
    
    function onTouchEnd() {
        isSwiping = false;
    }
    
    if (cardEl) {
        cardEl.addEventListener('touchstart', onTouchStart, { passive: false });
        cardEl.addEventListener('touchmove', onTouchMove, { passive: false });
        cardEl.addEventListener('touchend', onTouchEnd);
    }
    
    // Клик по карточке
    const recipeCard = document.querySelector('.recipe-card');
    if (recipeCard) {
        recipeCard.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentRecipe = currentRecipes[currentIndex];
            if (currentRecipe) {
                const recipeName = currentRecipe.name.trim();
                localStorage.setItem('selectedRecipe', recipeName);
                // Сохраняем текущее состояние перед переходом
                saveState();
                
                let targetPage = '';
                if (recipeName === 'Мясная пицца') targetPage = 'pizzasuper.html';
                else if (recipeName === 'Суп Фо Бо') targetPage = 'phobo.html';
                else if (recipeName === 'Чахохбили') targetPage = 'chahohbili.html';
                else if (recipeName === 'Минтай с черри помидорками') targetPage = 'mintai.html';
                else if (recipeName === 'Курочка в кисло-сладком соусе') targetPage = 'kurochka.html';
                else if (recipeName === 'Пицца камамбер') targetPage = 'camamber.html';
                else if (recipeName === 'Творожные бейглы') targetPage = 'beigl.html';
                else if (recipeName === 'Чизкейк с рикоттой') targetPage = 'cheez.html';
                else if (recipeName === 'Шоколадный Сан-Себастьян') targetPage = 'sansebast.html';
                else if (recipeName === 'Творожно-банановый кекс') targetPage = 'tvorogkekc.html';
                else targetPage = 'recipe-default.html';
                
                window.location.href = targetPage;
            }
        });
    }
    
    // Восстанавливаем сохранённое состояние при загрузке
    loadSavedState();
});